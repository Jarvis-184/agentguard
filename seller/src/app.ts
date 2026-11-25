import { Hono } from 'hono'
import { paymentMiddleware, x402ResourceServer } from '@x402/hono'
import { HTTPFacilitatorClient } from '@x402/core/server'
import { ExactEvmScheme } from '@x402/evm/exact/server'
import { getAddress } from 'viem'
import { mirrorPaymentRequiredBody } from './mirror-402-body.js'
import { getBrief } from './brief.js'
import { landingPage } from './page.js'

export interface Env {
  X402_API_KEY?: string
  SELLER_PAY_TO?: string
  X402_NETWORK?: string // "mainnet" or unset (Celo Sepolia)
  RATE_LIMIT_PER_MIN?: string
  PRICE_MICRO?: string // price in USDC micro units, default 1000 = $0.001
}

const NETS = {
  testnet: { caip2: 'eip155:11142220', usdc: '0x01C5C0122039549AD1493B8220cABEdD739BC44E', label: 'Celo Sepolia', facilitator: 'https://api.x402.sepolia.celo.org' },
  mainnet: { caip2: 'eip155:42220', usdc: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C', label: 'Celo mainnet', facilitator: 'https://api.x402.celo.org' },
} as const

export function createApp(env: Env, facilitatorOverride?: any) {
  const net = env.X402_NETWORK === 'mainnet' ? NETS.mainnet : NETS.testnet
  const payTo = getAddress(env.SELLER_PAY_TO ?? '0x0000000000000000000000000000000000000001')
  const micro = env.PRICE_MICRO ?? '1000'
  const priceUsd = (Number(micro) / 1e6).toString()

  const facilitator =
    facilitatorOverride ??
    new HTTPFacilitatorClient({
      url: net.facilitator,
      createAuthHeaders: async () => {
        const h = { 'X-API-Key': env.X402_API_KEY ?? '' }
        return { verify: h, settle: h, supported: h }
      },
    })
  const server = new x402ResourceServer(facilitator)
  server.register('eip155:*', new ExactEvmScheme())

  const routes = {
    'GET /market-brief': {
      accepts: [
        {
          scheme: 'exact',
          network: net.caip2,
          payTo,
          price: { amount: micro, asset: net.usdc, extra: { name: 'USDC', version: '2' } },
        },
      ],
      description: 'Daily Celo market brief: CELO price, 24h change, latest block, base fee. JSON.',
      mimeType: 'application/json',
    },
  }

  const app = new Hono()
  // Small in-memory rate limit per client IP (free host, single instance). Keeps scrapers
  // and spammed invalid payment headers from burning facilitator calls.
  const hits = new Map<string, { n: number; reset: number }>()
  app.use('*', async (c, next) => {
    const ip = (c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for')?.split(',')[0] ?? 'local').trim()
    const now = Date.now()
    if (hits.size > 5000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k)
    const e = hits.get(ip)
    if (!e || e.reset < now) hits.set(ip, { n: 1, reset: now + 60_000 })
    else if (++e.n > (env.RATE_LIMIT_PER_MIN ? Number(env.RATE_LIMIT_PER_MIN) : 60)) {
      return c.json({ error: 'rate_limited', retryAfterSeconds: Math.ceil((e.reset - now) / 1000) }, 429)
    }
    await next()
  })
  // The paid route answers GET only. HEAD would otherwise skip the paywall.
  app.use('/market-brief', async (c, next) => {
    if (c.req.method !== 'GET' && c.req.method !== 'OPTIONS') return c.json({ error: 'method_not_allowed', allowed: 'GET' }, 405, { Allow: 'GET' })
    await next()
  })
  app.use('*', async (c, next) => {
    await next()
    if (c.req.path === '/') {
      c.res.headers.set('Content-Security-Policy', "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'")
    }
    c.res.headers.set('X-Content-Type-Options', 'nosniff')
    c.res.headers.set('Referrer-Policy', 'no-referrer')
    c.res.headers.set('Access-Control-Allow-Origin', '*')
    c.res.headers.set('Access-Control-Expose-Headers', 'PAYMENT-REQUIRED, PAYMENT-RESPONSE')
  })
  app.options('*', (c) => c.body(null, 204))
  app.get('/', async (c) => c.html(landingPage({ network: net.label, caip2: net.caip2, payTo, priceUsd, asset: net.usdc })))
  app.get('/health', (c) => c.json({ ok: true, network: net.label }))
  app.get('/preview', async (c) => {
    try {
      const b = await getBrief()
      return c.json({ date: b.date, celoUsd: b.celoUsd, change24hPct: b.change24hPct, changeWindow: b.changeWindow, note: 'Free preview. Full brief at /market-brief.' })
    } catch (e: any) {
      console.error('preview failed:', e?.message)
      return c.json({ error: 'data_unavailable', detail: String(e?.message ?? e).slice(0, 200) }, 503)
    }
  })
  app.use('/market-brief', mirrorPaymentRequiredBody)
  app.use(paymentMiddleware(routes as any, server))
  app.get('/market-brief', async (c) => {
    try {
      return c.json(await getBrief())
    } catch (e: any) {
      console.error('brief failed:', e?.message)
      // A 5xx is not settled by the middleware, so the buyer is not charged.
      return c.json({ error: 'data_unavailable', charged: false }, 503)
    }
  })
  return app
}
