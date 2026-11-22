/**
 * provision.ts — run once by the owner. Creates the Altana wallet, grants the
 * agent a scoped session (allowlist + daily cap + expiry), approves the x402
 * payment rail, and writes session.json for the agent process.
 *
 * Usage: ADMIN_PRIVATE_KEY=0x... npm run provision
 */
import {
  createClient,
  createPrivateKeySigner,
  signerFromPrivateKey,
  PERMIT2_ADDRESS,
} from "@altananetwork/sdk";
import { writeFileSync } from "node:fs";
import { CHAINS, ALLOWED_CALLS, DAILY_CAP_USDT, SESSION_DAYS, USDT_CELO, AGENT_IDENTITY } from "./config.js";

const admin = signerFromPrivateKey(process.env.ADMIN_PRIVATE_KEY as `0x${string}`);
const client = createClient({ chains: CHAINS, agentIdentity: AGENT_IDENTITY });

const wallet = await client.createWallet({ signer: admin });
console.log("wallet:", wallet.address);

const session = await client.grantSession({
  wallet,
  signer: admin,
  sessionSigner: createPrivateKeySigner(), // the agent's key, generated here
  permissions: {
    calls: ALLOWED_CALLS,
    spend: [{ limit: DAILY_CAP_USDT, period: "day", token: USDT_CELO }],
  },
  expiry: Math.floor(Date.now() / 1000) + SESSION_DAYS * 24 * 60 * 60,
});
console.log("session granted; agent identities:", session.agentIdentities);

// x402 rail: USD₮ via Permit2, settlement checked against the session policy.
await client.approveTokenForPermit2({ wallet, signer: admin, token: USDT_CELO });
await client.approveSignatureChecker({ wallet, signer: admin, session, checker: PERMIT2_ADDRESS });

writeFileSync(
  "session.json",
  JSON.stringify({ session, wallet: wallet.address }, null, 2),
);
console.log("session.json written — hand this to the agent, never the admin key.");

// Revoking later: await client.revokeSession({ wallet, signer: admin, session });
