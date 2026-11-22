import { createPublicClient, http, formatUnits, erc20Abi } from "viem";
import { celoSepolia } from "viem/chains";
const c = createPublicClient({ chain: celoSepolia, transport: http("https://forno.celo-sepolia.celo-testnet.org") });
const USDC = "0x01C5C0122039549AD1493B8220cABEdD739BC44E" as const;
const addr = process.argv[2] as `0x${string}`;
console.log("USDC:", formatUnits(await c.readContract({ address: USDC, abi: erc20Abi, functionName: "balanceOf", args: [addr] }), 6), addr);
