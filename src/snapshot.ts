/**
 * snapshot.ts — reads the agent wallet's public onchain state and writes
 * web/data.json for the dashboard. No API keys: plain JSON-RPC via forno.
 *
 * Usage: AGENT_WALLET=0x... npm run snapshot
 */
import { createPublicClient, http, parseAbiItem, formatUnits } from "viem";
import { celo } from "viem/chains";
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { USDT_CELO, AGENT_IDENTITY } from "./config.js";
import { ATTRIBUTION_SUFFIX } from "./tags.js";

const wallet = process.env.AGENT_WALLET as `0x${string}`;
if (!wallet) throw new Error("AGENT_WALLET env var required");

const client = createPublicClient({
  chain: celo,
  transport: http("https://forno.celo.org"),
});

// ERC-8004 identity: does this wallet own an agent in the registry?
const REGISTRY = "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432" as const;
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

// USD₮ transfers to/from the wallet, most recent 50.
const transferEvent = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)",
);
const latest = await client.getBlockNumber();
const fromBlock = latest > 200_000n ? latest - 200_000n : 0n;
const logs = await client.getLogs({
  address: USDT_CELO,
  event: transferEvent,
  args: { from: wallet },
  fromBlock,
  toBlock: latest,
});
const payments = [];
for (const log of logs.slice(-50)) {
  const tx = await client.getTransaction({ hash: log.transactionHash });
  const tagged = (tx.input as string).toLowerCase().endsWith(ATTRIBUTION_SUFFIX.toLowerCase());
  payments.push({
    hash: log.transactionHash,
    to: log.args.to,
    amountUsdt: formatUnits(log.args.value ?? 0n, 6),
    block: Number(log.blockNumber),
    tagged,
  });
}

const jobs = existsSync("jobs.jsonl")
  ? readFileSync("jobs.jsonl", "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l))
  : [];

writeFileSync(
  "web/data.json",
  JSON.stringify(
    {
      wallet,
      agent: AGENT_IDENTITY,
      erc8004Agents: Number(agentCount),
      payments,
      jobs: jobs.slice(-50),
      generatedAt: new Date().toISOString(),
    },
    null,
    2,
  ),
);
console.log("web/data.json written:", payments.length, "payments,", jobs.length, "job log entries");
