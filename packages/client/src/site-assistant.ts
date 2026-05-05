import { Connection } from './connection.js'
import { ElementResolver } from './element-resolver.js'
import { Executor } from './executor.js'
import { injectStyles } from './styles.js'
import { setTheme, type SiteAssistantTheme } from './theme.js'
import { collectPageState } from './page-state.js'
import type { ServerMessage } from 'site-assistant-shared'

export interface SiteAssistantOptions {
  url: string
  meta: Record<string, any>
  clientId?: string
  /** Customize colors, cursor, tooltip, etc. */
  theme?: SiteAssistantTheme
  /** Auto-send page state on connect and DOM changes (default: true) */
  autoPageState?: boolean
  /** Debounce interval for DOM change detection in ms (default: 1000) */
  pageStateDebounce?: number
}

type EventHandler = (...args: any[]) => void

export class SiteAssistant {
  private connection: Connection
  private resolver: ElementResolver
  private executor: Executor
  private handlers = new Map<string, EventHandler[]>()
  private options: SiteAssistantOptions
  private observer: MutationObserver | null = null
  private stateDebounceTimer: ReturnType<typeof setTimeout> | null = null
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
    this.connection.onDisconnect(() => {
      this.stopObserver()
      this.fire('disconnect')
    })
    this.connection.onReconnect(() => {
      this.sendPageState()
      this.startObserver()
      this.fire('reconnect')
    })
  }

  connect(): void {
    if (this.options.theme) {
      setTheme(this.options.theme)
    }
    injectStyles()
    this.connection.connect()

    // Send initial page state after connection is established
    if (this.options.autoPageState !== false) {
      // Small delay to ensure connect message is sent first
      setTimeout(() => {
        this.sendPageState()
        this.startObserver()
      }, 100)
    }
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
      case 'request_state': {
        this.sendPageState((msg as any).requestId)
        break
      }
    }
  }

  /** Collect and send current page state to server */
  sendPageState(requestId?: string): void {
    const state = collectPageState(this.resolver)
    this.connection.send({
      type: 'page_state' as any,
      requestId,
      state,
    })
  }

  private startObserver(): void {
    if (this.options.autoPageState === false) return
    if (this.observer) return
    const debounce = this.options.pageStateDebounce ?? 1000

    this.observer = new MutationObserver(() => {
      if (this.stateDebounceTimer) clearTimeout(this.stateDebounceTimer)
      this.stateDebounceTimer = setTimeout(() => {
        this.sendPageState()
      }, debounce)
    })

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-ai', 'data-ai-label', 'disabled', 'style', 'class'],
    })
  }

  private stopObserver(): void {
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }
    if (this.stateDebounceTimer) {
      clearTimeout(this.stateDebounceTimer)
      this.stateDebounceTimer = null
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
    this.stopObserver()
    this.disconnect()
    this.handlers.clear()
    this.removeStepIndicator()
    // Remove injected styles
    const styleEl = document.querySelector('style[data-sa]')
    if (styleEl) styleEl.remove()
  }
}
