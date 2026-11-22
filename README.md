# AgentGuard

**Scoped spending authority and a public activity log for AI agents on Celo.**

An AI agent that pays for things needs two things a raw private key can never give it:
a limit you can prove, and a paper trail anyone can audit. AgentGuard gives an agent
both, on Celo mainnet.

- **Provable limits.** The agent acts from a non-custodial [Altana](https://altana.network)
  smart wallet under a session key its owner grants: an allowlist of contracts it may call,
  a per-day spend cap, and an expiry. The policy lives in Altana's onchain Keystore, so any
  app, explorer, or contract can verify it. The owner can revoke it in one transaction.
- **A real job, really paid.** The agent buys data per request over [x402](https://x402.celo.org)
  (HTTP 402) in USD₮ on Celo and turns it into a daily market brief for its owner.
  Every payment is signed by the session key, inside its cap, with no human in the loop.
- **A public dashboard.** `web/` reads the wallet's tagged onchain activity and shows every
  payment next to the policy that allowed it and the job it paid for.

Built for the **Agents Open for Business** hackathon (Altana Agent Wallets track).

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
     |                                    |    402 -> sign -> retry -> data
     |                                    | 4. write brief + payment receipt
     v                                    v
   onchain Keystore (policy)      Celo mainnet (payments)
                \                     /
                 \                   v
              web dashboard  <---  Blockscout API
```

## Layout

| Path             | What it is                                                        |
| ---------------- | ----------------------------------------------------------------- |
| `src/provision.ts` | One-time owner script: wallet, session grant, payment rail setup. |
| `src/guard.ts`     | Pre-flight policy check the agent runs before every payment.      |
| `src/agent.ts`     | The working loop: guard -> pay over x402 -> produce the brief.    |
| `web/`             | Static dashboard: policy state + every tagged payment + job log.  |

## Quickstart

```bash
npm install
cp .env.example .env    # fill in ADMIN_PRIVATE_KEY (owner) — see Safety
npm run provision       # creates wallet, grants the session, writes session.json
npm run agent           # runs one job cycle: guard -> pay -> brief
```

## Safety model

- The **admin key** never leaves the owner's environment and never touches the agent process.
- The agent only ever sees the **session key**, scoped to: these contracts, this much per day, until this time.
- Oversized or out-of-policy calls are rejected onchain by the Keystore, not by the agent's good behaviour.
- Revocation is one transaction from the owner.

## Track requirements map

- Non-custodial Altana wallet under a session key with spend cap, allowlist, expiry: `src/provision.ts`
- Enforced onchain, revocable in one transaction: Altana Keystore (`src/provision.ts` shows `revokeSession`)
- Tagged onchain activity / ERC-8004 identity: automatic agent registration + attribution suffix
- Named user with a real job done: owner receives a daily market brief paid for per-request in USD₮

## License

MIT
