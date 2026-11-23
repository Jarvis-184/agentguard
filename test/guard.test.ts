import { checkJob } from "../src/guard.js";
const USDC = 1_000_000n;
const base = { allowedContracts: ["0x01c5c0122039549ad1493b8220cabedd739bc44e"], dailyCapUnits: 500_000n, expiryUnix: Math.floor(Date.now()/1000)+3600 };
const now = Math.floor(Date.now()/1000);
const cases: [string, Parameters<typeof checkJob>, boolean][] = [
  ["allow: listed, under cap", [base, base.allowedContracts[0], 100_000n, 0n, now], true],
  ["allow: exactly at cap", [base, base.allowedContracts[0], 300_000n, 200_000n, now], true],
  ["deny: not on allowlist", [base, "0x0000000000000000000000000000000000000001", 100_000n, 0n, now], false],
  ["deny: cap exceeded by 1 unit", [base, base.allowedContracts[0], 300_001n, 200_000n, now], false],
  ["deny: expired session", [base, base.allowedContracts[0], 100_000n, 0n, now+7200], false],
  ["deny: zero amount", [base, base.allowedContracts[0], 0n, 0n, now], false],
  ["deny: negative amount", [base, base.allowedContracts[0], -1n, 0n, now], false],
  ["deny: allowlist case-insensitive target ok", [base, "0x01C5C0122039549AD1493B8220cABEdD739BC44E", 100_000n, 0n, now], true],
];
let fail = 0;
for (const [name, args, want] of cases) {
  const r = checkJob(...args);
  const pass = r.ok === want;
  if (!pass) { fail++; console.log("FAIL", name, "->", r); }
  else console.log("ok  ", name, "->", r.ok ? "allowed" : "denied: " + r.reason);
}
process.exit(fail ? 1 : 0);
