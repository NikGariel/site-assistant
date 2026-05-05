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

  getToolDefinitions(format: 'anthropic' | 'openai' | 'raw'): any[] {
    const executor = new ToolExecutor(this)
    return executor.getDefinitions(format)
  }

  async executeTool(toolName: string, args: Record<string, any>): Promise<any> {
    const executor = new ToolExecutor(this)
    return executor.execute(toolName, args)
  }

  close(): void {
    this.wss.close()
  }
}
