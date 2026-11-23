import { createClient, signerFromPrivateKey, registerAgentIdentity, CELO_SEPOLIA } from "@altananetwork/sdk";
import { readFileSync } from "node:fs";
import { CHAINS, AGENT_IDENTITY } from "./config.js";
const adminKey = readFileSync("/home/sandbox/.agentguard-admin-key", "utf8").trim() as `0x${string}`;
const admin = signerFromPrivateKey(adminKey);
const client = createClient({ chains: CHAINS });
const wallet = await client.createWallet({ signer: admin });
console.log("wallet:", wallet.address);
const outcome = await registerAgentIdentity({
  wallet,
  signer: admin,
  network: CELO_SEPOLIA,
  identity: AGENT_IDENTITY,
  feeToken: "0x01C5C0122039549AD1493B8220cABEdD739BC44E",
});
console.log("8004 outcome:", JSON.stringify(outcome));
