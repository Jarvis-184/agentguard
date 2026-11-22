/**
 * simulate.ts — runs the guard policy off-chain against a scripted day of jobs.
 * Proves the guard's decisions before any mainnet transaction exists.
 *
 * Usage: npm run simulate
 */
import { checkJob, type Policy } from "./guard.js";
import { USDT_CELO, DAILY_CAP_USDT } from "./config.js";

const policy: Policy = {
  allowedContracts: [USDT_CELO.toLowerCase()],
  dailyCapUnits: DAILY_CAP_USDT,
  expiryUnix: Math.floor(Date.now() / 1000) + 14 * 86400,
};

const scenarios: Array<{ label: string; target: string; amount: bigint; spent: bigint }> = [
  { label: "buy market data, 0.10 USD₮", target: USDT_CELO, amount: 100_000n, spent: 0n },
  { label: "buy market data again, 0.10 USD₮", target: USDT_CELO, amount: 100_000n, spent: 100_000n },
  { label: "call an unlisted contract", target: "0x000000000000000000000000000000000000dEaD", amount: 100_000n, spent: 200_000n },
  { label: "spend 0.50 USD₮ more (over daily cap)", target: USDT_CELO, amount: 500_000n, spent: 200_000n },
];

let spent = 0n;
for (const s of scenarios) {
  const d = checkJob(policy, s.target, s.amount, s.spent);
  console.log(`${d.ok ? "ALLOW" : "DENY "}  ${s.label}  -> ${d.reason}`);
  if (d.ok) spent += s.amount;
}

// And after expiry:
const expired = checkJob({ ...policy, expiryUnix: Math.floor(Date.now() / 1000) - 1 }, USDT_CELO, 1n, 0n);
console.log(`${expired.ok ? "ALLOW" : "DENY "}  pay after session expiry  -> ${expired.reason}`);
