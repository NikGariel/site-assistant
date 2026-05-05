// === Actions ===

export interface HighlightAction {
  action: 'highlight'
  target: string
  options?: { duration?: number }
}

export interface ScrollAction {
  action: 'scroll'
  target: string
}

export interface ClickAction {
  action: 'click'
  target: string
}

export interface FillAction {
  action: 'fill'
  target: string
  value: string
}

export interface ShowMessageAction {
  action: 'show_message'
  target: string
  text: string
  options?: { position?: 'top' | 'bottom' | 'left' | 'right' }
}

export interface GhostCursorAction {
  action: 'ghost_cursor'
  target: string
  options?: { click?: boolean }
}

export type Action =
  | HighlightAction
  | ScrollAction
  | ClickAction
  | FillAction
  | ShowMessageAction
  | GhostCursorAction

// === Client → Server Messages ===

export interface ConnectMessage {
  type: 'connect'
  clientId: string
  meta: Record<string, any>
}

export interface ActionResultMessage {
  type: 'action_result'
  actionId: string
  success: boolean
  error?: string
}

export interface EventMessage {
  type: 'event'
  event: string
  payload?: any
}

// === Server → Client Messages ===

export interface CommandMessage {
  type: 'command'
  actionId: string
  action: Action
}

export interface TextMessage {
  type: 'message'
  text: string
}

export interface ScenarioMessage {
  type: 'scenario'
  steps: Action[]
}

export interface ErrorMessage {
  type: 'error'
  reason: string
}

export interface RequestStateMessage {
  type: 'request_state'
  requestId: string
}

export type ServerMessage = CommandMessage | TextMessage | ScenarioMessage | ErrorMessage | RequestStateMessage

// === Page State ===

export interface ElementInfo {
  /** HTML tag name */
  tag: string
  /** Input type (for input elements) */
  inputType?: string
  /** Truncated visible text content */
  text: string
  /** Human-readable label from data-ai-label */
  label?: string
  /** Whether element is visible in the viewport */
  visible: boolean
  /** Whether element is enabled (not disabled) */
  enabled: boolean
  /** Current value (for form elements) */
  value?: string
  /** Bounding rect */
  rect: { top: number; left: number; width: number; height: number }
}

export interface PageState {
  url: string
  title: string
  elements: Record<string, ElementInfo>
}

export interface PageStateMessage {
  type: 'page_state'
  requestId?: string
  state: PageState
}

// Update ClientMessage to include PageStateMessage
export type ClientMessage = ConnectMessage | ActionResultMessage | EventMessage | PageStateMessage
