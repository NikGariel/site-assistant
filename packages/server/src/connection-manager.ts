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
