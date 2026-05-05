# Site Assistant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a WebSocket client+server library for remote UI control with MCP/tool integration.

**Architecture:** Monorepo (pnpm workspaces) with shared types, server package (Node.js + ws), client package (browser SDK with ESM+UMD), and AI integration layer (MCP + tool schemas).

**Tech Stack:** TypeScript, pnpm workspaces, ws (WebSocket), tsup (bundler), vitest (testing), @modelcontextprotocol/sdk (MCP)

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json` (root)
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `shared/src/types.ts`
- Create: `shared/src/protocol.ts`
- Create: `shared/src/index.ts`
- Create: `shared/package.json`
- Create: `shared/tsconfig.json`
- Create: `packages/server/package.json`
- Create: `packages/server/tsconfig.json`
- Create: `packages/client/package.json`
- Create: `packages/client/tsconfig.json`

- [ ] **Step 1: Create root package.json**

```json
{
  "name": "site-assistant",
  "private": true,
  "scripts": {
    "build": "pnpm -r build",
    "test": "pnpm -r test"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "tsup": "^8.0.0",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 2: Create pnpm-workspace.yaml**

```yaml
packages:
  - shared
  - packages/*
```

- [ ] **Step 3: Create tsconfig.base.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist"
  }
}
```

- [ ] **Step 4: Create shared/package.json**

```json
{
  "name": "site-assistant-shared",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsup src/index.ts --format esm,cjs --dts",
    "test": "echo 'no tests yet'"
  }
}
```

- [ ] **Step 5: Create shared/tsconfig.json**

```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": { "outDir": "dist" },
  "include": ["src"]
}
```

- [ ] **Step 6: Create shared/src/types.ts**

```typescript
// === Actions ===

export interface HighlightAction {
  action: 'highlight'
  target: string
  options?: { duration?: number }
}

export interface ScrollAction {
  action: 'scroll'
  target: string
}

export interface ClickAction {
  action: 'click'
  target: string
}

export interface FillAction {
  action: 'fill'
  target: string
  value: string
}

export interface ShowMessageAction {
  action: 'show_message'
  target: string
  text: string
  options?: { position?: 'top' | 'bottom' | 'left' | 'right' }
}

export interface GhostCursorAction {
  action: 'ghost_cursor'
  target: string
  options?: { click?: boolean }
}

export type Action =
  | HighlightAction
  | ScrollAction
  | ClickAction
  | FillAction
  | ShowMessageAction
  | GhostCursorAction

// === Client → Server Messages ===

export interface ConnectMessage {
  type: 'connect'
  clientId: string
  meta: Record<string, any>
}

export interface ActionResultMessage {
  type: 'action_result'
  actionId: string
  success: boolean
  error?: string
}

export interface EventMessage {
  type: 'event'
  event: string
  payload?: any
}

export type ClientMessage = ConnectMessage | ActionResultMessage | EventMessage

// === Server → Client Messages ===

export interface CommandMessage {
  type: 'command'
  actionId: string
  action: Action
}

export interface TextMessage {
  type: 'message'
  text: string
}

export interface ScenarioMessage {
  type: 'scenario'
  steps: Action[]
}

export type ServerMessage = CommandMessage | TextMessage | ScenarioMessage
```

- [ ] **Step 7: Create shared/src/protocol.ts**

```typescript
export const MESSAGE_TYPES = {
  // Client → Server
  CONNECT: 'connect',
  ACTION_RESULT: 'action_result',
  EVENT: 'event',
  // Server → Client
  COMMAND: 'command',
  MESSAGE: 'message',
  SCENARIO: 'scenario',
} as const
```

- [ ] **Step 8: Create shared/src/index.ts**

```typescript
export * from './types.js'
export * from './protocol.js'
```

- [ ] **Step 9: Create packages/server/package.json**

```json
{
  "name": "site-assistant-server",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsup src/index.ts --format esm,cjs --dts",
    "test": "vitest run"
  },
  "dependencies": {
    "ws": "^8.17.0",
    "site-assistant-shared": "workspace:*"
  },
  "devDependencies": {
    "@types/ws": "^8.5.0"
  }
}
```

- [ ] **Step 10: Create packages/server/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "dist" },
  "include": ["src"],
  "references": [{ "path": "../../shared" }]
}
```

- [ ] **Step 11: Create packages/client/package.json**

```json
{
  "name": "site-assistant-client",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    },
    "./umd": "./dist/index.umd.js"
  },
  "scripts": {
    "build": "tsup src/index.ts --format esm,cjs --global-name SiteAssistantSDK",
    "test": "vitest run"
  },
  "dependencies": {
    "site-assistant-shared": "workspace:*"
  }
}
```

- [ ] **Step 12: Create packages/client/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "dist", "lib": ["ES2020", "DOM"] },
  "include": ["src"],
  "references": [{ "path": "../../shared" }]
}
```

- [ ] **Step 13: Install dependencies**

Run: `cd /Users/nik/WebstormProjects/site-assistant && pnpm install`

- [ ] **Step 14: Commit**

```bash
git add -A
git commit -m "chore: scaffold monorepo with shared types"
```

---

### Task 2: Server — Connection Manager

**Files:**
- Create: `packages/server/src/connection-manager.ts`
- Create: `packages/server/src/__tests__/connection-manager.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// packages/server/src/__tests__/connection-manager.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { ConnectionManager } from '../connection-manager.js'

