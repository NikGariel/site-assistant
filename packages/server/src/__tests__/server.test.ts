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
