import { serve } from '@hono/node-server'
import { createApp } from './app.js'

const app = createApp(process.env as any)
const port = Number(process.env.PORT ?? 8787)

// Behind a TLS-terminating proxy (Render) the app sees http. Rebuild the URL from
// the forwarded headers so the 402 challenge carries the public https resource URL.
serve({
  port,
  fetch: (req) => {
    // Fixed public origin (Render sets RENDER_EXTERNAL_URL). Client-supplied
    // forwarded host headers are never trusted.
    const origin = process.env.PUBLIC_BASE_URL ?? process.env.RENDER_EXTERNAL_URL
    if (!origin) return app.fetch(req)
    const u = new URL(req.url)
    return app.fetch(new Request(`${origin.replace(/\/$/, '')}${u.pathname}${u.search}`, req))
  },
})
console.log(`seller on :${port}`)