describe('ConnectionManager', () => {
  let manager: ConnectionManager

  beforeEach(() => {
    manager = new ConnectionManager()
  })

  it('adds a client', () => {
    const ws = {} as any
    manager.add('client-1', ws, { userId: '123', page: '/home' })
    expect(manager.get('client-1')).toEqual({
      id: 'client-1',
      ws,
      meta: { userId: '123', page: '/home' },
    })
  })

  it('removes a client', () => {
    const ws = {} as any
    manager.add('client-1', ws, { userId: '123' })
    manager.remove('client-1')
    expect(manager.get('client-1')).toBeUndefined()
  })

  it('finds clients by meta filter', () => {
    const ws1 = {} as any
    const ws2 = {} as any
    const ws3 = {} as any
    manager.add('c1', ws1, { userId: '123', page: '/home' })
    manager.add('c2', ws2, { userId: '123', page: '/pricing' })
    manager.add('c3', ws3, { userId: '456', page: '/home' })

    const results = manager.findByMeta({ userId: '123' })
    expect(results).toHaveLength(2)
    expect(results.map((c) => c.id).sort()).toEqual(['c1', 'c2'])
  })

  it('finds clients by multiple meta fields', () => {
    const ws1 = {} as any
    const ws2 = {} as any
    manager.add('c1', ws1, { userId: '123', page: '/home' })
    manager.add('c2', ws2, { userId: '123', page: '/pricing' })

    const results = manager.findByMeta({ userId: '123', page: '/pricing' })
    expect(results).toHaveLength(1)
    expect(results[0].id).toBe('c2')
  })

  it('replaces client on duplicate id', () => {
    const ws1 = {} as any
    const ws2 = {} as any
    manager.add('c1', ws1, { userId: '123' })
    manager.add('c1', ws2, { userId: '456' })
    expect(manager.get('c1')?.ws).toBe(ws2)
    expect(manager.get('c1')?.meta.userId).toBe('456')
  })

  it('lists all clients', () => {
    manager.add('c1', {} as any, { a: 1 })
    manager.add('c2', {} as any, { b: 2 })
    expect(manager.listAll()).toHaveLength(2)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/nik/WebstormProjects/site-assistant && pnpm --filter site-assistant-server test`
Expected: FAIL — module not found

- [ ] **Step 3: Implement ConnectionManager**

```typescript
// packages/server/src/connection-manager.ts
import type WebSocket from 'ws'

export interface ClientEntry {
  id: string
  ws: WebSocket
  meta: Record<string, any>
}

export class ConnectionManager {
  private clients = new Map<string, ClientEntry>()

  add(id: string, ws: WebSocket, meta: Record<string, any>): void {
    this.clients.set(id, { id, ws, meta })
  }

  remove(id: string): void {
    this.clients.delete(id)
  }

  get(id: string): ClientEntry | undefined {
    return this.clients.get(id)
  }

  findByMeta(filter: Record<string, any>): ClientEntry[] {
    const entries = Array.from(this.clients.values())
    return entries.filter((client) =>
      Object.entries(filter).every(([key, value]) => client.meta[key] === value)
    )
  }

  listAll(): ClientEntry[] {
    return Array.from(this.clients.values())
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/nik/WebstormProjects/site-assistant && pnpm --filter site-assistant-server test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/server/src/connection-manager.ts packages/server/src/__tests__/connection-manager.test.ts
git commit -m "feat(server): add ConnectionManager"
```

---

### Task 3: Server — SiteAssistantServer Core

**Files:**
- Create: `packages/server/src/server.ts`
- Create: `packages/server/src/index.ts`
- Create: `packages/server/src/__tests__/server.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// packages/server/src/__tests__/server.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { SiteAssistantServer } from '../server.js'
import WebSocket, { WebSocketServer } from 'ws'

function connectClient(port: number, clientId: string, meta: Record<string, any>): Promise<WebSocket> {
  return new Promise((resolve) => {
    const ws = new WebSocket(`ws://localhost:${port}`)
    ws.on('open', () => {
      ws.send(JSON.stringify({ type: 'connect', clientId, meta }))
      // Give server time to process
      setTimeout(() => resolve(ws), 50)
    })
  })
}

describe('SiteAssistantServer', () => {
  let server: SiteAssistantServer
  const port = 9871

  beforeEach(async () => {
    server = new SiteAssistantServer({ port })
    await new Promise((r) => setTimeout(r, 100))
  })

  afterEach(async () => {
    server.close()
    await new Promise((r) => setTimeout(r, 100))
  })

  it('emits connection event with client info', async () => {
    const onConnection = vi.fn()
    server.on('connection', onConnection)

    const ws = await connectClient(port, 'c1', { userId: '123' })
    expect(onConnection).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'c1', meta: { userId: '123' } })
    )
    ws.close()
  })

  it('sends command to a connected client', async () => {
    const ws = await connectClient(port, 'c1', { userId: '123' })

    const messagePromise = new Promise<any>((resolve) => {
      ws.on('message', (data) => resolve(JSON.parse(data.toString())))
    })

    server.sendCommand('c1', { action: 'highlight', target: 'btn' })

    const msg = await messagePromise
    expect(msg.type).toBe('command')
    expect(msg.action).toEqual({ action: 'highlight', target: 'btn' })
    expect(msg.actionId).toBeDefined()
    ws.close()
  })

  it('throws when sending to non-existent client', () => {
    expect(() => server.sendCommand('no-such', { action: 'click', target: 'x' })).toThrow()
  })

  it('finds clients by meta', async () => {
    const ws1 = await connectClient(port, 'c1', { userId: '123' })
    const ws2 = await connectClient(port, 'c2', { userId: '456' })

    const found = server.findClients({ userId: '123' })
    expect(found).toHaveLength(1)
    expect(found[0].id).toBe('c1')

    ws1.close()
    ws2.close()
  })

  it('sends message to client', async () => {
    const ws = await connectClient(port, 'c1', { userId: '123' })

    const messagePromise = new Promise<any>((resolve) => {
      ws.on('message', (data) => resolve(JSON.parse(data.toString())))
    })

    server.sendMessage('c1', 'Hello!')

    const msg = await messagePromise
    expect(msg).toEqual({ type: 'message', text: 'Hello!' })
    ws.close()
  })

  it('sends scenario to client', async () => {
    const ws = await connectClient(port, 'c1', { userId: '123' })

    const messagePromise = new Promise<any>((resolve) => {
      ws.on('message', (data) => resolve(JSON.parse(data.toString())))
    })

    const steps = [
      { action: 'scroll' as const, target: 'section' },
      { action: 'highlight' as const, target: 'section' },
    ]
    server.sendScenario('c1', steps)

    const msg = await messagePromise
    expect(msg).toEqual({ type: 'scenario', steps })
    ws.close()
  })

  it('emits event from client', async () => {
    const onEvent = vi.fn()
    server.on('event', onEvent)

    const ws = await connectClient(port, 'c1', { userId: '123' })
    ws.send(JSON.stringify({ type: 'event', event: 'page_changed', payload: { url: '/new' } }))

    await new Promise((r) => setTimeout(r, 50))
    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'c1' }),
      'page_changed',
      { url: '/new' }
    )
    ws.close()
  })

  it('emits action_result from client', async () => {
    const onResult = vi.fn()
    server.on('action_result', onResult)

    const ws = await connectClient(port, 'c1', { userId: '123' })
    ws.send(JSON.stringify({ type: 'action_result', actionId: 'a1', success: true }))

    await new Promise((r) => setTimeout(r, 50))
    expect(onResult).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'c1' }),
      'a1',
      true,
      undefined
    )
    ws.close()
  })

  it('removes client on disconnect', async () => {
    const onDisconnect = vi.fn()
    server.on('disconnect', onDisconnect)

    const ws = await connectClient(port, 'c1', { userId: '123' })
    ws.close()

    await new Promise((r) => setTimeout(r, 100))
    expect(onDisconnect).toHaveBeenCalledWith(expect.objectContaining({ id: 'c1' }))
    expect(server.findClients({ userId: '123' })).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/nik/WebstormProjects/site-assistant && pnpm --filter site-assistant-server test`
Expected: FAIL

- [ ] **Step 3: Implement SiteAssistantServer**

```typescript
// packages/server/src/server.ts
import { WebSocketServer, WebSocket } from 'ws'
import { EventEmitter } from 'events'
import { ConnectionManager, ClientEntry } from './connection-manager.js'
import type { Action, ClientMessage, ServerMessage } from 'site-assistant-shared'
import { randomUUID } from 'crypto'
import type { Server as HttpServer } from 'http'

export interface SiteAssistantServerOptions {
  port?: number
  server?: HttpServer
}

export class SiteAssistantServer extends EventEmitter {
  private wss: WebSocketServer
  private connections: ConnectionManager
  private pendingSockets = new Map<WebSocket, NodeJS.Timeout>()

  constructor(options: SiteAssistantServerOptions) {
    super()
    this.connections = new ConnectionManager()

    if (options.server) {
      this.wss = new WebSocketServer({ server: options.server })
    } else {
      this.wss = new WebSocketServer({ port: options.port ?? 3100 })
    }

    this.wss.on('connection', (ws) => {
      // Wait for connect message
      const timeout = setTimeout(() => ws.close(), 5000)
      this.pendingSockets.set(ws, timeout)

      ws.on('message', (raw) => {
        const data = JSON.parse(raw.toString()) as ClientMessage
        this.handleMessage(ws, data)
      })

      ws.on('close', () => {
        // Clean up pending
        const t = this.pendingSockets.get(ws)
        if (t) {
          clearTimeout(t)
          this.pendingSockets.delete(ws)
        }
        // Find and remove client
        const client = this.findClientByWs(ws)
        if (client) {
          this.connections.remove(client.id)
          this.emit('disconnect', { id: client.id, meta: client.meta })
        }
      })
    })
  }

  private handleMessage(ws: WebSocket, msg: ClientMessage): void {
    switch (msg.type) {
      case 'connect': {
        const t = this.pendingSockets.get(ws)
        if (t) {
          clearTimeout(t)
          this.pendingSockets.delete(ws)
        }
        this.connections.add(msg.clientId, ws, msg.meta)
        this.emit('connection', { id: msg.clientId, meta: msg.meta })
        break
      }
      case 'event': {
        const client = this.findClientByWs(ws)
        if (client) {
          this.emit('event', { id: client.id, meta: client.meta }, msg.event, msg.payload)
        }
        break
      }
      case 'action_result': {
        const client = this.findClientByWs(ws)
        if (client) {
          this.emit('action_result', { id: client.id, meta: client.meta }, msg.actionId, msg.success, msg.error)
        }
        break
      }
    }
  }

  private findClientByWs(ws: WebSocket): ClientEntry | undefined {
    return this.connections.listAll().find((c) => c.ws === ws)
  }

  sendCommand(clientId: string, action: Action): string {
    const client = this.connections.get(clientId)
    if (!client) throw new Error(`Client "${clientId}" not connected`)
    const actionId = randomUUID()
    const msg: ServerMessage = { type: 'command', actionId, action }
    client.ws.send(JSON.stringify(msg))
    return actionId
  }

  sendMessage(clientId: string, text: string): void {
    const client = this.connections.get(clientId)
    if (!client) throw new Error(`Client "${clientId}" not connected`)
    const msg: ServerMessage = { type: 'message', text }
    client.ws.send(JSON.stringify(msg))
  }

  sendScenario(clientId: string, steps: Action[]): void {
    const client = this.connections.get(clientId)
    if (!client) throw new Error(`Client "${clientId}" not connected`)
    const msg: ServerMessage = { type: 'scenario', steps }
    client.ws.send(JSON.stringify(msg))
  }

  findClients(filter: Record<string, any>): Array<{ id: string; meta: Record<string, any> }> {
    return this.connections.findByMeta(filter).map((c) => ({ id: c.id, meta: c.meta }))
  }

  listClients(): Array<{ id: string; meta: Record<string, any> }> {
    return this.connections.listAll().map((c) => ({ id: c.id, meta: c.meta }))
  }

  close(): void {
    this.wss.close()
  }
}
```

- [ ] **Step 4: Create packages/server/src/index.ts**

```typescript
export { SiteAssistantServer } from './server.js'
export type { SiteAssistantServerOptions } from './server.js'
export { ConnectionManager } from './connection-manager.js'
export * from 'site-assistant-shared'
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd /Users/nik/WebstormProjects/site-assistant && pnpm --filter site-assistant-server test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/server/src/
git commit -m "feat(server): implement SiteAssistantServer core"
```

---

### Task 4: Server — AI Tools Layer

**Files:**
- Create: `packages/server/src/tools.ts`
- Create: `packages/server/src/__tests__/tools.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// packages/server/src/__tests__/tools.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { SiteAssistantServer } from '../server.js'
import { ToolExecutor } from '../tools.js'
import WebSocket from 'ws'

function connectClient(port: number, clientId: string, meta: Record<string, any>): Promise<WebSocket> {
  return new Promise((resolve) => {
    const ws = new WebSocket(`ws://localhost:${port}`)
    ws.on('open', () => {
      ws.send(JSON.stringify({ type: 'connect', clientId, meta }))
      setTimeout(() => resolve(ws), 50)
    })
  })
}

describe('ToolExecutor', () => {
  let server: SiteAssistantServer
  let tools: ToolExecutor
  const port = 9872

  beforeEach(async () => {
    server = new SiteAssistantServer({ port })
    tools = new ToolExecutor(server)
    await new Promise((r) => setTimeout(r, 100))
  })

  afterEach(() => {
    server.close()
  })

  it('returns tool definitions in anthropic format', () => {
    const defs = tools.getDefinitions('anthropic')
    expect(defs).toBeInstanceOf(Array)
    expect(defs.length).toBeGreaterThan(0)
    expect(defs[0]).toHaveProperty('name')
    expect(defs[0]).toHaveProperty('input_schema')
  })

  it('returns tool definitions in openai format', () => {
    const defs = tools.getDefinitions('openai')
    expect(defs[0]).toHaveProperty('type', 'function')
    expect(defs[0]).toHaveProperty('function')
  })

  it('executes list_clients tool', async () => {
    const ws = await connectClient(port, 'c1', { userId: '123' })
    const result = await tools.execute('list_clients', {})
    expect(result).toEqual([{ id: 'c1', meta: { userId: '123' } }])
    ws.close()
  })

  it('executes find_clients tool', async () => {
    const ws = await connectClient(port, 'c1', { userId: '123' })
    const result = await tools.execute('find_clients', { filter: { userId: '123' } })
    expect(result).toHaveLength(1)
    ws.close()
  })

  it('executes send_command tool', async () => {
    const ws = await connectClient(port, 'c1', { userId: '123' })

    const msgPromise = new Promise<any>((resolve) => {
      ws.on('message', (data) => resolve(JSON.parse(data.toString())))
    })

    const result = await tools.execute('send_command', {
      clientId: 'c1',
      action: { action: 'highlight', target: 'btn' },
    })

    const msg = await msgPromise
    expect(msg.type).toBe('command')
    expect(result).toHaveProperty('actionId')
    ws.close()
  })

  it('executes send_message tool', async () => {
    const ws = await connectClient(port, 'c1', { userId: '123' })

    const msgPromise = new Promise<any>((resolve) => {
      ws.on('message', (data) => resolve(JSON.parse(data.toString())))
    })

    await tools.execute('send_message', { clientId: 'c1', text: 'Hi' })

    const msg = await msgPromise
    expect(msg).toEqual({ type: 'message', text: 'Hi' })
    ws.close()
  })

  it('executes send_scenario tool', async () => {
    const ws = await connectClient(port, 'c1', { userId: '123' })

    const msgPromise = new Promise<any>((resolve) => {
      ws.on('message', (data) => resolve(JSON.parse(data.toString())))
    })

    const steps = [{ action: 'scroll' as const, target: 'sec' }]
    await tools.execute('send_scenario', { clientId: 'c1', steps })

    const msg = await msgPromise
    expect(msg).toEqual({ type: 'scenario', steps })
    ws.close()
  })

  it('throws on unknown tool', async () => {
    await expect(tools.execute('unknown', {})).rejects.toThrow()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/nik/WebstormProjects/site-assistant && pnpm --filter site-assistant-server test`
Expected: FAIL

- [ ] **Step 3: Implement ToolExecutor**

```typescript
// packages/server/src/tools.ts
import type { SiteAssistantServer } from './server.js'
import type { Action } from 'site-assistant-shared'

interface AnthropicTool {
  name: string
  description: string
  input_schema: Record<string, any>
}

interface OpenAITool {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: Record<string, any>
  }
}

const TOOL_DEFS = [
  {
    name: 'list_clients',
    description: 'List all currently connected clients with their metadata',
    schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'find_clients',
    description: 'Find connected clients by metadata filter (matches all key-value pairs)',
    schema: {
      type: 'object',
      properties: {
        filter: {
          type: 'object',
          description: 'Key-value pairs to match against client meta',
          additionalProperties: true,
        },
      },
      required: ['filter'],
    },
  },
  {
    name: 'send_command',
    description: 'Send a single action command to a specific client',
    schema: {
      type: 'object',
      properties: {
        clientId: { type: 'string', description: 'Target client ID' },
        action: {
          type: 'object',
          description: 'Action to execute: { action: "highlight"|"scroll"|"click"|"fill"|"show_message"|"ghost_cursor", target: string, ...options }',
          properties: {
            action: { type: 'string', enum: ['highlight', 'scroll', 'click', 'fill', 'show_message', 'ghost_cursor'] },
            target: { type: 'string' },
          },
          required: ['action', 'target'],
          additionalProperties: true,
        },
      },
      required: ['clientId', 'action'],
    },
  },
  {
    name: 'send_message',
    description: 'Send a text message to a specific client',
    schema: {
      type: 'object',
      properties: {
        clientId: { type: 'string', description: 'Target client ID' },
        text: { type: 'string', description: 'Message text to display' },
      },
      required: ['clientId', 'text'],
    },
  },
  {
    name: 'send_scenario',
    description: 'Send a step-by-step scenario (ordered list of actions) to a specific client',
    schema: {
      type: 'object',
      properties: {
        clientId: { type: 'string', description: 'Target client ID' },
        steps: {
          type: 'array',
          description: 'Ordered list of actions to execute sequentially',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string', enum: ['highlight', 'scroll', 'click', 'fill', 'show_message', 'ghost_cursor'] },
              target: { type: 'string' },
            },
            required: ['action', 'target'],
            additionalProperties: true,
          },
        },
      },
      required: ['clientId', 'steps'],
    },
  },
]

export class ToolExecutor {
  constructor(private server: SiteAssistantServer) {}

  getDefinitions(format: 'anthropic' | 'openai' | 'raw'): any[] {
    switch (format) {
      case 'anthropic':
        return TOOL_DEFS.map((t): AnthropicTool => ({
          name: t.name,
          description: t.description,
          input_schema: t.schema,
        }))
      case 'openai':
        return TOOL_DEFS.map((t): OpenAITool => ({
          type: 'function',
          function: {
            name: t.name,
            description: t.description,
            parameters: t.schema,
          },
        }))
      case 'raw':
        return TOOL_DEFS.map((t) => ({
          name: t.name,
          description: t.description,
          parameters: t.schema,
        }))
    }
  }

  async execute(toolName: string, args: Record<string, any>): Promise<any> {
    switch (toolName) {
      case 'list_clients':
        return this.server.listClients()
      case 'find_clients':
        return this.server.findClients(args.filter)
      case 'send_command': {
        const actionId = this.server.sendCommand(args.clientId, args.action as Action)
        return { actionId, sent: true }
      }
      case 'send_message':
        this.server.sendMessage(args.clientId, args.text)
        return { sent: true }
      case 'send_scenario':
        this.server.sendScenario(args.clientId, args.steps as Action[])
        return { sent: true }
      default:
        throw new Error(`Unknown tool: "${toolName}"`)
    }
  }
}
```

- [ ] **Step 4: Update packages/server/src/index.ts to export ToolExecutor**

```typescript
export { SiteAssistantServer } from './server.js'
export type { SiteAssistantServerOptions } from './server.js'
export { ConnectionManager } from './connection-manager.js'
export { ToolExecutor } from './tools.js'
export * from 'site-assistant-shared'
```

- [ ] **Step 5: Run tests**

Run: `cd /Users/nik/WebstormProjects/site-assistant && pnpm --filter site-assistant-server test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/server/src/tools.ts packages/server/src/__tests__/tools.test.ts packages/server/src/index.ts
git commit -m "feat(server): add ToolExecutor with anthropic/openai/raw formats"
```

---

### Task 5: Server — MCP Integration

**Files:**
- Create: `packages/server/src/mcp.ts`
- Create: `packages/server/src/__tests__/mcp.test.ts`

- [ ] **Step 1: Install MCP SDK**

Run: `cd /Users/nik/WebstormProjects/site-assistant && pnpm --filter site-assistant-server add @modelcontextprotocol/sdk`

- [ ] **Step 2: Write failing test**

```typescript
// packages/server/src/__tests__/mcp.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { SiteAssistantServer } from '../server.js'
import { createMCPServer } from '../mcp.js'

describe('MCP Server', () => {
  let server: SiteAssistantServer
  const port = 9873

  beforeEach(async () => {
    server = new SiteAssistantServer({ port })
    await new Promise((r) => setTimeout(r, 100))
  })

  afterEach(() => {
    server.close()
  })

  it('creates MCP server with tools', () => {
    const mcp = createMCPServer(server)
    expect(mcp).toBeDefined()
    // MCP server should have tool handlers registered
  })
})
```

- [ ] **Step 3: Implement MCP server**

```typescript
// packages/server/src/mcp.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { SiteAssistantServer } from './server.js'
import type { Action } from 'site-assistant-shared'

export function createMCPServer(server: SiteAssistantServer): McpServer {
  const mcp = new McpServer({
    name: 'site-assistant',
    version: '0.1.0',
  })

  mcp.tool('list_clients', 'List all connected clients with their metadata', {}, async () => {
    const clients = server.listClients()
    return { content: [{ type: 'text', text: JSON.stringify(clients, null, 2) }] }
  })

  mcp.tool(
    'find_clients',
    'Find connected clients by metadata filter',
    { filter: z.record(z.any()).describe('Key-value pairs to match against client meta') },
    async ({ filter }) => {
      const clients = server.findClients(filter)
      return { content: [{ type: 'text', text: JSON.stringify(clients, null, 2) }] }
    }
  )

  mcp.tool(
    'send_command',
    'Send a single action command to a specific client',
    {
      clientId: z.string().describe('Target client ID'),
      action: z.object({
        action: z.enum(['highlight', 'scroll', 'click', 'fill', 'show_message', 'ghost_cursor']),
        target: z.string(),
        value: z.string().optional(),
        text: z.string().optional(),
        options: z.record(z.any()).optional(),
      }).describe('Action to execute'),
    },
    async ({ clientId, action }) => {
      const actionId = server.sendCommand(clientId, action as Action)
      return { content: [{ type: 'text', text: JSON.stringify({ actionId, sent: true }) }] }
    }
  )

  mcp.tool(
    'send_message',
    'Send a text message to a specific client',
    {
      clientId: z.string().describe('Target client ID'),
      text: z.string().describe('Message text'),
    },
    async ({ clientId, text }) => {
      server.sendMessage(clientId, text)
      return { content: [{ type: 'text', text: JSON.stringify({ sent: true }) }] }
    }
  )

  mcp.tool(
    'send_scenario',
    'Send a step-by-step scenario to a specific client',
    {
      clientId: z.string().describe('Target client ID'),
      steps: z.array(z.object({
        action: z.enum(['highlight', 'scroll', 'click', 'fill', 'show_message', 'ghost_cursor']),
        target: z.string(),
        value: z.string().optional(),
        text: z.string().optional(),
        options: z.record(z.any()).optional(),
      })).describe('Ordered list of actions'),
    },
    async ({ clientId, steps }) => {
      server.sendScenario(clientId, steps as Action[])
      return { content: [{ type: 'text', text: JSON.stringify({ sent: true }) }] }
    }
  )

  return mcp
}
```

- [ ] **Step 4: Add convenience method to SiteAssistantServer**

Add to the bottom of `packages/server/src/server.ts`:

```typescript
import { createMCPServer } from './mcp.js'
import { ToolExecutor } from './tools.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'

// Add these methods to SiteAssistantServer class:

  async startMCP(options: { transport: 'stdio' } | { transport: 'sse'; port: number }): Promise<void> {
    const mcp = createMCPServer(this)
    if (options.transport === 'stdio') {
      const transport = new StdioServerTransport()
      await mcp.connect(transport)
    }
    // SSE transport requires HTTP server setup — handled in separate method
  }

  getToolDefinitions(format: 'anthropic' | 'openai' | 'raw'): any[] {
    const executor = new ToolExecutor(this)
    return executor.getDefinitions(format)
  }

  async executeTool(toolName: string, args: Record<string, any>): Promise<any> {
    const executor = new ToolExecutor(this)
    return executor.execute(toolName, args)
  }
```

- [ ] **Step 5: Update index.ts exports**

```typescript
export { SiteAssistantServer } from './server.js'
export type { SiteAssistantServerOptions } from './server.js'
export { ConnectionManager } from './connection-manager.js'
export { ToolExecutor } from './tools.js'
export { createMCPServer } from './mcp.js'
export * from 'site-assistant-shared'
```

- [ ] **Step 6: Run tests**

Run: `cd /Users/nik/WebstormProjects/site-assistant && pnpm --filter site-assistant-server test`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add packages/server/src/mcp.ts packages/server/src/__tests__/mcp.test.ts packages/server/src/server.ts packages/server/src/index.ts
git commit -m "feat(server): add MCP server integration"
```

---

### Task 6: Client — Connection & Reconnect

**Files:**
- Create: `packages/client/src/connection.ts`
- Create: `packages/client/src/__tests__/connection.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// packages/client/src/__tests__/connection.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { Connection } from '../connection.js'
import { WebSocketServer } from 'ws'

describe('Connection', () => {
  let wss: WebSocketServer
  const port = 9874

  beforeEach(async () => {
    wss = new WebSocketServer({ port })
    await new Promise((r) => setTimeout(r, 50))
  })

  afterEach(() => {
    wss.close()
  })

  it('connects and sends connect message', async () => {
    const serverReceived = new Promise<any>((resolve) => {
      wss.on('connection', (ws) => {
        ws.on('message', (data) => resolve(JSON.parse(data.toString())))
      })
    })

    const conn = new Connection({
      url: `ws://localhost:${port}`,
      clientId: 'c1',
      meta: { userId: '123' },
    })
    conn.connect()

    const msg = await serverReceived
    expect(msg).toEqual({ type: 'connect', clientId: 'c1', meta: { userId: '123' } })
    conn.disconnect()
  })

  it('receives messages from server', async () => {
    wss.on('connection', (ws) => {
      ws.on('message', () => {
        ws.send(JSON.stringify({ type: 'message', text: 'hello' }))
      })
    })

    const conn = new Connection({
      url: `ws://localhost:${port}`,
      clientId: 'c1',
      meta: {},
    })

    const onMessage = vi.fn()
    conn.onMessage(onMessage)
    conn.connect()

    await new Promise((r) => setTimeout(r, 100))
    expect(onMessage).toHaveBeenCalledWith({ type: 'message', text: 'hello' })
    conn.disconnect()
  })

  it('sends messages', async () => {
    const serverReceived: any[] = []
    wss.on('connection', (ws) => {
      ws.on('message', (data) => serverReceived.push(JSON.parse(data.toString())))
    })

    const conn = new Connection({
      url: `ws://localhost:${port}`,
      clientId: 'c1',
      meta: {},
    })
    conn.connect()
    await new Promise((r) => setTimeout(r, 50))

    conn.send({ type: 'event', event: 'test', payload: { x: 1 } })
    await new Promise((r) => setTimeout(r, 50))

    // First message is connect, second is event
    expect(serverReceived[1]).toEqual({ type: 'event', event: 'test', payload: { x: 1 } })
    conn.disconnect()
  })

  it('emits disconnect event', async () => {
    const conn = new Connection({
      url: `ws://localhost:${port}`,
      clientId: 'c1',
      meta: {},
    })

    const onDisconnect = vi.fn()
    conn.onDisconnect(onDisconnect)
    conn.connect()
    await new Promise((r) => setTimeout(r, 50))

    wss.clients.forEach((ws) => ws.close())
    await new Promise((r) => setTimeout(r, 50))

    expect(onDisconnect).toHaveBeenCalled()
    conn.disconnect()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/nik/WebstormProjects/site-assistant && pnpm --filter site-assistant-client test`
Expected: FAIL

- [ ] **Step 3: Implement Connection**

```typescript
// packages/client/src/connection.ts
import type { ClientMessage, ServerMessage } from 'site-assistant-shared'

export interface ConnectionOptions {
  url: string
  clientId: string
  meta: Record<string, any>
  maxReconnectDelay?: number
}

export class Connection {
  private ws: WebSocket | null = null
  private options: ConnectionOptions
  private messageHandlers: Array<(msg: ServerMessage) => void> = []
  private disconnectHandlers: Array<() => void> = []
  private reconnectHandlers: Array<() => void> = []
  private shouldReconnect = false
  private reconnectDelay = 1000
  private maxReconnectDelay: number
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private isFirstConnect = true

  constructor(options: ConnectionOptions) {
    this.options = options
    this.maxReconnectDelay = options.maxReconnectDelay ?? 30000
  }

  connect(): void {
    this.shouldReconnect = true
    this.doConnect()
  }

  disconnect(): void {
    this.shouldReconnect = false
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  send(msg: ClientMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg))
    }
  }

  onMessage(handler: (msg: ServerMessage) => void): void {
    this.messageHandlers.push(handler)
  }

  onDisconnect(handler: () => void): void {
    this.disconnectHandlers.push(handler)
  }

  onReconnect(handler: () => void): void {
    this.reconnectHandlers.push(handler)
  }

  private doConnect(): void {
    this.ws = new WebSocket(this.options.url)

    this.ws.addEventListener('open', () => {
      this.reconnectDelay = 1000
      this.send({
        type: 'connect',
        clientId: this.options.clientId,
        meta: this.options.meta,
      })
      if (!this.isFirstConnect) {
        this.reconnectHandlers.forEach((h) => h())
      }
      this.isFirstConnect = false
    })

    this.ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data as string) as ServerMessage
      this.messageHandlers.forEach((h) => h(msg))
    })

    this.ws.addEventListener('close', () => {
      this.ws = null
      this.disconnectHandlers.forEach((h) => h())
      if (this.shouldReconnect) {
        this.scheduleReconnect()
      }
    })

    this.ws.addEventListener('error', () => {
      // Will trigger close
    })
  }

  private scheduleReconnect(): void {
    this.reconnectTimer = setTimeout(() => {
      this.doConnect()
    }, this.reconnectDelay)
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay)
  }
}
```

- [ ] **Step 4: Add ws dev dependency for tests**

Run: `cd /Users/nik/WebstormProjects/site-assistant && pnpm --filter site-assistant-client add -D ws @types/ws`

Note: The client uses browser's native WebSocket at runtime. `ws` is only for tests.

- [ ] **Step 5: Run tests**

Run: `cd /Users/nik/WebstormProjects/site-assistant && pnpm --filter site-assistant-client test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/client/src/connection.ts packages/client/src/__tests__/connection.test.ts packages/client/package.json
git commit -m "feat(client): add Connection with auto-reconnect"
```

---

### Task 7: Client — Element Resolver

**Files:**
- Create: `packages/client/src/element-resolver.ts`
- Create: `packages/client/src/__tests__/element-resolver.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// packages/client/src/__tests__/element-resolver.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { ElementResolver } from '../element-resolver.js'

