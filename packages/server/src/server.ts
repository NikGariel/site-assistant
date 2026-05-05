import { WebSocketServer, WebSocket } from 'ws'
import { EventEmitter } from 'events'
import { ConnectionManager, ClientEntry } from './connection-manager.js'
import type { Action, ClientMessage, ServerMessage } from 'site-assistant-shared'
import { randomUUID } from 'crypto'
import type { Server as HttpServer } from 'http'
import { ToolExecutor } from './tools.js'

export interface SiteAssistantServerOptions {
  port?: number
  server?: HttpServer
  maxCommandsPerSecond?: number
}

export class SiteAssistantServer extends EventEmitter {
  private wss: WebSocketServer
  private connections: ConnectionManager
  private pendingSockets = new Map<WebSocket, NodeJS.Timeout>()
  private aliveMap = new Map<WebSocket, boolean>()
  private pingTimer: NodeJS.Timeout | null = null
  private commandCounts = new Map<string, number>()
  private rateLimitTimer: NodeJS.Timeout | null = null
  private maxCommandsPerSecond: number

  constructor(options: SiteAssistantServerOptions) {
    super()
    this.connections = new ConnectionManager()
    this.maxCommandsPerSecond = options.maxCommandsPerSecond ?? 10

    if (options.server) {
      this.wss = new WebSocketServer({ server: options.server })
    } else {
      this.wss = new WebSocketServer({ port: options.port ?? 3100 })
    }

    this.rateLimitTimer = setInterval(() => {
      this.commandCounts.clear()
    }, 1000)

    this.pingTimer = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (this.aliveMap.get(ws) === false) {
          ws.terminate()
          return
        }
        this.aliveMap.set(ws, false)
        ws.ping()
      })
    }, 30000)

    this.wss.on('connection', (ws) => {
      // Wait for connect message
      const timeout = setTimeout(() => ws.close(), 5000)
      this.pendingSockets.set(ws, timeout)

      this.aliveMap.set(ws, true)
      ws.on('pong', () => {
        this.aliveMap.set(ws, true)
      })

      ws.on('message', (raw) => {
        try {
          const data = JSON.parse(raw.toString())
          if (!data || typeof data !== 'object' || !data.type) return
          this.handleMessage(ws, data as ClientMessage)
        } catch {
          // Invalid JSON — ignore
        }
      })

      ws.on('close', () => {
        // Clean up pending
        const t = this.pendingSockets.get(ws)
        if (t) {
          clearTimeout(t)
          this.pendingSockets.delete(ws)
        }
        this.aliveMap.delete(ws)
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
        if (typeof msg.clientId !== 'string' || !msg.meta || typeof msg.meta !== 'object') return
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
        if (typeof msg.event !== 'string') return
        const client = this.findClientByWs(ws)
        if (client) {
          this.emit('event', { id: client.id, meta: client.meta }, msg.event, msg.payload)
        }
        break
      }
      case 'action_result': {
        if (typeof msg.actionId !== 'string' || typeof msg.success !== 'boolean') return
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

  private checkRateLimit(clientId: string): void {
    const count = this.commandCounts.get(clientId) ?? 0
    if (count >= this.maxCommandsPerSecond) {
      throw new Error(`Rate limit exceeded for client "${clientId}" (max ${this.maxCommandsPerSecond}/s)`)
    }
    this.commandCounts.set(clientId, count + 1)
  }

  sendCommand(clientId: string, action: Action): string {
    this.checkRateLimit(clientId)
    const client = this.connections.get(clientId)
    if (!client) throw new Error(`Client "${clientId}" not connected`)
    const actionId = randomUUID()
    const msg: ServerMessage = { type: 'command', actionId, action }
    client.ws.send(JSON.stringify(msg))
    return actionId
  }

  sendMessage(clientId: string, text: string): void {
    this.checkRateLimit(clientId)
    const client = this.connections.get(clientId)
    if (!client) throw new Error(`Client "${clientId}" not connected`)
    const msg: ServerMessage = { type: 'message', text }
    client.ws.send(JSON.stringify(msg))
  }

  sendScenario(clientId: string, steps: Action[]): void {
    this.checkRateLimit(clientId)
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

  getToolDefinitions(format: 'anthropic' | 'openai' | 'raw'): any[] {
    const executor = new ToolExecutor(this)
    return executor.getDefinitions(format)
  }

  async executeTool(toolName: string, args: Record<string, any>): Promise<any> {
    const executor = new ToolExecutor(this)
    return executor.execute(toolName, args)
  }

  close(): void {
    if (this.rateLimitTimer) clearInterval(this.rateLimitTimer)
    if (this.pingTimer) clearInterval(this.pingTimer)
    this.wss.close()
  }
}
