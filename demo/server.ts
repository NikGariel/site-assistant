import { SiteAssistantServer } from 'site-assistant-server'
import { createServer } from 'http'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const httpServer = createServer((req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(readFileSync(join(__dirname, 'index.html')))
  } else if (req.url === '/site-assistant.js') {
    res.writeHead(200, { 'Content-Type': 'application/javascript' })
    res.end(readFileSync(join(__dirname, '../packages/client/dist/index.umd.js')))
  } else {
    res.writeHead(404)
    res.end()
  }
})

const server = new SiteAssistantServer({ server: httpServer })

server.on('connection', (client) => {
  console.log(`Client connected: ${client.id}`, client.meta)

  // Demo: send a highlight command after 2 seconds
  setTimeout(() => {
    server.sendMessage(client.id, 'Welcome! Let me show you around.')
    server.sendScenario(client.id, [
      { action: 'scroll', target: 'features' },
      { action: 'highlight', target: 'features', options: { duration: 2000 } },
      { action: 'ghost_cursor', target: 'signup_button', options: { click: false } },
      { action: 'show_message', target: 'signup_button', text: 'Click here to sign up!', options: { position: 'bottom' } },
    ])
  }, 2000)
})

server.on('event', (client, event, payload) => {
  console.log(`Event from ${client.id}: ${event}`, payload)
})

server.on('action_result', (client, actionId, success, error) => {
  console.log(`Action result from ${client.id}: ${actionId} = ${success}`, error || '')
})

httpServer.listen(3100, () => {
  console.log('Demo running at http://localhost:3100')
  console.log('Tool definitions (anthropic format):')
  console.log(JSON.stringify(server.getToolDefinitions('anthropic'), null, 2))
})