// vitest with jsdom
describe('ElementResolver', () => {
  let resolver: ElementResolver

  beforeEach(() => {
    document.body.innerHTML = `
      <button data-ai="signup_button">Sign Up</button>
      <section data-ai="pricing">Pricing</section>
      <div id="custom-el">Custom</div>
    `
    resolver = new ElementResolver()
  })

  it('finds element by data-ai attribute', () => {
    const el = resolver.resolve('signup_button')
    expect(el).toBe(document.querySelector('[data-ai="signup_button"]'))
  })

  it('finds element by registered selector', () => {
    resolver.register('custom', '#custom-el')
    const el = resolver.resolve('custom')
    expect(el).toBe(document.getElementById('custom-el'))
  })

  it('prefers data-ai over registered selector', () => {
    resolver.register('signup_button', '#custom-el')
    const el = resolver.resolve('signup_button')
    expect(el).toBe(document.querySelector('[data-ai="signup_button"]'))
  })

  it('returns null for unknown element', () => {
    const el = resolver.resolve('nonexistent')
    expect(el).toBeNull()
  })
})
```

- [ ] **Step 2: Add jsdom to vitest config**

Create `packages/client/vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
  },
})
```

Run: `cd /Users/nik/WebstormProjects/site-assistant && pnpm --filter site-assistant-client add -D jsdom`

- [ ] **Step 3: Run test to verify it fails**

Run: `cd /Users/nik/WebstormProjects/site-assistant && pnpm --filter site-assistant-client test`
Expected: FAIL — module not found

- [ ] **Step 4: Implement ElementResolver**

```typescript
// packages/client/src/element-resolver.ts
export class ElementResolver {
  private registry = new Map<string, string>()

