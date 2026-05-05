import { Connection } from './connection.js'
import { ElementResolver } from './element-resolver.js'
import { Executor } from './executor.js'
import { injectStyles } from './styles.js'
import { setTheme, type SiteAssistantTheme } from './theme.js'
import type { ServerMessage } from 'site-assistant-shared'

export interface SiteAssistantOptions {
  url: string
  meta: Record<string, any>
  clientId?: string
  /** Customize colors, cursor, tooltip, etc. */
  theme?: SiteAssistantTheme
}

type EventHandler = (...args: any[]) => void

export class SiteAssistant {
  private connection: Connection
  private resolver: ElementResolver
  private executor: Executor
  private handlers = new Map<string, EventHandler[]>()
  private options: SiteAssistantOptions
  readonly clientId: string

  constructor(options: SiteAssistantOptions) {
    this.options = options
    this.clientId =
      options.clientId ??
      (typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2))
    this.resolver = new ElementResolver()
    this.executor = new Executor(this.resolver)

    this.connection = new Connection({
      url: options.url,
      clientId: this.clientId,
      meta: options.meta,
    })

    this.connection.onMessage((msg) => this.handleMessage(msg))
    this.connection.onDisconnect(() => this.fire('disconnect'))
    this.connection.onReconnect(() => this.fire('reconnect'))
  }

  connect(): void {
    if (this.options.theme) {
      setTheme(this.options.theme)
    }
    injectStyles()
    this.connection.connect()
  }

  /** Update theme at runtime */
  setTheme(theme: SiteAssistantTheme): void {
    setTheme(theme)
  }

  disconnect(): void {
    this.connection.disconnect()
  }

  register(name: string, selector: string): void {
    this.resolver.register(name, selector)
  }

  emit(event: string, payload?: any): void {
    this.connection.send({ type: 'event', event, payload })
  }

  on(event: string, handler: EventHandler): void {
    const list = this.handlers.get(event) ?? []
    list.push(handler)
    this.handlers.set(event, list)
  }

  off(event: string, handler: EventHandler): void {
    const list = this.handlers.get(event) ?? []
    this.handlers.set(event, list.filter((h) => h !== handler))
  }

  private fire(event: string, ...args: any[]): void {
    const list = this.handlers.get(event) ?? []
    list.forEach((h) => h(...args))
  }

  private async handleMessage(msg: ServerMessage): Promise<void> {
    switch (msg.type) {
      case 'command': {
        const result = await this.executor.execute(msg.action)
        this.connection.send({
          type: 'action_result',
          actionId: msg.actionId,
          success: result.success,
          error: result.error,
        })
        break
      }
      case 'message': {
        this.fire('message', msg.text)
        break
      }
      case 'scenario': {
        this.fire('scenario_start', msg.steps)
        this.showStepIndicator(0, msg.steps.length)
        await this.executor.runScenario(msg.steps, (index, total, result) => {
          this.showStepIndicator(index + 1, total)
          this.connection.send({
            type: 'action_result',
            actionId: `scenario-step-${index}`,
            success: result.success,
            error: result.error,
          })
        })
        this.removeStepIndicator()
        this.fire('scenario_end')
        break
      }
      case 'error': {
        this.fire('error', (msg as any).reason)
        break
      }
    }
  }

  private stepIndicatorEl: HTMLElement | null = null

  private showStepIndicator(current: number, total: number): void {
    if (!this.stepIndicatorEl) {
      this.stepIndicatorEl = document.createElement('div')
      this.stepIndicatorEl.className = 'sa-step-indicator'
      document.body.appendChild(this.stepIndicatorEl)
    }
    this.stepIndicatorEl.textContent = `Step ${current + 1}/${total}`
  }

  private removeStepIndicator(): void {
    this.stepIndicatorEl?.remove()
    this.stepIndicatorEl = null
  }

  /** Full cleanup for SPA route changes */
  destroy(): void {
    this.disconnect()
    this.handlers.clear()
    this.removeStepIndicator()
    // Remove injected styles
    const styleEl = document.querySelector('style[data-sa]')
    if (styleEl) styleEl.remove()
  }
}
