import { createPublicClient, http, formatEther } from "viem";
import { celoSepolia } from "viem/chains";
const c = createPublicClient({ chain: celoSepolia, transport: http("https://forno.celo-sepolia.celo-testnet.org") });
console.log("S-CELO:", formatEther(await c.getBalance({ address: "0x6f59ab1977DF350d1FbBE379EEE6D45AEB766353" })));
