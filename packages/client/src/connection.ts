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
