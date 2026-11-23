/**
 * snapshot.ts — reads the agent wallet's public onchain state and writes
 * web/data.json for the dashboard. No API keys: plain JSON-RPC via forno.
 *
 * Usage: AGENT_WALLET=0x... npm run snapshot
 */
import { createPublicClient, http, parseAbiItem, formatUnits } from "viem";
import { celo, celoSepolia } from "viem/chains";
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { NETWORK, PAY_TOKEN, PAY_SYMBOL, AGENT_IDENTITY, MERCHANT_ADDRESS } from "./config.js";
import { ATTRIBUTION_SUFFIX } from "./tags.js";

const wallet = process.env.AGENT_WALLET as `0x${string}`;
if (!wallet) throw new Error("AGENT_WALLET env var required");

const client = createPublicClient({
  chain: NETWORK === "celo" ? celo : celoSepolia,
  transport: http(NETWORK === "celo" ? "https://forno.celo.org" : "https://forno.celo-sepolia.celo-testnet.org"),
});

// ERC-8004 identity: does this wallet own an agent in the registry?
const REGISTRY = (NETWORK === "celo"
  ? "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432"
  : "0x8004A818BFB912233c491871b3d84c89A494BD9e") as `0x${string}`;
const balanceOfAbi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
] as const;
const agentCount = await client.readContract({
  address: REGISTRY,
  abi: balanceOfAbi,
  functionName: "balanceOf",
  args: [wallet],
});

// Altana relay fee recipient on Celo Sepolia (from the relay's wallet_getCapabilities).
const RELAY_FEE_RECIPIENT = "0xb248602eaadd9c3e2db4575c4e4d58003b7a2740";
// Payment-token transfers from the wallet, most recent 50, classified by recipient:
// job payments go to the merchant, relay fees to the Altana fee recipient.
const transferEvent = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)",
);
const latest = await client.getBlockNumber();
const fromBlock = latest > 200_000n ? latest - 99_500n : 0n;
const logs = await client.getLogs({
  address: PAY_TOKEN,
  event: transferEvent,
  args: { from: wallet },
  fromBlock,
  toBlock: latest,
});
const payments = [];
for (const log of logs.slice(-50)) {
  const tx = await client.getTransaction({ hash: log.transactionHash });
  const tagged = (tx.input as string).toLowerCase().endsWith(ATTRIBUTION_SUFFIX.toLowerCase().replace(/^0x/, ""));
  const to = (log.args.to as string).toLowerCase();
  payments.push({
    hash: log.transactionHash,
    to: log.args.to,
    kind: to === MERCHANT_ADDRESS.toLowerCase() ? "job payment" : to === RELAY_FEE_RECIPIENT ? "relay fee" : "other",
    amountUsdt: formatUnits(log.args.value ?? 0n, 6),
    block: Number(log.blockNumber),
    tagged,
  });
}

const jobs = existsSync("jobs.jsonl")
  ? readFileSync("jobs.jsonl", "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l))
  : [];

const payload = JSON.stringify(
    {
      wallet,
      paySymbol: PAY_SYMBOL,
      explorerTx: (NETWORK === "celo" ? "https://celoscan.io/tx/" : "https://celo-sepolia.blockscout.com/tx/"),
      explorerAddress: (NETWORK === "celo" ? "https://celoscan.io/address/" : "https://celo-sepolia.blockscout.com/address/"),
      agent8004: { id: "1047", registry: REGISTRY, scanUrl: "https://8004scan.io/agents/celo-sepolia/1047" },
      agent: AGENT_IDENTITY,
      erc8004Agents: Number(agentCount),
      payments,
      jobs: jobs.slice(-50),
      generatedAt: new Date().toISOString(),
    },
    null,
    2,
  );
writeFileSync("web/data.json", payload);
writeFileSync("web/data.js", "window.AGENTGUARD_SNAPSHOT = " + payload + ";\n");
console.log("web/data.json written:", payments.length, "payments,", jobs.length, "job log entries");
