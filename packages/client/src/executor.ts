import type { Action } from 'site-assistant-shared'
import type { ElementResolver } from './element-resolver.js'
import { highlight } from './actions/highlight.js'
import { scroll } from './actions/scroll.js'
import { click } from './actions/click.js'
import { fill } from './actions/fill.js'
import { showMessage } from './actions/show-message.js'
import { ghostCursor } from './actions/ghost-cursor.js'

export interface ActionResult {
  success: boolean
  error?: string
}

export interface ScenarioResult {
  success: boolean
  stoppedAt?: number
  error?: string
}

export class Executor {
  constructor(private resolver: ElementResolver) {}

  async execute(action: Action): Promise<ActionResult> {
    const el = this.resolver.resolve(action.target)
    if (!el) {
      return { success: false, error: `Element "${action.target}" not found` }
    }

    try {
      switch (action.action) {
        case 'highlight':
          await highlight(el, action.options)
          break
        case 'scroll':
          await scroll(el)
          break
        case 'click':
          await click(el)
          break
        case 'fill':
          await fill(el, action.value)
          break
        case 'show_message':
          await showMessage(el, action.text, action.options)
          break
        case 'ghost_cursor':
          await ghostCursor(el, action.options)
          break
      }
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  async runScenario(
    steps: Action[],
    onStep?: (index: number, total: number, result: ActionResult) => void
  ): Promise<ScenarioResult> {
    for (let i = 0; i < steps.length; i++) {
      const result = await this.execute(steps[i])
      onStep?.(i, steps.length, result)
      if (!result.success) {
        return { success: false, stoppedAt: i, error: result.error }
      }
    }
    return { success: true }
  }
}
