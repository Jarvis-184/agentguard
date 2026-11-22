/**
 * agent.ts — one job cycle: guard the policy, pay for data over x402, log the
 * result for the dashboard. Run on a schedule (e.g. daily) by the operator.
 *
 * Usage: npm run agent
 */
import { createClient, signerFromPrivateKey, deserializeSession } from "@altananetwork/sdk";
import { readFileSync, appendFileSync, existsSync } from "node:fs";
import {
  CHAINS,
  PAY_TOKEN,
  DAILY_CAP_USDT,
  SESSION_DAYS,
  ALLOWED_CALLS,
  JOB_API_URL,
  JOB_BODY,
} from "./config.js";
import { checkJob, type Policy } from "./guard.js";

const stored = JSON.parse(readFileSync("session.json", "utf8"));
const sessionPk = readFileSync(".agent_session_key", "utf8").trim() as `0x${string}`;
const session = deserializeSession(stored, signerFromPrivateKey(sessionPk));
const wallet = stored.walletAddress;
const client = createClient({ chains: CHAINS });
const jobUrl = JOB_API_URL;

const policy: Policy = {
  allowedContracts: ALLOWED_CALLS.map((c) => c.to.toLowerCase()),
  dailyCapUnits: DAILY_CAP_USDT,
  expiryUnix: session.expiry ?? Math.floor(Date.now() / 1000) + SESSION_DAYS * 86400,
};

// Spending so far today, from the local job log (the Keystore enforces it onchain).
const today = new Date().toISOString().slice(0, 10);
const spentToday = existsSync("jobs.jsonl")
  ? readFileSync("jobs.jsonl", "utf8")
      .split("\n")
      .filter((l) => l.includes(today) && l.includes('"paidUnits"'))
      .reduce((sum, l) => sum + BigInt(JSON.parse(l).paidUnits ?? 0), 0n)
  : 0n;

const decision = checkJob(policy, PAY_TOKEN, 0n, spentToday);
appendFileSync("jobs.jsonl", JSON.stringify({ wallet, decision, jobUrl }) + "\n");
if (!decision.ok) {
  console.error("guard refused:", decision.reason);
  process.exit(1);
}

const res = await client.fetchWithX402({
  session,
  url: jobUrl,
  init: { method: "POST", headers: { "content-type": "application/json" }, body: JOB_BODY },
});
const body = await res.text();
appendFileSync(
  "jobs.jsonl",
  JSON.stringify({ wallet, paidAt: new Date().toISOString(), status: res.status, body: body.slice(0, 2000) }) + "\n",
);
console.log("paid and fetched:", res.status);