  register(name: string, selector: string): void {
    this.registry.set(name, selector)
  }

  resolve(target: string): HTMLElement | null {
    // Priority 1: data-ai attribute
    const byAttr = document.querySelector<HTMLElement>(`[data-ai="${target}"]`)
    if (byAttr) return byAttr

    // Priority 2: registered selector
    const selector = this.registry.get(target)
    if (selector) {
      return document.querySelector<HTMLElement>(selector)
    }

    return null
  }
}
```

- [ ] **Step 5: Run tests**

Run: `cd /Users/nik/WebstormProjects/site-assistant && pnpm --filter site-assistant-client test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/client/src/element-resolver.ts packages/client/src/__tests__/element-resolver.test.ts packages/client/vitest.config.ts
git commit -m "feat(client): add ElementResolver (data-ai + registry)"
```

---

### Task 8: Client — Actions (highlight, scroll, click, fill, show_message)

**Files:**
- Create: `packages/client/src/actions/highlight.ts`
- Create: `packages/client/src/actions/scroll.ts`
- Create: `packages/client/src/actions/click.ts`
- Create: `packages/client/src/actions/fill.ts`
- Create: `packages/client/src/actions/show-message.ts`
- Create: `packages/client/src/actions/index.ts`
- Create: `packages/client/src/styles.ts`
- Create: `packages/client/src/__tests__/actions.test.ts`

- [ ] **Step 1: Create styles.ts**

```typescript
// packages/client/src/styles.ts
const STYLES = `
.sa-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 99998;
  pointer-events: none;
  transition: opacity 0.3s;
}

.sa-highlight {
  position: relative;
  z-index: 99999;
  box-shadow: 0 0 0 4px #4f96ff, 0 0 20px rgba(79, 150, 255, 0.5);
  border-radius: 4px;
  transition: box-shadow 0.3s;
}

.sa-tooltip {
  position: absolute;
  z-index: 100000;
  background: #1a1a2e;
  color: #fff;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
  max-width: 250px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  animation: sa-fade-in 0.2s ease;
}

.sa-step-indicator {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 100000;
  background: #1a1a2e;
  color: #fff;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

@keyframes sa-fade-in {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
`

