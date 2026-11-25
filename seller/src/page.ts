interface P { network: string; caip2: string; payTo: string; priceUsd: string; asset: string }
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

export function landingPage(p: P): string {
  const short = `${p.payTo.slice(0, 6)}…${p.payTo.slice(-4)}`
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="icon" href="/favicon.ico" type="image/svg+xml">
<title>AgentGuard Market Brief · x402 on Celo</title>
<meta name="description" content="A daily Celo market brief you pay for per request with USDC over x402. No account, no API key.">
<style>
:root{--bg:#fafaf7;--card:#fff;--ink:#1c1c1a;--mute:#6b6b66;--line:#e7e5de;--acc:#1f7a4d;--accbg:#e8f4ed;--code:#f3f2ec}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
main{max-width:760px;margin:0 auto;padding:40px 20px 56px}
.tag{display:inline-block;background:var(--accbg);color:var(--acc);font-size:13px;font-weight:600;padding:3px 10px;border-radius:99px}
h1{font-size:34px;line-height:1.15;margin:14px 0 8px;letter-spacing:-.02em}
.lead{color:var(--mute);font-size:18px;margin:0 0 28px}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:20px 22px;margin:0 0 16px}
.card h2{font-size:14px;letter-spacing:.06em;text-transform:uppercase;color:var(--mute);margin:0 0 12px}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.stat b{display:block;font-size:24px}
.stat span{color:var(--mute);font-size:13px}
dl{margin:0;display:grid;grid-template-columns:120px 1fr;gap:8px 12px;font-size:15px}
dt{color:var(--mute)}dd{margin:0}dd code{word-break:break-all}
code,pre{font:13.5px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;background:var(--code);border-radius:8px}
code{padding:1px 6px}
pre{padding:14px 16px;overflow:auto;margin:0}
ol{margin:0;padding-left:20px}ol li{margin:6px 0}
a{color:var(--acc)}
#pv{min-height:34px;font-size:15px}
.err{color:#9a3412}
footer{color:var(--mute);font-size:13px;margin-top:28px}
@media(max-width:560px){.stat b{font-size:20px}#pv{grid-template-columns:1fr 1fr}.stat:nth-child(3){grid-column:1/-1}pre{white-space:pre-wrap;word-break:break-all}h1{font-size:27px}.grid{grid-template-columns:1fr 1fr}dl{grid-template-columns:1fr}dt{margin-top:6px}}
</style></head>
<body><main>
<span class="tag">x402 · ${esc(p.network)}</span>
<h1>AgentGuard Market Brief</h1>
<p class="lead">A short Celo market brief for agents and apps. Pay <b>$${esc(p.priceUsd)}</b> in USDC per request. No account, no API key.</p>

<div class="card"><h2>Live preview (free)</h2>
<div id="pv" class="grid"><div class="stat"><b>…</b><span>loading</span></div></div></div>

<div class="card"><h2>Endpoint</h2>
<dl>
<dt>Paid route</dt><dd><code>GET /market-brief</code></dd>
<dt>Price</dt><dd>$${esc(p.priceUsd)} USDC (6 decimals)</dd>
<dt>Network</dt><dd>${esc(p.network)} (<code>${esc(p.caip2)}</code>)</dd>
<dt>Pay to</dt><dd><code title="${esc(p.payTo)}">${esc(p.payTo)}</code></dd>
<dt>Token</dt><dd><code>${esc(p.asset)}</code></dd>
<dt>Returns</dt><dd>JSON: CELO price, 24h change, latest block, base fee, one-line summary</dd>
</dl></div>

<div class="card"><h2>How to pay</h2>
<ol>
<li>Call the route. You get <code>402 Payment Required</code> with the terms.</li>
<li>Sign an EIP-3009 USDC authorization. It is off-chain, so you pay no gas.</li>
<li>Retry with the <code>PAYMENT-SIGNATURE</code> header. You get the brief and a settlement receipt.</li>
</ol>
<pre>curl -i ${"${origin}"}/market-brief</pre>
<p style="margin:12px 0 0;color:var(--mute);font-size:14px">Any x402 v2 client works, for example <code>@x402/fetch</code>. Settlement goes through the Celo x402 facilitator. If our data sources are down, the route returns 503 and you are not charged.</p>
</div>

<footer>Built by the AgentGuard agent for the Celo Agents Open for Business hackathon. Source: <a href="https://github.com/Jarvis-184/agentguard">github.com/Jarvis-184/agentguard</a>. Data: forno.celo.org and Kraken. Not financial advice.</footer>
</main>
<script>
document.querySelectorAll('pre').forEach(function(e){e.textContent=e.textContent.replace('\${origin}',location.origin)});
fetch('/preview').then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(d){
  var up=d.change24hPct>=0;
  document.getElementById('pv').innerHTML=
   '<div class="stat"><b>$'+d.celoUsd.toFixed(4)+'</b><span>CELO price</span></div>'+
   '<div class="stat"><b style="color:'+(up?'#1f7a4d':'#b42318')+'">'+(up?'+':'')+d.change24hPct.toFixed(2)+'%</b><span>'+(d.changeWindow||'24h')+' change</span></div>'+
   '<div class="stat"><b>'+d.date+'</b><span>date (UTC)</span></div>';
}).catch(function(){document.getElementById('pv').innerHTML='<div class="err" style="grid-column:1/-1">Preview unavailable right now. The paid route has the same data.</div>'});
</script>
</body></html>`
}
