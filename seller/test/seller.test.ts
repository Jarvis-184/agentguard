/** Offline tests: mock facilitator, real x402 buyer client. Run: npm test */
import assert from 'node:assert/strict'
import { x402Client, wrapFetchWithPayment } from '@x402/fetch'
import { ExactEvmScheme } from '@x402/evm/exact/client'
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts'
import { createApp } from '../src/app.js'
import { getBrief, _resetBriefCache } from '../src/brief.js'

const PAYTO = '0x00D96E0A1b77ff3f6EA5BF5Df1b5A177f75d1319'
const calls: string[] = []
const mock: any = {
  async getSupported() {
    return { kinds: [{ x402Version: 2, scheme: 'exact', network: 'eip155:11142220' }], extensions: [], signers: {} }
  },
  async verify(_p: any, req: any) { calls.push('verify'); return { isValid: true, payer: req.payload?.authorization?.from } },
  async settle(_p: any, req: any) { calls.push('settle'); return { success: true, transaction: '0x' + 'ab'.repeat(32), network: 'eip155:11142220', payer: req.payload?.authorization?.from } },
}
const app = createApp({ SELLER_PAY_TO: PAYTO, X402_API_KEY: 'k' }, mock)
const base = 'http://t.local'
const f = (path: string, init?: RequestInit) => app.request(base + path, init)
let n = 0
const ok = (name: string) => console.log(`ok ${++n} ${name}`)

// 1 landing page
let r = await f('/'); let html = await r.text()
assert.equal(r.status, 200); assert.match(html, /AgentGuard Market Brief/); assert.ok(html.includes(PAYTO)); assert.match(html, /\$0\.001/); ok('landing page shows price and payTo')
// 2 health + preview
r = await f('/health'); assert.equal((await r.json() as any).ok, true); ok('health')
r = await f('/preview'); const pv: any = await r.json(); assert.ok(r.status === 200 && typeof pv.celoUsd === 'number' && !('block' in pv)); ok('free preview has no paid fields')
// 3 unpaid => 402 with right terms
r = await f('/market-brief'); assert.equal(r.status, 402)
const ch: any = await r.json(); const a = ch.accepts[0]
assert.equal(a.amount, '1000'); assert.equal(a.payTo, PAYTO); assert.equal(a.network, 'eip155:11142220'); assert.equal(a.asset.toLowerCase(), '0x01c5c0122039549ad1493b8220cabedd739bc44e'); ok('402 terms correct (1000 micro USDC, payTo, network, asset)')
assert.equal(r.headers.get('access-control-allow-origin'), '*'); ok('CORS header on 402')
// 4 paid via real client
const acct = privateKeyToAccount(generatePrivateKey())
const client = new x402Client(); client.register('eip155:*', new ExactEvmScheme(acct))
const pay = wrapFetchWithPayment(((u: any, i: any) => app.request(u, i)) as any, client)
calls.length = 0
r = await pay(base + '/market-brief')
assert.equal(r.status, 200); const b: any = await r.json()
for (const k of ['date', 'celoUsd', 'change24hPct', 'block', 'blockTime', 'baseFeeGwei', 'summary', 'sources']) assert.ok(k in b, 'missing ' + k)
assert.ok(b.celoUsd > 0 && b.block > 1e6 && b.baseFeeGwei > 0)
assert.deepEqual(calls, ['verify', 'settle']); ok('paid request returns full brief, verify then settle once')
const hdr = r.headers.get('payment-response'); assert.ok(hdr); assert.match(JSON.parse(Buffer.from(hdr!, 'base64').toString()).transaction, /^0x[0-9a-f]{64}$/); ok('settlement receipt header present')
// 5 caching
_resetBriefCache(); const t1 = await getBrief(1e12); const t2 = await getBrief(1e12 + 1000); assert.equal(t1, t2); ok('brief cached 5 min')
// 6 upstream failure => 503 and no settle
const realFetch = globalThis.fetch
_resetBriefCache()
globalThis.fetch = (async (u: any, i: any) => (/forno|coingecko|kraken|ankr/.test(String(u)) ? new Response('x', { status: 500 }) : realFetch(u, i))) as any
calls.length = 0
const pay2 = wrapFetchWithPayment(((u: any, i: any) => app.request(u, i)) as any, client)
r = await pay2(base + '/market-brief')
globalThis.fetch = realFetch
assert.equal(r.status, 503); assert.ok(!calls.includes('settle'), 'must not settle on failure'); ok('data failure returns 503 and does not settle (no charge)')
// 6b fallback: CoinGecko down, Kraken answers
_resetBriefCache()
globalThis.fetch = (async (u: any, i: any) => (String(u).includes('coingecko') ? new Response('x', { status: 429 }) : realFetch(u, i))) as any
const fb = await getBrief(2e12); globalThis.fetch = realFetch
assert.ok(fb.celoUsd > 0 && fb.changeWindow === 'since 00:00 UTC'); ok('price falls back to Kraken when CoinGecko fails')
// 7 unknown route
r = await f('/nope'); assert.equal(r.status, 404); ok('404 for unknown route')
console.log(`ALL ${n} PASSED`)
