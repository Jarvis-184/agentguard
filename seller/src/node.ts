import { serve } from '@hono/node-server'
import { createApp } from './app.js'
const port = Number(process.env.PORT ?? 8787)
serve({ fetch: createApp(process.env as any).fetch, port })
console.log(`seller on :${port}`)
