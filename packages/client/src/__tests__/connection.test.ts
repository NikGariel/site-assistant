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
