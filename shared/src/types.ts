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

export type ClientMessage = ConnectMessage | ActionResultMessage | EventMessage

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

export type ServerMessage = CommandMessage | TextMessage | ScenarioMessage | ErrorMessage