let injected = false

export function injectStyles(): void {
  if (injected) return
  const style = document.createElement('style')
  style.textContent = STYLES
  document.head.appendChild(style)
  injected = true
}
```

- [ ] **Step 2: Implement actions**

```typescript
// packages/client/src/actions/highlight.ts
import { injectStyles } from '../styles.js'

export async function highlight(el: HTMLElement, options?: { duration?: number }): Promise<void> {
  injectStyles()
  const duration = options?.duration ?? 3000

  // Create overlay
  const overlay = document.createElement('div')
  overlay.className = 'sa-overlay'
  document.body.appendChild(overlay)

  // Highlight element
  el.classList.add('sa-highlight')

  return new Promise((resolve) => {
    setTimeout(() => {
      el.classList.remove('sa-highlight')
      overlay.remove()
      resolve()
    }, duration)
  })
}
```

```typescript
// packages/client/src/actions/scroll.ts
export async function scroll(el: HTMLElement): Promise<void> {
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  // Wait for scroll to complete (approximate)
  return new Promise((resolve) => setTimeout(resolve, 500))
}
```

```typescript
// packages/client/src/actions/click.ts
export async function click(el: HTMLElement): Promise<void> {
  el.click()
}
```

```typescript
// packages/client/src/actions/fill.ts
export async function fill(el: HTMLElement, value: string): Promise<void> {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    el.value = value
    el.dispatchEvent(new Event('input', { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
  } else {
    throw new Error(`Element [${el.tagName}] is not an input/textarea`)
  }
}
```

```typescript
// packages/client/src/actions/show-message.ts
import { injectStyles } from '../styles.js'

export async function showMessage(
  el: HTMLElement,
  text: string,
  options?: { position?: 'top' | 'bottom' | 'left' | 'right'; duration?: number }
): Promise<void> {
  injectStyles()
  const position = options?.position ?? 'top'
  const duration = options?.duration ?? 4000

  const rect = el.getBoundingClientRect()
  const tooltip = document.createElement('div')
  tooltip.className = 'sa-tooltip'
  tooltip.textContent = text

  document.body.appendChild(tooltip)

  // Position tooltip
  const tooltipRect = tooltip.getBoundingClientRect()
  switch (position) {
    case 'top':
      tooltip.style.left = `${rect.left + rect.width / 2 - tooltipRect.width / 2}px`
      tooltip.style.top = `${rect.top - tooltipRect.height - 8 + window.scrollY}px`
      break
    case 'bottom':
      tooltip.style.left = `${rect.left + rect.width / 2 - tooltipRect.width / 2}px`
      tooltip.style.top = `${rect.bottom + 8 + window.scrollY}px`
      break
    case 'left':
      tooltip.style.left = `${rect.left - tooltipRect.width - 8}px`
      tooltip.style.top = `${rect.top + rect.height / 2 - tooltipRect.height / 2 + window.scrollY}px`
      break
    case 'right':
      tooltip.style.left = `${rect.right + 8}px`
      tooltip.style.top = `${rect.top + rect.height / 2 - tooltipRect.height / 2 + window.scrollY}px`
      break
  }

  return new Promise((resolve) => {
    setTimeout(() => {
      tooltip.remove()
      resolve()
    }, duration)
  })
}
```

```typescript
// packages/client/src/actions/index.ts
export { highlight } from './highlight.js'
export { scroll } from './scroll.js'
export { click } from './click.js'
export { fill } from './fill.js'
export { showMessage } from './show-message.js'
```

- [ ] **Step 3: Write tests**

```typescript
// packages/client/src/__tests__/actions.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { highlight } from '../actions/highlight.js'
import { scroll } from '../actions/scroll.js'
import { click } from '../actions/click.js'
import { fill } from '../actions/fill.js'
import { showMessage } from '../actions/show-message.js'

describe('Actions', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <button data-ai="btn">Click</button>
      <input data-ai="email" type="text" />
      <section data-ai="section" style="height: 200px;">Content</section>
    `
  })

  describe('highlight', () => {
    it('adds overlay and highlight class, removes after duration', async () => {
      const el = document.querySelector<HTMLElement>('[data-ai="btn"]')!
      const promise = highlight(el, { duration: 100 })

      expect(document.querySelector('.sa-overlay')).not.toBeNull()
      expect(el.classList.contains('sa-highlight')).toBe(true)

      await promise
      expect(document.querySelector('.sa-overlay')).toBeNull()
      expect(el.classList.contains('sa-highlight')).toBe(false)
    })
  })

  describe('scroll', () => {
    it('calls scrollIntoView', async () => {
      const el = document.querySelector<HTMLElement>('[data-ai="section"]')!
      el.scrollIntoView = vi.fn()
      await scroll(el)
      expect(el.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' })
    })
  })

  describe('click', () => {
    it('triggers click on element', async () => {
      const el = document.querySelector<HTMLElement>('[data-ai="btn"]')!
      const onClick = vi.fn()
      el.addEventListener('click', onClick)
      await click(el)
      expect(onClick).toHaveBeenCalled()
    })
  })

  describe('fill', () => {
    it('sets value and dispatches events', async () => {
      const el = document.querySelector<HTMLInputElement>('[data-ai="email"]')!
      const onInput = vi.fn()
      el.addEventListener('input', onInput)

      await fill(el, 'test@example.com')
      expect(el.value).toBe('test@example.com')
      expect(onInput).toHaveBeenCalled()
    })

    it('throws for non-input elements', async () => {
      const el = document.querySelector<HTMLElement>('[data-ai="btn"]')!
      await expect(fill(el, 'x')).rejects.toThrow()
    })
  })

  describe('showMessage', () => {
    it('creates and removes tooltip', async () => {
      const el = document.querySelector<HTMLElement>('[data-ai="btn"]')!
      const promise = showMessage(el, 'Hello!', { duration: 100 })
      expect(document.querySelector('.sa-tooltip')).not.toBeNull()
      await promise
      expect(document.querySelector('.sa-tooltip')).toBeNull()
    })
  })
})
```

- [ ] **Step 4: Run tests**

Run: `cd /Users/nik/WebstormProjects/site-assistant && pnpm --filter site-assistant-client test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/actions/ packages/client/src/styles.ts packages/client/src/__tests__/actions.test.ts
git commit -m "feat(client): add highlight, scroll, click, fill, show_message actions"
```

---

### Task 9: Client — Ghost Cursor Action

**Files:**
- Create: `packages/client/src/actions/ghost-cursor.ts`
- Create: `packages/client/src/__tests__/ghost-cursor.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// packages/client/src/__tests__/ghost-cursor.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ghostCursor } from '../actions/ghost-cursor.js'

describe('ghostCursor', () => {
  beforeEach(() => {
    document.body.innerHTML = '<button data-ai="btn" style="position:absolute;top:100px;left:100px;width:50px;height:30px;">Click</button>'
  })

  it('creates cursor element and removes after animation', async () => {
    const el = document.querySelector<HTMLElement>('[data-ai="btn"]')!
    // Mock getBoundingClientRect
    el.getBoundingClientRect = () => ({ top: 100, left: 100, width: 50, height: 30, bottom: 130, right: 150, x: 100, y: 100, toJSON: () => {} })

    const promise = ghostCursor(el, { click: true })
    const cursor = document.querySelector('.sa-ghost-cursor')
    expect(cursor).not.toBeNull()

    await promise
    expect(document.querySelector('.sa-ghost-cursor')).toBeNull()
  })
})
```

- [ ] **Step 2: Implement ghost cursor**

```typescript
// packages/client/src/actions/ghost-cursor.ts
import { injectStyles } from '../styles.js'

const CURSOR_SVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M5 3L19 12L12 13L9 20L5 3Z" fill="#4f96ff" stroke="#fff" stroke-width="1.5"/>
</svg>`

export async function ghostCursor(el: HTMLElement, options?: { click?: boolean }): Promise<void> {
  injectStyles()

  const cursor = document.createElement('div')
  cursor.className = 'sa-ghost-cursor'
  cursor.innerHTML = CURSOR_SVG
  cursor.style.cssText = `
    position: fixed;
    z-index: 100001;
    pointer-events: none;
    top: 50%;
    left: 50%;
    transition: top 0.8s cubic-bezier(0.22, 1, 0.36, 1), left 0.8s cubic-bezier(0.22, 1, 0.36, 1);
  `
  document.body.appendChild(cursor)

  // Animate to target
  const rect = el.getBoundingClientRect()
  const targetX = rect.left + rect.width / 2
  const targetY = rect.top + rect.height / 2

  // Trigger reflow then set target
  cursor.getBoundingClientRect()
  cursor.style.top = `${targetY}px`
  cursor.style.left = `${targetX}px`

  await new Promise((r) => setTimeout(r, 900))

  // Optional click effect
  if (options?.click) {
    cursor.style.transform = 'scale(0.8)'
    cursor.style.transition = 'transform 0.1s'
    await new Promise((r) => setTimeout(r, 100))
    cursor.style.transform = 'scale(1)'
    await new Promise((r) => setTimeout(r, 100))
    el.click()
  }

  // Remove cursor
  cursor.style.opacity = '0'
  cursor.style.transition = 'opacity 0.3s'
  await new Promise((r) => setTimeout(r, 300))
  cursor.remove()
}
```

- [ ] **Step 3: Update actions/index.ts**

```typescript
// packages/client/src/actions/index.ts
export { highlight } from './highlight.js'
export { scroll } from './scroll.js'
export { click } from './click.js'
export { fill } from './fill.js'
export { showMessage } from './show-message.js'
export { ghostCursor } from './ghost-cursor.js'
```

- [ ] **Step 4: Run tests**

Run: `cd /Users/nik/WebstormProjects/site-assistant && pnpm --filter site-assistant-client test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/actions/ghost-cursor.ts packages/client/src/__tests__/ghost-cursor.test.ts packages/client/src/actions/index.ts
git commit -m "feat(client): add ghost cursor action"
```

---

### Task 10: Client — Command Executor & Scenario Runner

**Files:**
- Create: `packages/client/src/executor.ts`
- Create: `packages/client/src/__tests__/executor.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// packages/client/src/__tests__/executor.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Executor } from '../executor.js'
import { ElementResolver } from '../element-resolver.js'

describe('Executor', () => {
  let executor: Executor
  let resolver: ElementResolver

  beforeEach(() => {
    document.body.innerHTML = `
      <button data-ai="btn">Click</button>
      <input data-ai="email" type="text" />
      <section data-ai="section">Content</section>
    `
    resolver = new ElementResolver()
    executor = new Executor(resolver)
  })

  it('executes a highlight command', async () => {
    const result = await executor.execute({ action: 'highlight', target: 'btn', options: { duration: 50 } })
    expect(result.success).toBe(true)
  })

  it('executes a click command', async () => {
    const onClick = vi.fn()
    document.querySelector('[data-ai="btn"]')!.addEventListener('click', onClick)

    const result = await executor.execute({ action: 'click', target: 'btn' })
    expect(result.success).toBe(true)
    expect(onClick).toHaveBeenCalled()
  })

  it('executes a fill command', async () => {
    const result = await executor.execute({ action: 'fill', target: 'email', value: 'hi@test.com' })
    expect(result.success).toBe(true)
    expect((document.querySelector('[data-ai="email"]') as HTMLInputElement).value).toBe('hi@test.com')
  })

  it('fails for unknown target', async () => {
    const result = await executor.execute({ action: 'click', target: 'nonexistent' })
    expect(result.success).toBe(false)
    expect(result.error).toContain('not found')
  })

  it('runs a scenario sequentially', async () => {
    const order: string[] = []
    const origExecute = executor.execute.bind(executor)
    vi.spyOn(executor, 'execute').mockImplementation(async (action) => {
      order.push(action.action)
      return { success: true }
    })

    const onStep = vi.fn()
    await executor.runScenario(
      [
        { action: 'scroll', target: 'section' },
        { action: 'highlight', target: 'btn', options: { duration: 50 } },
        { action: 'click', target: 'btn' },
      ],
      onStep
    )

    expect(order).toEqual(['scroll', 'highlight', 'click'])
    expect(onStep).toHaveBeenCalledTimes(3)
  })

  it('stops scenario on failure', async () => {
    vi.spyOn(executor, 'execute').mockImplementation(async (action) => {
      if (action.target === 'nonexistent') return { success: false, error: 'not found' }
      return { success: true }
    })

    const onStep = vi.fn()
    const result = await executor.runScenario(
      [
        { action: 'scroll', target: 'section' },
        { action: 'click', target: 'nonexistent' },
        { action: 'click', target: 'btn' },
      ],
      onStep
    )

    expect(result.success).toBe(false)
    expect(result.stoppedAt).toBe(1)
    expect(onStep).toHaveBeenCalledTimes(2)
  })
})
```

- [ ] **Step 2: Implement Executor**

```typescript
// packages/client/src/executor.ts
import type { Action } from 'site-assistant-shared'
import type { ElementResolver } from './element-resolver.js'
import { highlight } from './actions/highlight.js'
import { scroll } from './actions/scroll.js'
import { click } from './actions/click.js'
import { fill } from './actions/fill.js'
import { showMessage } from './actions/show-message.js'
import { ghostCursor } from './actions/ghost-cursor.js'

export interface ActionResult {
  success: boolean
  error?: string
}

export interface ScenarioResult {
  success: boolean
  stoppedAt?: number
  error?: string
}

export class Executor {
  constructor(private resolver: ElementResolver) {}

  async execute(action: Action): Promise<ActionResult> {
    const el = this.resolver.resolve(action.target)
    if (!el) {
      return { success: false, error: `Element "${action.target}" not found` }
    }

    try {
      switch (action.action) {
        case 'highlight':
          await highlight(el, action.options)
          break
        case 'scroll':
          await scroll(el)
          break
        case 'click':
          await click(el)
          break
        case 'fill':
          await fill(el, action.value)
          break
        case 'show_message':
          await showMessage(el, action.text, action.options)
          break
        case 'ghost_cursor':
          await ghostCursor(el, action.options)
          break
      }
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  async runScenario(
    steps: Action[],
    onStep?: (index: number, total: number, result: ActionResult) => void
  ): Promise<ScenarioResult> {
    for (let i = 0; i < steps.length; i++) {
      const result = await this.execute(steps[i])
      onStep?.(i, steps.length, result)
      if (!result.success) {
        return { success: false, stoppedAt: i, error: result.error }
      }
    }
    return { success: true }
  }
}
```

- [ ] **Step 3: Run tests**

Run: `cd /Users/nik/WebstormProjects/site-assistant && pnpm --filter site-assistant-client test`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add packages/client/src/executor.ts packages/client/src/__tests__/executor.test.ts
git commit -m "feat(client): add Executor and scenario runner"
```

---

### Task 11: Client — SiteAssistant Main Class

**Files:**
- Create: `packages/client/src/site-assistant.ts`
- Create: `packages/client/src/index.ts`
- Create: `packages/client/src/__tests__/site-assistant.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// packages/client/src/__tests__/site-assistant.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { SiteAssistant } from '../site-assistant.js'
import { WebSocketServer } from 'ws'

describe('SiteAssistant', () => {
  let wss: WebSocketServer
  const port = 9875

  beforeEach(async () => {
    document.body.innerHTML = `
      <button data-ai="btn">Click</button>
      <input data-ai="email" type="text" />
    `
    wss = new WebSocketServer({ port })
    await new Promise((r) => setTimeout(r, 50))
  })

  afterEach(() => {
    wss.close()
  })

  it('connects and registers elements', async () => {
    const serverReceived = new Promise<any>((resolve) => {
      wss.on('connection', (ws) => {
        ws.on('message', (data) => resolve(JSON.parse(data.toString())))
      })
    })

    const assistant = new SiteAssistant({
      url: `ws://localhost:${port}`,
      meta: { userId: '123' },
    })
    assistant.connect()

    const msg = await serverReceived
    expect(msg.type).toBe('connect')
    expect(msg.meta).toEqual({ userId: '123' })
    expect(msg.clientId).toBeDefined()
    assistant.disconnect()
  })

  it('executes command from server', async () => {
    wss.on('connection', (ws) => {
      ws.on('message', () => {
        // After connect, send a command
        ws.send(JSON.stringify({
          type: 'command',
          actionId: 'a1',
          action: { action: 'click', target: 'btn' },
        }))
      })
    })

    const onClick = vi.fn()
    document.querySelector('[data-ai="btn"]')!.addEventListener('click', onClick)

    const assistant = new SiteAssistant({ url: `ws://localhost:${port}`, meta: {} })
    assistant.connect()

    await new Promise((r) => setTimeout(r, 200))
    expect(onClick).toHaveBeenCalled()
    assistant.disconnect()
  })

  it('sends action_result back to server', async () => {
    const results: any[] = []

    wss.on('connection', (ws) => {
      ws.on('message', (data) => {
        const msg = JSON.parse(data.toString())
        if (msg.type === 'connect') {
          ws.send(JSON.stringify({
            type: 'command',
            actionId: 'a1',
            action: { action: 'click', target: 'btn' },
          }))
        } else {
          results.push(msg)
        }
      })
    })

    const assistant = new SiteAssistant({ url: `ws://localhost:${port}`, meta: {} })
    assistant.connect()

    await new Promise((r) => setTimeout(r, 200))
    expect(results).toContainEqual({ type: 'action_result', actionId: 'a1', success: true })
    assistant.disconnect()
  })

  it('emits events to server', async () => {
    const received: any[] = []
    wss.on('connection', (ws) => {
      ws.on('message', (data) => received.push(JSON.parse(data.toString())))
    })

    const assistant = new SiteAssistant({ url: `ws://localhost:${port}`, meta: {} })
    assistant.connect()
    await new Promise((r) => setTimeout(r, 100))

    assistant.emit('page_changed', { url: '/new' })
    await new Promise((r) => setTimeout(r, 50))

    expect(received).toContainEqual({ type: 'event', event: 'page_changed', payload: { url: '/new' } })
    assistant.disconnect()
  })

  it('emits message event to listeners', async () => {
    wss.on('connection', (ws) => {
      ws.on('message', () => {
        ws.send(JSON.stringify({ type: 'message', text: 'Hello!' }))
      })
    })

    const assistant = new SiteAssistant({ url: `ws://localhost:${port}`, meta: {} })
    const onMessage = vi.fn()
    assistant.on('message', onMessage)
    assistant.connect()

    await new Promise((r) => setTimeout(r, 100))
    expect(onMessage).toHaveBeenCalledWith('Hello!')
    assistant.disconnect()
  })
})
```

- [ ] **Step 2: Implement SiteAssistant**

```typescript
// packages/client/src/site-assistant.ts
import { Connection } from './connection.js'
import { ElementResolver } from './element-resolver.js'
import { Executor } from './executor.js'
import { injectStyles } from './styles.js'
import type { ServerMessage, Action } from 'site-assistant-shared'

