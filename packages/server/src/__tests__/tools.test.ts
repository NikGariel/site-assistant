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
