/**
 * provision.ts — run once by the owner. Creates the Altana wallet, grants the
 * agent a scoped session (allowlist + daily cap + expiry) with x402 approvals,
 * and stores the session (no key material) in session.json. The session
 * private key lives only in .agent_session_key (gitignored, mode 600).
 *
 * Usage: ADMIN_PRIVATE_KEY=0x... npx tsx src/provision.ts
 */
import { createClient, signerFromPrivateKey, serializeSession } from "@altananetwork/sdk";
import { generatePrivateKey } from "viem/accounts";
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { CHAINS, ALLOWED_CALLS, DAILY_CAP_USDT, SESSION_DAYS, PAY_TOKEN, AGENT_IDENTITY } from "./config.js";

const admin = signerFromPrivateKey(process.env.ADMIN_PRIVATE_KEY as `0x${string}`);
const client = createClient({
  chains: CHAINS,
  agentIdentity: process.env.SKIP_IDENTITY ? false : AGENT_IDENTITY,
});

const wallet = await client.createWallet({ signer: admin });
console.log("wallet:", wallet.address);

const sessionPk = existsSync(".agent_session_key")
  ? (readFileSync(".agent_session_key", "utf8").trim() as `0x${string}`)
  : (writeFileSync(".agent_session_key", generatePrivateKey(), { mode: 0o600 }),
     readFileSync(".agent_session_key", "utf8").trim() as `0x${string}`);

const result = await client.grantSession({
  wallet,
  signer: admin,
  sessionSigner: signerFromPrivateKey(sessionPk),
  permissions: {
    calls: ALLOWED_CALLS,
    spend: [{ limit: DAILY_CAP_USDT, period: "day", token: PAY_TOKEN }],
  },
  expiry: Math.floor(Date.now() / 1000) + SESSION_DAYS * 24 * 60 * 60,
  x402Tokens: [PAY_TOKEN], // sets Permit2 allowance + both signature checkers in the same intent
});
console.log("session granted; status:", result.status, "; agent identities:", result.agentIdentities);

writeFileSync("session.json", JSON.stringify(serializeSession(result), null, 2));
console.log("session.json written (no key material); key in .agent_session_key — never commit it.");
