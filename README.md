# AgentGuard

[![CI](https://github.com/Jarvis-184/agentguard/actions/workflows/ci.yml/badge.svg)](https://github.com/Jarvis-184/agentguard/actions/workflows/ci.yml)

**Scoped spending authority and a public activity log for AI agents on Celo.**

An AI agent that pays for things needs two things a raw private key can never give it:
a limit you can prove, and a paper trail anyone can audit. AgentGuard gives an agent
both, on Celo.

- **Provable limits.** The agent acts from a non-custodial [Altana](https://altana.network)
  smart wallet under a session key its owner grants: an allowlist of contracts it may call,
  a per-day spend cap, and an expiry. The policy lives in Altana's onchain Keystore, so any
  app, explorer, or contract can verify it. Altana documents one-transaction revocation by the owner (SDK `client.revokeSession`); this repo has no revoke script.
- **A real job, really paid.** The agent buys data per request over [x402](https://x402.celo.org)
  (HTTP 402) and turns it into a daily market brief for its owner.
  Every payment is signed by the session key, inside its cap, with no human in the loop.
- **A public dashboard.** `web/` reads the wallet's tagged onchain activity and shows every
  payment next to the policy that allowed it and the job it paid for.

Built for the **Agents Open for Business** hackathon (Altana Agent Wallets track).

## Current state (Celo Sepolia, working end to end)

The full loop runs today on Celo Sepolia with test USDC:

1. Owner provisions an Altana smart wallet and grants a session key
   (`src/provision.ts`): allowlist, 0.50/day cap, expiry.
2. The agent (`src/agent.ts`) runs `guard.check` before every payment, then pays
   per request over x402 using an EIP-3009 `transferWithAuthorization` signed by
   the session key.
3. The payment is verified through the hosted Celo Sepolia x402 facilitator
   (`https://api.x402.sepolia.celo.org`) and settled onchain.
   The `@celo/buy` sandbox gateway's own verifier accepts EOA signatures only
   (`ecrecover`), so smart-account payments go through the hosted facilitator,
   which is ERC-1271-aware. Settlement txs on
   [celo-sepolia.blockscout.com](https://celo-sepolia.blockscout.com), e.g.
   `0x3e4995451f6c89d8116fcde7014edd1e0bc35b0d3898cff0efd21bb83c52876b`
   (tagged with the attribution suffix `celo_b60bab126a06`).
4. The wallet owns a registered ERC-8004 identity: agent **#1047** in the
   Celo Sepolia registry `0x8004A818BFB912233c491871b3d84c89A494BD9e`, tx
   `0x12e1f00d88a45b2fe3d50a67022e444f49dc18895e517a60247d81ea7cc5df05`
   ([8004scan](https://8004scan.io/agents/celo-sepolia/1047)).
5. `web/` shows policy state, every payment (labelled USDC on Sepolia, USD₮ on
   mainnet), the ERC-8004 registration, and the job log.

Mainnet wiring is identical (`NETWORK=celo`): USD₮ `0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e`,
ERC-8004 registry `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`.

## How it works

```
owner (human)                      agent (automated)
     |                                    |
     |  1. createWallet + grantSession    |
     |  { allowlist, cap/day, expiry }    |
     |----------------------------------->|
     |        session key (scoped)        |
     |                                    | 2. guard.check(job)
     |                                    |    expiry? allowlist? cap left?
     |                                    | 3. fetchWithX402(paid API)
     |                                    |    402 -> sign -> facilitator -> data
     |                                    | 4. write brief + payment receipt
     v                                    v
   onchain Keystore (policy)      Celo (payments, ERC-8004 identity)
                \                     /
                 \                   v
              web dashboard  <---  onchain reads (forno RPC)
```

## Layout

| Path             | What it is                                                        |
| ---------------- | ----------------------------------------------------------------- |
| `src/provision.ts` | One-time owner script: wallet, session grant, payment rail setup. |
| `src/guard.ts`     | Pre-flight policy check the agent runs before every payment.      |
| `src/agent.ts`     | The working loop: guard -> pay over x402 -> produce the brief.    |
| `src/snapshot.ts`  | Reads onchain state and writes `web/data.json` for the dashboard. |
| `web/`             | Static dashboard: policy state + every tagged payment + job log.  |
| `docs/`            | Same dashboard, served as the live demo (GitHub Pages).           |
| `seller/`          | The mainnet x402 seller (`GET /market-brief`); has its own README and tests. |
| `test/`            | Unit tests for the guard (`npm test`).                            |

## Quickstart

```bash
npm install
cp .env.example .env    # fill in ADMIN_PRIVATE_KEY (owner) — see Safety
npm run provision       # creates wallet, grants the session, writes session.json
npm run agent           # runs one job cycle: guard -> pay -> brief
npm run snapshot        # AGENT_WALLET=0x... refreshes web/data.json
```

## Try the live seller (no wallet needed to see the terms)

```bash
curl -i https://agentguard-brief.onrender.com/market-brief
```

The free Render instance can take about a minute on the first request after idle. Without
payment the route answers `402 Payment Required` and a `payment-required` header with the
terms: network `eip155:42220` (Celo mainnet), 1000 units (0.001 USDC), and the PayTo
address above. A buyer signs an EIP-3009 USDC authorization and retries with the x402
payment header; see `seller/README.md`. `/health`, `/preview` and `/openapi.json` are free.

Live demo of the dashboard: https://jarvis-184.github.io/agentguard/ . CI (typecheck, tests, `npm audit`) runs on every push.

Run the tests: `npm test` (guard, 8 checks) and `cd seller && npm test` (22 checks, offline).

## Safety model

- The **admin key** never leaves the owner's environment and never touches the agent process.
- The agent only ever sees the **session key**, scoped to: these contracts, this much per day, until this time.
- By Altana's design the Keystore rejects oversized or out-of-policy calls onchain. This repo does not demonstrate that rejection live: `src/guard.ts` mirrors the policy off-chain, and the deny path is covered by unit tests.
- Revocation: the owner can revoke through the Altana SDK (`client.revokeSession`). Not scripted or demonstrated in this repo.

## Track requirements map

- Non-custodial Altana wallet under a session key with spend cap, allowlist, expiry: `src/provision.ts`
- Onchain session policy (allowlist, daily cap, expiry): granted with the Altana SDK in `src/provision.ts`. Onchain enforcement and revocation are Altana features that this repo does not demonstrate live.
- Tagged onchain activity: attribution suffix on settlement txs (`src/tags.ts`)
- ERC-8004 identity: agent #1047 registered from the wallet on Celo Sepolia
- Named user with a real job done: no independent user yet (see Status). The agent's job is a paid market brief per request.

## Status (27 Nov 2026, honest summary)

- **Live on Celo mainnet:** an x402 seller, `https://agentguard-brief.onrender.com`, sells a Celo market brief for 0.001 USDC per request. PayTo: `0x00D96E0A1b77ff3f6EA5BF5Df1b5A177f75d1319`. The Altana wallet and the ERC-8004 identity (agent #10112) are live on mainnet.
- **Our own paid calls:** a separate agent wallet made 10 paid calls (0.005 USDT each) to third-party services on `buy`. These are our own calls, not independent users.
- **Users:** there is no independent user yet. If you run an agent with an ERC-8004 id, one 0.001 USDC call to the seller is all it takes. Feedback and issues are welcome.
- **Mainnet gap:** `src/agent.ts` settles directly on the chain it is configured for. Its mainnet settlement path through the facilitator is not implemented yet, so `src/agent.ts` has no mainnet payment run. Mainnet activity so far: the seller, one tagged test payment of 0.005 USDT (tx `0xd3977f620eff9e5ea0ef783284916e31916aed6ceb447c64dd198ff523bf4a94`), and the buy calls above.
- **Testnet:** the Celo Sepolia demo above is the full end-to-end loop; the deny path is covered by unit tests, not live traffic.

## License

MIT
