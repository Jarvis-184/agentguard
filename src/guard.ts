/**
 * guard.ts — the pre-flight policy check the agent runs before every payment.
 *
 * The Keystore enforces policy onchain; the guard mirrors it off-chain so the
 * agent fails early, logs why, and never wastes a transaction. Every decision
 * is written as one JSON line to the job log the dashboard renders.
 */

export interface Policy {
  allowedContracts: string[]; // lowercase addresses
  dailyCapUnits: bigint; // token base units per day
  expiryUnix: number; // seconds
}

export interface GuardDecision {
  ok: boolean;
  reason: string;
  checkedAt: string;
}

export function checkJob(
  policy: Policy,
  target: string,
  amountUnits: bigint,
  spentTodayUnits: bigint,
  nowUnix = Math.floor(Date.now() / 1000),
): GuardDecision {
  const checkedAt = new Date().toISOString();
  if (amountUnits <= 0n) {
    return { ok: false, reason: "amount must be positive", checkedAt };
  }
  if (nowUnix >= policy.expiryUnix) {
    return { ok: false, reason: "session expired", checkedAt };
  }
  if (!policy.allowedContracts.includes(target.toLowerCase())) {
    return { ok: false, reason: `contract ${target} not on allowlist`, checkedAt };
  }
  if (spentTodayUnits + amountUnits > policy.dailyCapUnits) {
    return {
      ok: false,
      reason: `cap exceeded: ${spentTodayUnits + amountUnits} > ${policy.dailyCapUnits} units/day`,
      checkedAt,
    };
  }
  return { ok: true, reason: "within policy", checkedAt };
}
