# AgentGuard market-brief seller (x402 on Celo)

A small paid API. `GET /market-brief` returns a Celo market brief (CELO price, 24h change, latest block, base fee) for $0.001 in USDC, paid per request over x402. No account and no API key for buyers.

- Live: https://agentguard-brief.onrender.com (free Render instance: the first request after idle can take about a minute)
- Free routes: `/` (page), `/health`, `/preview`
- Paid route: `/market-brief` (HTTP 402 until paid; buyer signs an EIP-3009 USDC authorization, no gas)
- If the data sources are down the route returns 503 and settlement is not attempted, so the buyer is not charged.
- Settlement goes through the Celo x402 facilitator with a server-side API key (`X402_API_KEY`, never in the repo).

## Run

```bash
npm install
SELLER_PAY_TO=0x... X402_API_KEY=... npm run dev     # Celo Sepolia by default
X402_NETWORK=mainnet ...                              # Celo mainnet
npm test                                              # offline tests with a mock facilitator
```

Env: `SELLER_PAY_TO` (receiver), `X402_API_KEY`, `X402_NETWORK` (`mainnet` or unset), `PRICE_MICRO` (default 1000 = $0.001), `PUBLIC_BASE_URL` (public origin; on Render `RENDER_EXTERNAL_URL` is used, forwarded host headers are never trusted), `RATE_LIMIT_PER_MIN` (default 60 per IP).

Data: Kraken hourly candles for the CELO price and a true 24h change (CoinGecko as fallback), forno.celo.org for the latest block and base fee (ankr as fallback). Responses are cached for 5 minutes.

Facilitator cost: the Celo x402 facilitator charges gas plus 0.3% per settlement from the seller's account. New accounts get free credits (one settlement each) and then need a USDC deposit. At $0.001 per request the price is below that per-settlement cost, so after the free credits a deposit is needed or settlements fail (the buyer is not charged when a settlement fails).

Built on `@x402/hono`, `@x402/evm` and the example at celo-org/x402-celo-example.
