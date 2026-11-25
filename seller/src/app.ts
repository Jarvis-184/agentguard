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
  app.use('*', async (c, next) => {
    await next()
    c.res.headers.set('Access-Control-Allow-Origin', '*')
    c.res.headers.set('Access-Control-Expose-Headers', 'PAYMENT-REQUIRED, PAYMENT-RESPONSE')
  })
  app.options('*', (c) => c.body(null, 204))
  app.get('/', async (c) => c.html(landingPage({ network: net.label, caip2: net.caip2, payTo, priceUsd, asset: net.usdc })))
  app.get('/health', (c) => c.json({ ok: true, network: net.label }))
  app.get('/preview', async (c) => {
    try {
      const b = await getBrief()
      return c.json({ date: b.date, celoUsd: b.celoUsd, change24hPct: b.change24hPct, note: 'Free preview. Full brief at /market-brief.' })
    } catch {
      return c.json({ error: 'data_unavailable' }, 503)
    }
  })
  app.use('/market-brief', mirrorPaymentRequiredBody)
  app.use(paymentMiddleware(routes as any, server))
  app.get('/market-brief', async (c) => {
    try {
      return c.json(await getBrief())
    } catch {
      // A 5xx is not settled by the middleware, so the buyer is not charged.
      return c.json({ error: 'data_unavailable', charged: false }, 503)
    }
  })
  return app
}
