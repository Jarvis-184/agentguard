/** Market brief data: public sources only, no keys. Cached for 5 minutes. */
export interface Brief {
  date: string
  celoUsd: number
  change24hPct: number
  block: number
  blockTime: string
  baseFeeGwei: number
  changeWindow: string
  summary: string
  sources: string[]
}

const RPC = 'https://forno.celo.org'
const CG = 'https://api.coingecko.com/api/v3/simple/price?ids=celo&vs_currencies=usd&include_24hr_change=true'
const TTL_MS = 5 * 60 * 1000
let cache: { at: number; value: Brief } | null = null

async function rpc(method: string, params: unknown[]): Promise<any> {
  const r = await fetch(RPC, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    signal: AbortSignal.timeout(8000),
  })
  if (!r.ok) throw new Error(`rpc ${r.status}`)
  const j: any = await r.json()
  if (j.error) throw new Error(`rpc ${j.error.message}`)
  return j.result
}

async function getJson(url: string): Promise<any> {
  const r = await fetch(url, { signal: AbortSignal.timeout(8000), headers: { accept: 'application/json', 'user-agent': 'agentguard-brief/0.1' } })
  if (!r.ok) throw new Error(`${new URL(url).host} ${r.status}`)
  return r.json()
}

/** CELO/USD and a true 24h change. Kraken hourly candles first; CoinGecko is the fallback (it blocks some host IPs). */
async function getPrice(now = Date.now()): Promise<{ usd: number; change: number; window: string; source: string }> {
  const errs: string[] = []
  // Kraken hourly candles: last close vs the close 24h earlier (true 24h change).
  try {
    const j = await getJson('https://api.kraken.com/0/public/OHLC?pair=CELOUSD&interval=60')
    const rows: any[] = j?.result?.CELOUSD ?? []
    const last = rows[rows.length - 1]
    const cutoff = Math.floor(now / 1000) - 24 * 3600
    const ref = [...rows].reverse().find((r) => r[0] <= cutoff)
    const usd = Number(last?.[4]), prev = Number(ref?.[4])
    const fresh = last && ref && Math.floor(now / 1000) - last[0] < 3 * 3600 && cutoff - ref[0] < 3 * 3600
    if (fresh && Number.isFinite(usd) && usd > 0 && Number.isFinite(prev) && prev > 0) return { usd, change: ((usd - prev) / prev) * 100, window: '24h', source: 'kraken' }
    errs.push('kraken empty or stale')
  } catch (e: any) { errs.push(String(e?.message ?? e)) }
  try {
    const j = await getJson(CG)
    const usd = Number(j?.celo?.usd)
    if (Number.isFinite(usd)) {
      return { usd, change: Number(j.celo.usd_24h_change ?? 0), window: '24h', source: 'coingecko' }
    }
    errs.push('coingecko empty')
  } catch (e: any) { errs.push(String(e?.message ?? e)) }
  throw new Error('price sources failed: ' + errs.join('; '))
}

async function getBlock(): Promise<any> {
  const errs: string[] = []
  for (const url of [RPC, 'https://rpc.ankr.com/celo']) {
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_getBlockByNumber', params: ['latest', false] }), signal: AbortSignal.timeout(8000) })
      if (!r.ok) throw new Error(`${new URL(url).host} ${r.status}`)
      const j: any = await r.json()
      if (j.result?.baseFeePerGas) return j.result
      throw new Error(`${new URL(url).host} bad result`)
    } catch (e: any) { errs.push(String(e?.message ?? e)) }
  }
  throw new Error('rpc failed: ' + errs.join('; '))
}

let inflight: Promise<Brief> | null = null
export async function getBrief(now = Date.now()): Promise<Brief> {
  if (cache && now - cache.at < TTL_MS) return cache.value
  // One upstream fetch at a time: concurrent requests share it.
  if (!inflight) inflight = build(now).finally(() => { inflight = null })
  return inflight
}

async function build(now: number): Promise<Brief> {
  const [blk, price] = await Promise.all([getBlock(), getPrice()])
  const baseFeeGwei = Number(BigInt(blk.baseFeePerGas)) / 1e9
  const block = Number(BigInt(blk.number))
  const dir = price.change >= 0 ? 'up' : 'down'
  const r2 = (n: number) => Math.round(n * 100) / 100
  const brief: Brief = {
    date: new Date(now).toISOString().slice(0, 10),
    celoUsd: Math.round(price.usd * 10000) / 10000,
    change24hPct: r2(price.change),
    changeWindow: price.window,
    block,
    blockTime: new Date(Number(BigInt(blk.timestamp)) * 1000).toISOString(),
    baseFeeGwei: r2(baseFeeGwei),
    summary: `CELO is ${dir} ${Math.abs(price.change).toFixed(2)}% (${price.window}) at $${price.usd.toFixed(4)}. Celo block ${block}, base fee ${baseFeeGwei.toFixed(1)} gwei.`,
    sources: ['forno.celo.org (JSON-RPC)', `price: ${price.source}`],
  }
  cache = { at: now, value: brief }
  return brief
}

export function _resetBriefCache() { cache = null; inflight = null }
