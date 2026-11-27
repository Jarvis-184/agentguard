/**
 * agent.ts — one paid job cycle: guard the policy, pay over x402 from the
 * smart account's session key, verify with Celo's hosted facilitator, settle
 * on-chain, and log the result for the dashboard. Run on a schedule by the
 * operator.
 *
 * Why not fetchWithX402 against the buy gateway: its embedded verifier only
 * accepts plain EOA EIP-3009 signatures (ecrecover), so a smart-account payer
 * can never match there. The same payment verifies cleanly through the hosted
 * facilitator (ERC-1271) and settles via transferWithAuthorization.
 *
 * Usage: npm run agent
 */
import {
  createClient,
  signerFromPrivateKey,
  deserializeSession,
  signX402Payment,
} from "@altananetwork/sdk";
import { readFileSync, appendFileSync, existsSync } from "node:fs";
import { createPublicClient, createWalletClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { celo, celoSepolia } from "viem/chains";
import {
  CHAINS,
  NETWORK,
  PAY_TOKEN,
  DAILY_CAP_USDT,
  SESSION_DAYS,
  ALLOWED_CALLS,
  MERCHANT_ADDRESS,
  FACILITATOR_URL,
  JOB_PRICE_UNITS,
  EXPLORER_TX,
} from "./config.js";
import { checkJob, type Policy } from "./guard.js";
import { ATTRIBUTION_SUFFIX } from "./tags.js";

const stored = JSON.parse(readFileSync("session.json", "utf8"));
const sessionPk = readFileSync(".agent_session_key", "utf8").trim() as `0x${string}`;
const session = deserializeSession(stored, signerFromPrivateKey(sessionPk));
const wallet = stored.walletAddress;

const policy: Policy = {
  allowedContracts: ALLOWED_CALLS.map((c) => c.to.toLowerCase()),
  dailyCapUnits: DAILY_CAP_USDT,
  expiryUnix: session.expiry ?? Math.floor(Date.now() / 1000) + SESSION_DAYS * 86400,
};

// Spending so far today, from the local job log (the keystore enforces it onchain).
const today = new Date().toISOString().slice(0, 10);
const spentToday = existsSync("jobs.jsonl")
  ? readFileSync("jobs.jsonl", "utf8")
      .split("\n")
      .filter((l) => l.includes(today) && l.includes('"paidUnits"'))
      .reduce((sum, l) => sum + BigInt(JSON.parse(l).paidUnits ?? 0), 0n)
  : 0n;

const decision = checkJob(policy, PAY_TOKEN, JOB_PRICE_UNITS, spentToday);
appendFileSync("jobs.jsonl", JSON.stringify({ wallet, decision }) + "\n");
if (!decision.ok) {
  console.error("guard refused:", decision.reason);
  process.exit(1);
}

// 1. Quote: what the merchant charges for the job (x402 payment requirements).
const requirements = {
  scheme: "exact",
  network: NETWORK === "celo" ? "celo" : "celo-sepolia",
  maxAmountRequired: JOB_PRICE_UNITS.toString(),
  resource: "https://agentguard.example/market-brief",
  description: "AgentGuard market-brief job",
  mimeType: "application/json",
  payTo: MERCHANT_ADDRESS,
  maxTimeoutSeconds: 300,
  asset: PAY_TOKEN,
  extra: { name: "USDC", version: "2", assetTransferMethod: "eip3009" },
};

// 2. Sign the EIP-3009 authorization with the session key (ERC-1271 nested).
const { payload } = await signX402Payment(session, { x402Version: 1, ...requirements } as any);

// 3. Verify with Celo's hosted facilitator (open endpoint, no key).
const vres = await fetch(`${FACILITATOR_URL}/verify`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ x402Version: 1, paymentPayload: payload, paymentRequirements: requirements }),
});
const verdict = (await vres.json()) as { isValid?: boolean; invalidReason?: string; payer?: string };
if (!verdict.isValid) {
  appendFileSync("jobs.jsonl", JSON.stringify({ wallet, refusedByFacilitator: verdict }) + "\n");
  console.error("facilitator refused:", verdict.invalidReason);
  process.exit(1);
}

// 4. Settle on-chain: anyone may submit transferWithAuthorization; the
// operator's key pays the gas. This direct settlement is what the Sepolia demo
// uses. A mainnet path through the facilitator's /settle is not implemented.
const adminKey = (process.env.ADMIN_PRIVATE_KEY ??
  readFileSync(".agent_admin_key", "utf8").trim()) as `0x${string}`; // owner key: pays settle gas only
const admin = privateKeyToAccount(adminKey);
const chain = NETWORK === "celo" ? celo : celoSepolia;
const rpc = NETWORK === "celo" ? "https://forno.celo.org" : "https://forno.celo-sepolia.celo-testnet.org";
const pc = createPublicClient({ chain, transport: http(rpc) });
const wc = createWalletClient({ account: admin, chain, transport: http(rpc) });
const settleAbi = parseAbi([
  "function transferWithAuthorization(address from, address to, uint256 value, uint256 validAfter, uint256 validBefore, bytes32 nonce, bytes signature)",
]);
const auth = (payload as any).payload.authorization;
const hash = await wc.writeContract({
  address: PAY_TOKEN,
  abi: settleAbi,
  functionName: "transferWithAuthorization",
  args: [
    auth.from,
    auth.to,
    BigInt(auth.value),
    BigInt(auth.validAfter),
    BigInt(auth.validBefore),
    auth.nonce,
    (payload as any).payload.signature,
  ],
  dataSuffix: ATTRIBUTION_SUFFIX,
});
const receipt = await pc.waitForTransactionReceipt({ hash });

appendFileSync(
  "jobs.jsonl",
  JSON.stringify({
    wallet,
    paidAt: new Date().toISOString(),
    paidUnits: JOB_PRICE_UNITS.toString(),
    merchant: MERCHANT_ADDRESS,
    facilitator: FACILITATOR_URL,
    tx: hash,
    explorer: `${EXPLORER_TX}${hash}`,
    status: receipt.status,
    block: receipt.blockNumber.toString(),
  }) + "\n",
);
console.log("paid and settled:", receipt.status, `${EXPLORER_TX}${hash}`);
