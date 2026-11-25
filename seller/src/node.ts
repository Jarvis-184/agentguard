import { serve } from '@hono/node-server'
import { createApp } from './app.js'

const app = createApp(process.env as any)
const port = Number(process.env.PORT ?? 8787)

// Behind a TLS-terminating proxy (Render) the app sees http. Rebuild the URL from
// the forwarded headers so the 402 challenge carries the public https resource URL.
serve({
  port,
  fetch: (req) => {
    const proto = req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim()
    const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
    if (!proto || !host) return app.fetch(req)
    const u = new URL(req.url)
    return app.fetch(new Request(`${proto}://${host}${u.pathname}${u.search}`, req))
  },
})
console.log(`seller on :${port}`)
