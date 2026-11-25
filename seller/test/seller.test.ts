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
globalThis.fetch = (async (u: any, i: any) => (String(u).includes('kraken') ? new Response('x', { status: 429 }) : realFetch(u, i))) as any
const fb = await getBrief(2e12); globalThis.fetch = realFetch
assert.ok(fb.celoUsd > 0 && fb.changeWindow === '24h'); ok('price falls back to CoinGecko when Kraken fails')
// 6c HEAD and other methods do not bypass the paywall
r = await f('/market-brief', { method: 'HEAD' }); assert.equal(r.status, 405); r = await f('/market-brief', { method: 'POST' }); assert.equal(r.status, 405); r = await f('/market-brief', { method: 'OPTIONS' }); assert.equal(r.status, 204); ok('HEAD/POST on paid route are 405, not free; OPTIONS preflight ok')
// 6d security headers on the page
r = await f('/'); assert.ok(r.headers.get('content-security-policy')?.includes("default-src 'none'")); assert.equal(r.headers.get('x-content-type-options'), 'nosniff'); ok('page has CSP and nosniff')
// 6e rate limit
const rl = createApp({ SELLER_PAY_TO: PAYTO, RATE_LIMIT_PER_MIN: '5' }, mock)
let last = 0; for (let i = 0; i < 7; i++) last = (await rl.request(base + '/health', { headers: { 'cf-connecting-ip': '9.9.9.9' } })).status
assert.equal(last, 429); assert.equal((await rl.request(base + '/health', { headers: { 'cf-connecting-ip': '8.8.8.8' } })).status, 200); ok('rate limit is per IP (429 after limit, other IP fine)')
// 6f mainnet dry run: 402 shape only, no key, no network call to settle
const mn = createApp({ SELLER_PAY_TO: PAYTO, X402_NETWORK: 'mainnet' }, { ...mock, async getSupported() { return { kinds: [{ x402Version: 2, scheme: 'exact', network: 'eip155:42220' }], extensions: [], signers: {} } } })
const mr = await mn.request(base + '/market-brief'); assert.equal(mr.status, 402)
const m: any = (await mr.json()).accepts[0]
assert.equal(m.network, 'eip155:42220'); assert.equal(m.asset, '0xcebA9300f2b948710d2653dD7B07f33A8B32118C'); assert.equal(m.amount, '1000'); assert.equal(m.payTo, PAYTO); assert.deepEqual(m.extra, { name: 'USDC', version: '2' }); ok('mainnet dry run: 402 shape correct (eip155:42220, mainnet USDC, 1000, payTo)')
// 6g facilitator failure: no content, no crash
const bad: any = { ...mock, async verify() { throw new Error('facilitator down') } }
const ba = createApp({ SELLER_PAY_TO: PAYTO }, bad)
const pay3 = wrapFetchWithPayment(((u: any, i: any) => ba.request(u, i)) as any, client)
r = await pay3(base + '/market-brief'); const bt = await r.text()
assert.ok(r.status >= 400 && !bt.includes('celoUsd')); ok('facilitator failure returns an error and no content (status ' + r.status + ')')
// 7 unknown route
r = await f('/nope'); assert.equal(r.status, 404); ok('404 for unknown route')
// 8 concurrent brief requests share one upstream fetch
_resetBriefCache(); let upCalls = 0
globalThis.fetch = (async (u: any, i: any) => { if (/kraken/.test(String(u))) upCalls++; return realFetch(u, i) }) as any
await Promise.all([1,2,3,4,5].map(() => getBrief(3e12))); globalThis.fetch = realFetch
assert.equal(upCalls, 1); ok('5 concurrent brief requests make 1 upstream price call')
// 9 brief has no null fields, preview 503 leaks no internals
const bb: any = await getBrief(3e12); assert.ok(!Object.values(bb).includes(null)); ok('brief has no null fields')
_resetBriefCache(); globalThis.fetch = (async (u: any, i: any) => (/forno|coingecko|kraken|ankr/.test(String(u)) ? new Response('x', { status: 500 }) : realFetch(u, i))) as any
r = await f('/preview'); const pj: any = await r.json(); globalThis.fetch = realFetch
assert.equal(r.status, 503); assert.deepEqual(Object.keys(pj), ['error']); ok('preview 503 leaks no internal detail')
// 10 stale Kraken candles are rejected, falls back to CoinGecko
globalThis.fetch = (async (u: any, i: any) => {
  if (/kraken/.test(String(u))) return new Response(JSON.stringify({ result: { CELOUSD: [[1000, '1', '1', '1', '1'], [2000, '2', '2', '2', '2']] } }), { status: 200 })
  if (/coingecko/.test(String(u))) return new Response(JSON.stringify({ celo: { usd: 0.05, usd_24h_change: 1.5 } }), { status: 200 })
  return realFetch(u, i)
}) as any
_resetBriefCache(); const sb: any = await getBrief(3e12); globalThis.fetch = realFetch
assert.equal(sb.celoUsd, 0.05); assert.equal(sb.sources[1], 'price: coingecko'); ok('stale Kraken data is rejected, CoinGecko used and labeled')
console.log(`ALL ${n} PASSED`)
