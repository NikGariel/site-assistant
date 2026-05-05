# Site Assistant — Design Spec

## Overview

WebSocket-based client+server library for remote control of web page UI. No AI logic inside — pure transport + command execution. AI/LLM integration is the user's responsibility (via MCP tools, REST, scripts, etc.).

## Architecture

Monorepo with shared types:

```
site-assistant/
├── packages/
│   ├── client/   — browser SDK (ESM + UMD)
│   └── server/   — Node.js library
├── shared/       — protocol types
└── demo/         — usage example
```

## Protocol

All messages are JSON over WebSocket.

### Client → Server

| Type | Purpose |
|------|---------|
| `connect` | Initial handshake with clientId + meta (auth/routing data) |
| `action_result` | Report success/failure of a command execution |
| `event` | Notify server about something (element clicked, page changed, etc.) |

Client NEVER initiates requests. Only accepts commands and reports back.

### Server → Client

| Type | Purpose |
|------|---------|
| `command` | Single action to execute |
| `message` | Text message to display |
| `scenario` | Ordered list of actions (step-by-step guide) |

### Message Shapes

```typescript
// Client → Server
interface ConnectMessage {
  type: 'connect'
  clientId: string
  meta: Record<string, any>  // userId, sessionId, page, role, etc.
}

interface ActionResultMessage {
  type: 'action_result'
  actionId: string
  success: boolean
  error?: string
}

interface EventMessage {
  type: 'event'
  event: string
  payload?: any
}

// Server → Client
interface CommandMessage {
  type: 'command'
  actionId: string
  action: Action
}

interface TextMessage {
  type: 'message'
  text: string
}

interface ScenarioMessage {
  type: 'scenario'
  steps: Action[]
}
```

### Actions

```typescript
type Action =
  | { action: 'highlight'; target: string; options?: { duration?: number } }
  | { action: 'scroll'; target: string }
  | { action: 'click'; target: string }
  | { action: 'fill'; target: string; value: string }
  | { action: 'show_message'; target: string; text: string; options?: { position?: 'top'|'bottom'|'left'|'right' } }
  | { action: 'ghost_cursor'; target: string; options?: { click?: boolean } }
```

`target` — value of `data-ai` attribute on the element.

## Element Identification

Strict whitelist approach:
- Elements must have `data-ai="name"` attribute in HTML
- Alternatively, registered via `assistant.register('name', selector)` in JS
- Lookup order: `[data-ai="name"]` first, then registered selector
- If element not found — action fails, `action_result` reports error

## Server Library

```typescript
import { SiteAssistantServer } from 'site-assistant-server'

const server = new SiteAssistantServer({ port: 3100 })
// or: server.attach(existingHttpServer)

server.on('connection', (client) => {
  // client.id, client.meta
})

server.on('disconnect', (client) => { ... })
server.on('event', (client, event, payload) => { ... })
server.on('action_result', (client, actionId, success, error?) => { ... })

// Send to specific client
server.sendCommand(clientId, action)
server.sendMessage(clientId, text)
server.sendScenario(clientId, steps)

// Find clients by meta filter
const clients = server.findClients({ userId: '123' })
// Returns clients where meta contains all specified key-value pairs
```

No buffering. If client is not connected, sendCommand throws/returns error.

## Client Library

```typescript
// ESM
import { SiteAssistant } from 'site-assistant-client'

const assistant = new SiteAssistant({
  url: 'wss://example.com/assistant',
  meta: { userId: '123', sessionId: 'abc', page: '/pricing' }
})

assistant.connect()

// Register elements programmatically (alternative to data-ai in HTML)
assistant.register('signup_button', '#header .signup-btn')

// Send events to server
assistant.emit('page_changed', { url: '/pricing' })

// Listen
assistant.on('message', (text) => { ... })
assistant.on('scenario_start', (steps) => { ... })
assistant.on('scenario_end', () => { ... })
assistant.on('disconnect', () => { ... })
assistant.on('reconnect', () => { ... })

assistant.disconnect()
```

### Built-in Visual Effects

- **highlight** — dark overlay over entire page + bright border/glow around target element, element "pops" above overlay via z-index
- **ghost_cursor** — SVG cursor element, animates from center of screen to target element, optional click animation
- **scroll** — `scrollIntoView({ behavior: 'smooth', block: 'center' })`
- **click** — programmatic `.click()` on element
- **fill** — sets `.value`, dispatches `input` + `change` events
- **show_message** — tooltip/popover positioned near the element

### Scenarios (Step-by-step)

- Actions execute sequentially
- Each action waits for previous animation to complete
- Shows step indicator ("Step 1/3")
- Reports `action_result` for each step
- If a step fails — scenario stops, reports error

## Reconnection

Client:
- Auto-reconnect with exponential backoff: 1s, 2s, 4s... cap at 30s
- On reconnect: re-sends `connect` with same meta
- Commands received during disconnect are lost (no buffering)

Server:
- On disconnect: removes client from connection map
- On reconnect with same clientId: replaces old entry
- sendCommand to non-existent client: returns error

## AI Integration Layer

Two built-in mechanisms for AI to call server methods:

### MCP Server (built-in)

```typescript
import { SiteAssistantServer } from 'site-assistant-server'

const server = new SiteAssistantServer({ port: 3100 })

// Start MCP server (SSE transport on separate port, or stdio)
server.startMCP({ transport: 'sse', port: 3101 })
// or: server.startMCP({ transport: 'stdio' })
```

Exposed MCP tools:
- `find_clients({ filter })` — find connected clients by meta
- `send_command({ clientId, action })` — send single action
- `send_message({ clientId, text })` — send text message
- `send_scenario({ clientId, steps })` — send step-by-step guide
- `list_clients()` — list all connected clients with their meta

### Tool Schema Generator

For non-MCP setups (OpenAI function calling, Anthropic tools, etc.):

```typescript
// Get tool definitions in desired format
const tools = server.getToolDefinitions('anthropic') // or 'openai'

// Execute a tool call from LLM response
const result = await server.executeTool(toolName, toolArgs)
```

Supported formats:
- `'anthropic'` — Anthropic tool_use format
- `'openai'` — OpenAI function calling format
- `'raw'` — plain JSON Schema

Both mechanisms expose the same set of operations. MCP is for agent frameworks that support it natively; tool schemas are for direct LLM API usage.

## Build & Distribution

- **Client**: tsup → ESM (`site-assistant-client.mjs`) + UMD (`site-assistant-client.umd.js`). CSS inlined in JS.
- **Server**: tsup → ESM + CJS
- **Shared**: just TypeScript types, imported at build time
- Workspaces: pnpm

## Non-goals

- No AI/LLM logic (but exposes tools for AI to call)
- No REST API (server exposes programmatic API + MCP + tool schemas)
- No offline queue / message persistence
- No CSS selector fallback (strict data-ai only)
- No automatic DOM scanning
