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
