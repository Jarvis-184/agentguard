import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { createPublicClient, createWalletClient, http, formatUnits, parseUnits, erc20Abi } from "viem";
import { celoSepolia } from "viem/chains";

const pk = process.argv[2] === "gen" ? generatePrivateKey() : (process.argv[2] as `0x${string}`);
const acct = privateKeyToAccount(pk);
if (process.argv[2] === "gen") { console.log(JSON.stringify({ pk, address: acct.address })); process.exit(0); }

const USDC = "0x01C5C0122039549AD1493B8220cABEdD739BC44E" as const;
const pub = createPublicClient({ chain: celoSepolia, transport: http("https://forno.celo-sepolia.celo-testnet.org") });
const wc = createWalletClient({ account: acct, chain: celoSepolia, transport: http("https://forno.celo-sepolia.celo-testnet.org") });
const bal = await pub.readContract({ address: USDC, abi: erc20Abi, functionName: "balanceOf", args: [acct.address] });
console.log("helper USDC:", formatUnits(bal, 6));
const hash = await wc.writeContract({ address: USDC, abi: erc20Abi, functionName: "transfer", args: ["0x6f59ab1977DF350d1FbBE379EEE6D45AEB766353", bal] });
await pub.waitForTransactionReceipt({ hash });
console.log("transferred all to admin, tx:", hash);
