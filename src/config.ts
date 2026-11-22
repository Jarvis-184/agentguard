import { CELO } from "@altananetwork/sdk";

// Celo mainnet token: USD₮ (Tether USD on Celo), 6 decimals.
export const USDT_CELO = "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e" as const;

export const CHAINS = [CELO];

// One day in seconds; the session expires after SESSION_DAYS days.
export const SESSION_DAYS = 14;

// Daily spend cap for the agent, in USD₮ base units (6 decimals). 0.50 USD₮/day.
export const DAILY_CAP_USDT = 500_000n;

// Contracts the session key may call. Filled at provision time:
// the x402 payment rail settles through Permit2 / token authorization,
// so the allowlist covers the token contract itself.
export const ALLOWED_CALLS = [{ to: USDT_CELO }];

export const AGENT_IDENTITY = {
  name: "AgentGuard Sentinel",
  description:
    "Market-brief agent that pays per request over x402 under an owner-set spend cap, allowlist and expiry.",
  endpoint: "https://github.com/Jarvis-184/agentguard",
};
