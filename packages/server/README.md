# site-assistant-server

WebSocket server library for remote browser UI control. Part of [site-assistant](https://github.com/NikGariel/site-assistant).

## Install

```bash
npm install site-assistant-server
```

## Usage

```typescript
import { SiteAssistantServer } from 'site-assistant-server'

const server = new SiteAssistantServer({
  port: 3100,
  onAuth: async (clientId, meta) => {
    // Verify token/session
    return meta.token === process.env.VALID_TOKEN
  },
  maxCommandsPerSecond: 10,
})

server.on('connection', (client) => {
  console.log('Connected:', client.id, client.meta)
})

// Send commands
server.sendCommand(clientId, { action: 'highlight', target: 'signup_button', options: { duration: 3000 } })
server.sendMessage(clientId, 'Click the button above!')
server.sendScenario(clientId, [
  { action: 'scroll', target: 'features' },
  { action: 'highlight', target: 'features', options: { duration: 2000 } },
  { action: 'ghost_cursor', target: 'signup_button', options: { click: true } },
])

// Find clients by metadata
const clients = server.findClients({ userId: '123' })

// Force disconnect
server.disconnect(clientId, 'Session expired')
```

## Attach to existing HTTP server

```typescript
import { createServer } from 'http'
import { SiteAssistantServer } from 'site-assistant-server'

const httpServer = createServer(app) // Express, Koa, etc.
const assistant = new SiteAssistantServer({ server: httpServer })
```

## NestJS Integration

```typescript
import { Module, OnModuleInit } from '@nestjs/common'
import { HttpAdapterHost } from '@nestjs/core'
import { SiteAssistantServer } from 'site-assistant-server'

@Module({ providers: [SiteAssistantService] })
export class SiteAssistantModule implements OnModuleInit {
  constructor(private http: HttpAdapterHost) {}

  onModuleInit() {
    const server = new SiteAssistantServer({
      server: this.http.httpAdapter.getHttpServer(),
      onAuth: (id, meta) => validateJwt(meta.token),
    })
  }
}
```

## AI Integration

### MCP Server

```typescript
import { createMCPServer } from 'site-assistant-server'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

const mcp = createMCPServer(server)
await mcp.connect(new StdioServerTransport())
```

### Tool Schemas (OpenAI / Anthropic)

```typescript
// Get tool definitions for your LLM
const tools = server.getToolDefinitions('anthropic') // or 'openai' or 'raw'

// Execute tool calls from LLM responses
const result = await server.executeTool('send_command', {
  clientId: 'c1',
  action: { action: 'highlight', target: 'pricing' }
})
```

## API

### `new SiteAssistantServer(options)`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `port` | number | 3100 | WebSocket port (standalone mode) |
| `server` | http.Server | - | Attach to existing HTTP server |
| `onAuth` | function | - | Auth callback `(clientId, meta) => boolean` |
| `maxCommandsPerSecond` | number | 10 | Rate limit per client |

### Methods

| Method | Description |
|--------|-------------|
| `sendCommand(clientId, action)` | Send single action |
| `sendMessage(clientId, text)` | Send text message |
| `sendScenario(clientId, steps)` | Send step-by-step guide |
| `findClients(filter)` | Find clients by meta |
| `listClients()` | List all connected clients |
| `disconnect(clientId, reason?)` | Force disconnect |
| `getToolDefinitions(format)` | Get AI tool schemas |
| `executeTool(name, args)` | Execute AI tool call |
| `close()` | Shut down server |

### Events

| Event | Args | Description |
|-------|------|-------------|
| `connection` | `{id, meta}` | Client connected |
| `disconnect` | `{id, meta}` | Client disconnected |
| `event` | `{id, meta}, event, payload` | Client sent event |
| `action_result` | `{id, meta}, actionId, success, error?` | Action result |

## License

MIT
