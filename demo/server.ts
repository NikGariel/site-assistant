import { SiteAssistantServer } from 'site-assistant-server'
import { createServer } from 'http'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Predefined scenarios
const SCENARIOS = {
  tour: [
    { action: 'scroll' as const, target: 'hero' },
    { action: 'highlight' as const, target: 'hero', options: { duration: 1500 } },
    { action: 'scroll' as const, target: 'features' },
    { action: 'highlight' as const, target: 'features', options: { duration: 1500 } },
    { action: 'scroll' as const, target: 'pricing' },
    { action: 'highlight' as const, target: 'pricing', options: { duration: 1500 } },
    { action: 'ghost_cursor' as const, target: 'signup_button', options: { click: false } },
    { action: 'show_message' as const, target: 'signup_button', text: 'Click here to get started!', options: { position: 'bottom' as const } },
  ],
  signup: [
    { action: 'scroll' as const, target: 'signup_form' },
    { action: 'highlight' as const, target: 'signup_form', options: { duration: 1500 } },
    { action: 'ghost_cursor' as const, target: 'input_name', options: { click: true } },
    { action: 'fill' as const, target: 'input_name', value: 'John Doe' },
    { action: 'ghost_cursor' as const, target: 'input_email', options: { click: true } },
    { action: 'fill' as const, target: 'input_email', value: 'john@example.com' },
    { action: 'ghost_cursor' as const, target: 'submit_button', options: { click: false } },
    { action: 'show_message' as const, target: 'submit_button', text: 'Now click Submit!', options: { position: 'top' as const } },
  ],
  features: [
    { action: 'scroll' as const, target: 'features' },
    { action: 'highlight' as const, target: 'feature_speed', options: { duration: 1500 } },
    { action: 'show_message' as const, target: 'feature_speed', text: 'Lightning fast builds', options: { position: 'bottom' as const } },
    { action: 'highlight' as const, target: 'feature_security', options: { duration: 1500 } },
    { action: 'show_message' as const, target: 'feature_security', text: 'Enterprise-grade protection', options: { position: 'bottom' as const } },
    { action: 'highlight' as const, target: 'feature_scale', options: { duration: 1500 } },
    { action: 'show_message' as const, target: 'feature_scale', text: 'From startup to enterprise', options: { position: 'bottom' as const } },
  ],
}

// Parse JSON body
function parseBody(req: any): Promise<any> {
  return new Promise((resolve) => {
    let body = ''
    req.on('data', (chunk: string) => { body += chunk })
    req.on('end', () => {
      try { resolve(JSON.parse(body)) }
      catch { resolve({}) }
    })
  })
}

const httpServer = createServer(async (req, res) => {
  // Static files
  if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(readFileSync(join(__dirname, 'index.html')))
    return
  }
  if (req.url === '/site-assistant.js') {
    res.writeHead(200, { 'Content-Type': 'application/javascript' })
    res.end(readFileSync(join(__dirname, '../packages/client/dist/index.umd.js')))
    return
  }

  // REST API for control panel
  res.setHeader('Content-Type', 'application/json')

  if (req.method === 'GET' && req.url === '/api/tools') {
    res.writeHead(200)
    res.end(JSON.stringify(server.getToolDefinitions('anthropic')))
    return
  }

  if (req.method === 'GET' && req.url === '/api/clients') {
    res.writeHead(200)
    res.end(JSON.stringify(server.listClients()))
    return
  }

  if (req.method === 'POST' && req.url === '/api/command') {
    const body = await parseBody(req)
    const clients = server.listClients()
    if (clients.length === 0) {
      res.writeHead(400)
      res.end(JSON.stringify({ error: 'No clients connected' }))
      return
    }
    try {
      // Send to first connected client (demo assumes single client)
      const clientId = clients[0].id
      const actionId = server.sendCommand(clientId, body)
      res.writeHead(200)
      res.end(JSON.stringify({ ok: true, actionId }))
    } catch (e: any) {
      res.writeHead(400)
      res.end(JSON.stringify({ error: e.message }))
    }
    return
  }

  if (req.method === 'POST' && req.url === '/api/message') {
    const body = await parseBody(req)
    const clients = server.listClients()
    if (clients.length === 0) {
      res.writeHead(400)
      res.end(JSON.stringify({ error: 'No clients connected' }))
      return
    }
    server.sendMessage(clients[0].id, body.text || 'Hello!')
    res.writeHead(200)
    res.end(JSON.stringify({ ok: true }))
    return
  }

  if (req.method === 'POST' && req.url === '/api/scenario') {
    const body = await parseBody(req)
    const clients = server.listClients()
    if (clients.length === 0) {
      res.writeHead(400)
      res.end(JSON.stringify({ error: 'No clients connected' }))
      return
    }
    const steps = SCENARIOS[body.scenario as keyof typeof SCENARIOS]
    if (!steps) {
      res.writeHead(400)
      res.end(JSON.stringify({ error: `Unknown scenario: ${body.scenario}` }))
      return
    }
    server.sendScenario(clients[0].id, steps)
    res.writeHead(200)
    res.end(JSON.stringify({ ok: true, steps: steps.length }))
    return
  }

  res.writeHead(404)
  res.end(JSON.stringify({ error: 'Not found' }))
})

const server = new SiteAssistantServer({ server: httpServer })

server.on('connection', (client) => {
  console.log(`\n✓ Client connected: ${client.id}`)
  console.log(`  Meta:`, client.meta)
})

server.on('disconnect', (client) => {
  console.log(`✗ Client disconnected: ${client.id}`)
})

server.on('event', (client, event, payload) => {
  console.log(`← Event [${client.id}]: ${event}`, payload || '')
})

server.on('action_result', (client, actionId, success, error) => {
  const icon = success ? '✓' : '✗'
  console.log(`  ${icon} Result [${actionId.slice(0, 8)}]: ${success ? 'OK' : error}`)
})

httpServer.listen(3100, () => {
  console.log(`
╔══════════════════════════════════════════╗
║   Site Assistant Demo                    ║
║   http://localhost:3100                  ║
╠══════════════════════════════════════════╣
║   REST API:                              ║
║   GET  /api/tools    — tool definitions  ║
║   GET  /api/clients  — connected clients ║
║   POST /api/command  — send action       ║
║   POST /api/message  — send message      ║
║   POST /api/scenario — run scenario      ║
╚══════════════════════════════════════════╝
  `)
})
