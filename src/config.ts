import { CELO, CELO_SEPOLIA } from "@altananetwork/sdk";

// Network switch: "sepolia" for the free sandbox build, "celo" for the scored mainnet entry.
export const NETWORK = (process.env.AGENTGUARD_NETWORK ?? "sepolia") as "sepolia" | "celo";
export const CHAINS = NETWORK === "celo" ? [CELO] : [CELO_SEPOLIA];

// USD₮ on Celo mainnet (6 decimals). Sandbox pays in test USDC on Celo Sepolia.
export const USDT_CELO = "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e" as const;
export const USDC_SEPOLIA = "0x01C5C0122039549AD1493B8220cABEdD739BC44E" as const;
export const PAY_TOKEN = NETWORK === "celo" ? USDT_CELO : USDC_SEPOLIA;
export const PAY_SYMBOL = NETWORK === "celo" ? "USD\u20ae" : "USDC";

// Paid job endpoint: buy gateway. Sandbox = same prices, test funds.
export const JOB_API_URL =
  process.env.JOB_API_URL ?? "https://gateway.usebuy.ai/v1/social/youtube/videos/search";
export const JOB_BODY = JSON.stringify({ query: "celo crypto" });

// Session policy.
export const SESSION_DAYS = 14;
export const DAILY_CAP_USDT = 500_000n; // 0.50 in 6-decimal base units

export const ALLOWED_CALLS = [{ to: PAY_TOKEN }];

export const AGENT_IDENTITY = {
  name: "AgentGuard Sentinel",
  description:
    "Market-brief agent that pays per request over x402 under an owner-set spend cap, allowlist and expiry.",
  endpoint: "https://github.com/Jarvis-184/agentguard",
};

// x402 demo merchant + hosted facilitator (Celo). The buy gateway's embedded
// verifier only accepts plain EOA signatures, so a smart-account payer goes
// through the hosted facilitator for verification and settles on-chain via
// the token's transferWithAuthorization (Circle's ERC-1271-aware USDC).
export const MERCHANT_ADDRESS = "0x8Ced59c00F99d6892f181979EE1de3F07BCEDb0f" as const;
export const FACILITATOR_URL =
  NETWORK === "celo" ? "https://api.x402.celo.org" : "https://api.x402.sepolia.celo.org";
export const JOB_PRICE_UNITS = 5_000n; // 0.005 in 6-decimal base units
export const EXPLORER_TX =
  NETWORK === "celo" ? "https://celoscan.io/tx/" : "https://celo-sepolia.blockscout.com/tx/";
