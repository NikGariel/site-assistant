# site-assistant

WebSocket-based client + server library for remote UI control. Send commands (highlight, scroll, click, fill, ghost cursor) to specific browser windows. No AI logic inside — integrate with any LLM via MCP tools or tool schemas.

## Quick Start

```bash
pnpm install
pnpm build
```

### Server

```typescript
import { SiteAssistantServer } from 'site-assistant-server'

const server = new SiteAssistantServer({ port: 3100 })

server.on('connection', (client) => {
  console.log('Connected:', client.id, client.meta)

  server.sendCommand(client.id, {
    action: 'highlight',
    target: 'signup_button',
    options: { duration: 3000 }
  })
})

// Find specific client
const clients = server.findClients({ userId: '123' })
```

### Client (Browser)

```html
<button data-ai="signup_button">Sign Up</button>

<script src="site-assistant-client/dist/index.umd.js"></script>
<script>
  const assistant = new SiteAssistantSDK.SiteAssistant({
    url: 'wss://your-server.com',
    meta: { userId: '123', sessionId: 'abc' }
  })
  assistant.connect()
</script>
```

Or as ESM:

```typescript
import { SiteAssistant } from 'site-assistant-client'

const assistant = new SiteAssistant({
  url: 'wss://your-server.com',
  meta: { userId: '123' }
})
assistant.connect()
assistant.register('custom_el', '#my-element')
```

## AI Integration

### MCP Server

```typescript
import { createMCPServer } from 'site-assistant-server'

const mcp = createMCPServer(server)
// Connect via stdio or SSE transport
```

### Tool Schemas (for direct LLM API calls)

```typescript
const tools = server.getToolDefinitions('anthropic') // or 'openai' or 'raw'
const result = await server.executeTool('send_command', {
  clientId: 'c1',
  action: { action: 'highlight', target: 'signup_button' }
})
```

## Available Actions

| Action | Description |
|--------|-------------|
| `highlight` | Overlay + glow border around element |
| `scroll` | Smooth scroll to element |
| `click` | Programmatic click |
| `fill` | Set input value + dispatch events |
| `show_message` | Tooltip near element |
| `ghost_cursor` | Animated cursor moving to element |

## Element Registration

Elements are identified by `data-ai` attribute:

```html
<button data-ai="my_button">Click me</button>
```

Or registered programmatically:

```typescript
assistant.register('my_button', '#header .btn-primary')
```

## Demo

```bash
pnpm build
pnpm --filter site-assistant-demo start
# Open http://localhost:3100
```