export interface SiteAssistantOptions {
  url: string
  meta: Record<string, any>
  clientId?: string
}

type EventHandler = (...args: any[]) => void

export class SiteAssistant {
  private connection: Connection
  private resolver: ElementResolver
  private executor: Executor
  private handlers = new Map<string, EventHandler[]>()
  private clientId: string

  constructor(options: SiteAssistantOptions) {
    this.clientId = options.clientId ?? crypto.randomUUID()
    this.resolver = new ElementResolver()
    this.executor = new Executor(this.resolver)

    this.connection = new Connection({
      url: options.url,
      clientId: this.clientId,
      meta: options.meta,
    })

    this.connection.onMessage((msg) => this.handleMessage(msg))
    this.connection.onDisconnect(() => this.fire('disconnect'))
    this.connection.onReconnect(() => this.fire('reconnect'))
  }

  connect(): void {
    injectStyles()
    this.connection.connect()
  }

  disconnect(): void {
    this.connection.disconnect()
  }

  register(name: string, selector: string): void {
    this.resolver.register(name, selector)
  }

  emit(event: string, payload?: any): void {
    this.connection.send({ type: 'event', event, payload })
  }

  on(event: string, handler: EventHandler): void {
    const list = this.handlers.get(event) ?? []
    list.push(handler)
    this.handlers.set(event, list)
  }

