// @vitest-environment jsdom
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
