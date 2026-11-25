/** Market brief data: public sources only, no keys. Cached for 5 minutes. */
export interface Brief {
  date: string
  celoUsd: number
  change24hPct: number
  block: number
  blockTime: string
  baseFeeGwei: number
  usdcUsd: number | null
  summary: string
  sources: string[]
}

const RPC = 'https://forno.celo.org'
const CG = 'https://api.coingecko.com/api/v3/simple/price?ids=celo,usd-coin&vs_currencies=usd&include_24hr_change=true'
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

export async function getBrief(now = Date.now()): Promise<Brief> {
  if (cache && now - cache.at < TTL_MS) return cache.value
  const [blk, price] = await Promise.all([
    rpc('eth_getBlockByNumber', ['latest', false]),
    fetch(CG, { signal: AbortSignal.timeout(8000), headers: { accept: 'application/json' } }).then((r) => {
      if (!r.ok) throw new Error(`price ${r.status}`)
      return r.json() as Promise<any>
    }),
  ])
  const celoUsd = Number(price?.celo?.usd)
  if (!Number.isFinite(celoUsd)) throw new Error('price missing')
  const change = Number(price.celo.usd_24h_change ?? 0)
  const baseFeeGwei = Number(BigInt(blk.baseFeePerGas)) / 1e9
  const block = Number(BigInt(blk.number))
  const blockTime = new Date(Number(BigInt(blk.timestamp)) * 1000).toISOString()
  const usdc = Number(price?.['usd-coin']?.usd)
  const dir = change >= 0 ? 'up' : 'down'
  const brief: Brief = {
    date: new Date(now).toISOString().slice(0, 10),
    celoUsd: Math.round(celoUsd * 10000) / 10000,
    change24hPct: Math.round(change * 100) / 100,
    block,
    blockTime,
    baseFeeGwei: Math.round(baseFeeGwei * 100) / 100,
    usdcUsd: Number.isFinite(usdc) ? Math.round(usdc * 10000) / 10000 : null,
    summary: `CELO is ${dir} ${Math.abs(change).toFixed(2)}% in 24h at $${celoUsd.toFixed(4)}. Celo block ${block}, base fee ${baseFeeGwei.toFixed(1)} gwei.`,
    sources: ['forno.celo.org (JSON-RPC)', 'api.coingecko.com (simple price)'],
  }
  cache = { at: now, value: brief }
  return brief
}

export function _resetBriefCache() { cache = null }