  off(event: string, handler: EventHandler): void {
    const list = this.handlers.get(event) ?? []
    this.handlers.set(event, list.filter((h) => h !== handler))
  }

  private fire(event: string, ...args: any[]): void {
    const list = this.handlers.get(event) ?? []
    list.forEach((h) => h(...args))
  }

  private async handleMessage(msg: ServerMessage): Promise<void> {
    switch (msg.type) {
      case 'command': {
        const result = await this.executor.execute(msg.action)
        this.connection.send({
          type: 'action_result',
          actionId: msg.actionId,
          success: result.success,
          error: result.error,
        })
        break
      }
      case 'message': {
        this.fire('message', msg.text)
        break
      }
      case 'scenario': {
        this.fire('scenario_start', msg.steps)
        this.showStepIndicator(0, msg.steps.length)
        await this.executor.runScenario(msg.steps, (index, total, result) => {
          this.showStepIndicator(index + 1, total)
          this.connection.send({
            type: 'action_result',
            actionId: `scenario-step-${index}`,
            success: result.success,
            error: result.error,
          })
        })
        this.removeStepIndicator()
        this.fire('scenario_end')
        break
      }
    }
  }

  private stepIndicatorEl: HTMLElement | null = null

  private showStepIndicator(current: number, total: number): void {
    if (!this.stepIndicatorEl) {
      this.stepIndicatorEl = document.createElement('div')
      this.stepIndicatorEl.className = 'sa-step-indicator'
      document.body.appendChild(this.stepIndicatorEl)
    }
    this.stepIndicatorEl.textContent = `Step ${current + 1}/${total}`
  }

