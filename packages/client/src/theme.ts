export interface SiteAssistantTheme {
  /** Primary accent color (highlight border, cursor fill) */
  primaryColor?: string
  /** Overlay background (supports rgba) */
  overlayColor?: string
  /** Highlight border width in px */
  highlightBorderWidth?: number
  /** Highlight glow spread in px */
  highlightGlowSpread?: number
  /** Highlight border radius in px */
  highlightBorderRadius?: number
  /** Tooltip background color */
  tooltipBackground?: string
  /** Tooltip text color */
  tooltipColor?: string
  /** Tooltip font size */
  tooltipFontSize?: string
  /** Tooltip border radius in px */
  tooltipBorderRadius?: number
  /** Tooltip max width in px */
  tooltipMaxWidth?: number
  /** Tooltip padding */
  tooltipPadding?: string
  /** Step indicator background */
  stepIndicatorBackground?: string
  /** Step indicator text color */
  stepIndicatorColor?: string
  /** Step indicator position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' */
  stepIndicatorPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  /** Custom cursor SVG string (full <svg> tag) */
  cursorSvg?: string
  /** Cursor size in px */
  cursorSize?: number
  /** Cursor animation duration in ms */
  cursorDuration?: number
  /** Cursor easing function */
  cursorEasing?: string
  /** Z-index base (overlay = base, highlight = base+1, tooltip = base+2, cursor = base+3) */
  zIndexBase?: number
}

const DEFAULT_THEME: Required<SiteAssistantTheme> = {
  primaryColor: '#4f96ff',
  overlayColor: 'rgba(0, 0, 0, 0.6)',
  highlightBorderWidth: 4,
  highlightGlowSpread: 20,
  highlightBorderRadius: 4,
  tooltipBackground: '#1a1a2e',
  tooltipColor: '#ffffff',
  tooltipFontSize: '14px',
  tooltipBorderRadius: 6,
  tooltipMaxWidth: 250,
  tooltipPadding: '8px 12px',
  stepIndicatorBackground: '#1a1a2e',
  stepIndicatorColor: '#ffffff',
  stepIndicatorPosition: 'bottom-right',
  cursorSvg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 3L19 12L12 13L9 20L5 3Z" fill="var(--sa-primary)" stroke="#fff" stroke-width="1.5"/></svg>`,
  cursorSize: 20,
  cursorDuration: 800,
  cursorEasing: 'cubic-bezier(0.22, 1, 0.36, 1)',
  zIndexBase: 99998,
}

let currentTheme: Required<SiteAssistantTheme> = { ...DEFAULT_THEME }

export function setTheme(theme: SiteAssistantTheme): void {
  currentTheme = { ...DEFAULT_THEME, ...theme }
  // Update CSS variables on the root
  applyThemeVars()
  // Re-inject styles with new theme
  removeStyles()
  injectThemedStyles()
}

export function getTheme(): Required<SiteAssistantTheme> {
  return currentTheme
}

function hexToRgba(hex: string, alpha: number): string {
  // Handle both #fff and #ffffff, and rgb/rgba passthrough
  if (hex.startsWith('rgb')) return hex
  const h = hex.replace('#', '')
  const fullHex = h.length === 3 ? h.split('').map(c => c + c).join('') : h
  const r = parseInt(fullHex.slice(0, 2), 16)
  const g = parseInt(fullHex.slice(2, 4), 16)
  const b = parseInt(fullHex.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function applyThemeVars(): void {
  const root = document.documentElement
  root.style.setProperty('--sa-primary', currentTheme.primaryColor)
  root.style.setProperty('--sa-overlay', currentTheme.overlayColor)
  root.style.setProperty('--sa-highlight-border-width', `${currentTheme.highlightBorderWidth}px`)
  root.style.setProperty('--sa-highlight-glow-spread', `${currentTheme.highlightGlowSpread}px`)
  root.style.setProperty('--sa-highlight-border-radius', `${currentTheme.highlightBorderRadius}px`)
  root.style.setProperty('--sa-highlight-glow-color', hexToRgba(currentTheme.primaryColor, 0.5))
  root.style.setProperty('--sa-tooltip-bg', currentTheme.tooltipBackground)
  root.style.setProperty('--sa-tooltip-color', currentTheme.tooltipColor)
  root.style.setProperty('--sa-tooltip-font-size', currentTheme.tooltipFontSize)
  root.style.setProperty('--sa-tooltip-border-radius', `${currentTheme.tooltipBorderRadius}px`)
  root.style.setProperty('--sa-tooltip-max-width', `${currentTheme.tooltipMaxWidth}px`)
  root.style.setProperty('--sa-tooltip-padding', currentTheme.tooltipPadding)
  root.style.setProperty('--sa-step-bg', currentTheme.stepIndicatorBackground)
  root.style.setProperty('--sa-step-color', currentTheme.stepIndicatorColor)
  root.style.setProperty('--sa-z-base', `${currentTheme.zIndexBase}`)
}

function removeStyles(): void {
  const existing = document.querySelector('style[data-sa]')
  if (existing) existing.remove()
}

export function injectThemedStyles(): void {
  if (document.querySelector('style[data-sa]')) return
  applyThemeVars()

  const t = currentTheme
  const stepPos = getStepPosition(t.stepIndicatorPosition)

  const css = `
.sa-tooltip {
  position: absolute;
  z-index: calc(var(--sa-z-base) + 2);
  background: var(--sa-tooltip-bg);
  color: var(--sa-tooltip-color);
  padding: var(--sa-tooltip-padding);
  border-radius: var(--sa-tooltip-border-radius);
  font-size: var(--sa-tooltip-font-size);
  max-width: var(--sa-tooltip-max-width);
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  animation: sa-fade-in 0.2s ease;
}

.sa-step-indicator {
  position: fixed;
  ${stepPos}
  z-index: calc(var(--sa-z-base) + 2);
  background: var(--sa-step-bg);
  color: var(--sa-step-color);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

@keyframes sa-fade-in {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
`

  const style = document.createElement('style')
  style.setAttribute('data-sa', '')
  style.textContent = css
  document.head.appendChild(style)
}

function getStepPosition(pos: string): string {
  switch (pos) {
    case 'bottom-left': return 'bottom: 20px; left: 20px;'
    case 'top-right': return 'top: 20px; right: 20px;'
    case 'top-left': return 'top: 20px; left: 20px;'
    default: return 'bottom: 20px; right: 20px;'
  }
}
