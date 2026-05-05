// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { SiteAssistant } from '../site-assistant.js'
import { WebSocketServer } from 'ws'

// Need WebSocket global for jsdom environment
import { WebSocket as WS } from 'ws'
// @ts-ignore
globalThis.WebSocket = WS

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