  private removeStepIndicator(): void {
    this.stepIndicatorEl?.remove()
    this.stepIndicatorEl = null
  }
}
```

- [ ] **Step 3: Create packages/client/src/index.ts**

```typescript
export { SiteAssistant } from './site-assistant.js'
export type { SiteAssistantOptions } from './site-assistant.js'
export { ElementResolver } from './element-resolver.js'
export { Executor } from './executor.js'
export * from 'site-assistant-shared'
```

- [ ] **Step 4: Run tests**

Run: `cd /Users/nik/WebstormProjects/site-assistant && pnpm --filter site-assistant-client test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/site-assistant.ts packages/client/src/index.ts packages/client/src/__tests__/site-assistant.test.ts
git commit -m "feat(client): add SiteAssistant main class"
```

---

### Task 12: Build Configuration & UMD Bundle

**Files:**
- Create: `packages/client/tsup.config.ts`
- Create: `packages/server/tsup.config.ts`
- Modify: `packages/client/package.json`

- [ ] **Step 1: Create client tsup config**

```typescript
// packages/client/tsup.config.ts
import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
  },
  {
    entry: ['src/index.ts'],
    format: ['iife'],
    globalName: 'SiteAssistantSDK',
    outExtension: () => ({ js: '.umd.js' }),
    sourcemap: true,
  },
])
```

- [ ] **Step 2: Create server tsup config**

```typescript
// packages/server/tsup.config.ts
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
})
```

- [ ] **Step 3: Update package.json scripts**

Update `packages/client/package.json` build script:
```json
"build": "tsup"
```

Update `packages/server/package.json` build script:
```json
"build": "tsup"
```

- [ ] **Step 4: Build both packages**

Run: `cd /Users/nik/WebstormProjects/site-assistant && pnpm build`
Expected: Successful build with dist/ folders in both packages

- [ ] **Step 5: Verify UMD bundle exists**

Run: `ls packages/client/dist/index.umd.js`
Expected: File exists

- [ ] **Step 6: Commit**

```bash
git add packages/client/tsup.config.ts packages/server/tsup.config.ts packages/client/package.json packages/server/package.json
git commit -m "chore: add tsup build configs with ESM/CJS/UMD outputs"
```

---

### Task 13: Demo

**Files:**
- Create: `demo/server.ts`
- Create: `demo/index.html`
- Create: `demo/package.json`

- [ ] **Step 1: Create demo/package.json**

```json
{
  "name": "site-assistant-demo",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "tsx server.ts"
  },
  "dependencies": {
    "site-assistant-server": "workspace:*",
    "tsx": "^4.0.0"
  }
}
```

- [ ] **Step 2: Create demo/server.ts**

```typescript
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
```

- [ ] **Step 3: Create demo/index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Site Assistant Demo</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; line-height: 1.6; color: #333; }
    header { background: #1a1a2e; color: #fff; padding: 20px 40px; display: flex; justify-content: space-between; align-items: center; }
    header h1 { font-size: 1.5rem; }
    nav a { color: #a8b2d1; margin-left: 20px; text-decoration: none; }
    .hero { padding: 80px 40px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; }
    .hero h2 { font-size: 2.5rem; margin-bottom: 20px; }
    .hero p { font-size: 1.2rem; max-width: 600px; margin: 0 auto 30px; }
    .btn { display: inline-block; padding: 12px 32px; border-radius: 6px; font-size: 1rem; cursor: pointer; border: none; }
    .btn-primary { background: #4f96ff; color: #fff; }
    .features { padding: 60px 40px; max-width: 900px; margin: 0 auto; }
    .features h3 { font-size: 1.8rem; margin-bottom: 30px; text-align: center; }
    .feature-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
    .feature-card { background: #f7f8fc; padding: 24px; border-radius: 8px; text-align: center; }
    .pricing { padding: 60px 40px; background: #f0f2f5; text-align: center; }
    .pricing h3 { font-size: 1.8rem; margin-bottom: 30px; }
    .form-section { padding: 60px 40px; max-width: 500px; margin: 0 auto; }
    .form-section input { display: block; width: 100%; padding: 10px; margin-bottom: 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem; }
  </style>
</head>
<body>
  <header data-ai="header">
    <h1>Acme Corp</h1>
    <nav>
      <a href="#features">Features</a>
      <a href="#pricing">Pricing</a>
      <button class="btn btn-primary" data-ai="signup_button">Sign Up</button>
    </nav>
  </header>

  <section class="hero" data-ai="hero">
    <h2>Build something amazing</h2>
    <p>The best platform for your next project. Fast, reliable, and beautiful.</p>
    <button class="btn btn-primary" data-ai="cta_button">Get Started</button>
  </section>

  <section class="features" id="features" data-ai="features">
    <h3>Features</h3>
    <div class="feature-grid">
      <div class="feature-card" data-ai="feature_speed">
        <h4>Fast</h4>
        <p>Lightning fast performance</p>
      </div>
      <div class="feature-card" data-ai="feature_security">
        <h4>Secure</h4>
        <p>Enterprise-grade security</p>
      </div>
      <div class="feature-card" data-ai="feature_scale">
        <h4>Scalable</h4>
        <p>Grows with your business</p>
      </div>
    </div>
  </section>

  <section class="pricing" id="pricing" data-ai="pricing">
    <h3>Pricing</h3>
    <p>Simple, transparent pricing for everyone.</p>
  </section>

  <section class="form-section" data-ai="signup_form">
    <h3>Create Account</h3>
    <input type="text" placeholder="Name" data-ai="input_name" />
    <input type="email" placeholder="Email" data-ai="input_email" />
    <button class="btn btn-primary" data-ai="submit_button">Create Account</button>
  </section>

  <script src="/site-assistant.js"></script>
  <script>
    const assistant = new SiteAssistantSDK.SiteAssistant({
      url: `ws://${location.host}`,
      meta: { userId: 'demo-user', page: location.pathname }
    })
    assistant.on('message', (text) => {
      console.log('[AI Message]', text)
    })
    assistant.on('scenario_start', () => console.log('[Scenario started]'))
    assistant.on('scenario_end', () => console.log('[Scenario ended]'))
    assistant.connect()
  </script>
</body>
</html>
```

- [ ] **Step 4: Build client and run demo**

Run:
```bash
cd /Users/nik/WebstormProjects/site-assistant && pnpm build && pnpm --filter site-assistant-demo start
```
Expected: "Demo running at http://localhost:3100"

- [ ] **Step 5: Commit**

```bash
git add demo/
git commit -m "feat: add demo with example landing page"
```

---

### Task 14: README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write README**

```markdown
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
server.startMCP({ transport: 'stdio' })
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
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with usage examples"
```
