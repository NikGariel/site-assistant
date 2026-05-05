import { SiteAssistantServer } from 'site-assistant-server'
import { createServer } from 'http'
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import OpenAI from 'openai'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT = parseInt(process.env.PORT || '3100')
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

if (!OPENAI_API_KEY) {
  console.error('ERROR: OPENAI_API_KEY environment variable is required')
  process.exit(1)
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY })

// Serve static files
const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
}

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
  const url = req.url || '/'

  // Static files
  if (url === '/' || url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(readFileSync(join(__dirname, 'index.html')))
    return
  }
  if (url === '/site-assistant.js') {
    const bundlePath = join(__dirname, '../packages/client/dist/index.umd.js')
    if (existsSync(bundlePath)) {
      res.writeHead(200, { 'Content-Type': 'application/javascript' })
      res.end(readFileSync(bundlePath))
    } else {
      res.writeHead(404)
      res.end('Client bundle not found. Run pnpm build first.')
    }
    return
  }

  // Chat API
  if (req.method === 'POST' && url === '/api/chat') {
    const { message, clientId } = await parseBody(req)
    res.setHeader('Content-Type', 'application/json')

    if (!message || !clientId) {
      res.writeHead(400)
      res.end(JSON.stringify({ error: 'message and clientId required' }))
      return
    }

    try {
      // Get current page state
      let pageState = server.getPageState(clientId)
      if (!pageState) {
        try {
          pageState = await server.requestState(clientId, 3000)
        } catch {}
      }

      // Build context for OpenAI
      const tools = server.getToolDefinitions('openai')
      const systemPrompt = buildSystemPrompt(pageState)

      const messages: any[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ]

      // Call OpenAI with tools
      let response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        tools: tools.filter((t: any) =>
          ['send_command', 'send_message', 'send_scenario'].includes(t.function.name)
        ),
        tool_choice: 'auto',
      })

      let assistantMessage = response.choices[0].message

      // Process tool calls
      while (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        messages.push(assistantMessage)

        for (const toolCall of assistantMessage.tool_calls) {
          const args = JSON.parse(toolCall.function.arguments)
          // Inject clientId into tool args
          args.clientId = clientId
          try {
            const result = await server.executeTool(toolCall.function.name, args)
            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(result),
            })
          } catch (err: any) {
            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify({ error: err.message }),
            })
          }
        }

        response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages,
          tools: tools.filter((t: any) =>
            ['send_command', 'send_message', 'send_scenario'].includes(t.function.name)
          ),
          tool_choice: 'auto',
        })
        assistantMessage = response.choices[0].message
      }

      res.writeHead(200)
      res.end(JSON.stringify({
        reply: assistantMessage.content || 'Done!',
      }))
    } catch (err: any) {
      console.error('Chat error:', err)
      res.writeHead(500)
      res.end(JSON.stringify({ error: err.message }))
    }
    return
  }

  // API endpoints
  res.setHeader('Content-Type', 'application/json')

  if (req.method === 'GET' && url === '/api/tools') {
    res.writeHead(200)
    res.end(JSON.stringify(server.getToolDefinitions('openai')))
    return
  }

  if (req.method === 'GET' && url === '/api/clients') {
    res.writeHead(200)
    res.end(JSON.stringify(server.listClients()))
    return
  }

  res.writeHead(404)
  res.end(JSON.stringify({ error: 'Not found' }))
})

const server = new SiteAssistantServer({ server: httpServer })

function buildSystemPrompt(pageState: any): string {
  let elementsDescription = 'No page state available.'
  if (pageState?.elements) {
    const entries = Object.entries(pageState.elements).map(([name, info]: [string, any]) => {
      const parts = [`- ${name} (${info.tag})`]
      if (info.label) parts.push(`"${info.label}"`)
      else if (info.text) parts.push(`"${info.text.slice(0, 60)}"`)
      if (!info.visible) parts.push('[hidden]')
      if (!info.enabled) parts.push('[disabled]')
      if (info.value !== undefined) parts.push(`value="${info.value}"`)
      if (info.inputType) parts.push(`type=${info.inputType}`)
      return parts.join(' ')
    })
    elementsDescription = `Page: ${pageState.url}\nTitle: ${pageState.title}\n\nAvailable elements:\n${entries.join('\n')}`
  }

  return `You are an AI assistant helping users navigate a website. You can control the page by highlighting elements, scrolling to sections, clicking buttons, filling forms, showing messages near elements, and moving a ghost cursor.

${elementsDescription}

When helping users:
- Use "highlight" to draw attention to elements (with a glowing border effect)
- Use "scroll" to navigate to off-screen sections
- Use "ghost_cursor" with click:true to demonstrate clicking something
- Use "show_message" to annotate elements with helpful tips
- Use "fill" to demonstrate form filling
- Use "send_scenario" for multi-step guided tours
- Keep your text responses concise and friendly
- Always use the target names exactly as listed above
- Respond in the same language the user writes in`
}

server.on('connection', (client) => {
  console.log(`Client connected: ${client.id}`)
})

server.on('disconnect', (client) => {
  console.log(`Client disconnected: ${client.id}`)
})

server.on('page_state', (client, state) => {
  console.log(`Page state from ${client.id}: ${Object.keys(state.elements).length} elements`)
})

server.on('action_result', (_client, actionId, success, error) => {
  const icon = success ? 'ok' : 'FAIL'
  console.log(`  Action [${actionId.slice(0, 8)}]: ${icon}${error ? ' -- ' + error : ''}`)
})

httpServer.listen(PORT, () => {
  console.log(`
===========================================
  Site Assistant Demo
  http://localhost:${PORT}

  AI Chat: built-in (OpenAI)
  WebSocket: same port
===========================================
  `)
})
