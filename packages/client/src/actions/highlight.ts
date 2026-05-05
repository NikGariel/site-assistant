import { injectStyles } from '../styles.js'
import { getTheme } from '../theme.js'

export async function highlight(el: HTMLElement, options?: { duration?: number }): Promise<void> {
  injectStyles()
  const duration = options?.duration ?? 3000
  const theme = getTheme()

  const rect = el.getBoundingClientRect()
  const padding = 4

  // Create overlay with a cutout around the element using box-shadow
  const overlay = document.createElement('div')
  overlay.className = 'sa-overlay-cutout'
  overlay.style.cssText = `
    position: fixed;
    top: ${rect.top - padding}px;
    left: ${rect.left - padding}px;
    width: ${rect.width + padding * 2}px;
    height: ${rect.height + padding * 2}px;
    z-index: ${theme.zIndexBase};
    border-radius: ${theme.highlightBorderRadius}px;
    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.6),
                0 0 0 ${theme.highlightBorderWidth}px ${theme.primaryColor},
                0 0 ${theme.highlightGlowSpread}px ${hexToRgba(theme.primaryColor, 0.5)};
    pointer-events: none;
    transition: all 0.3s ease;
  `
  document.body.appendChild(overlay)

  return new Promise((resolve) => {
    setTimeout(() => {
      overlay.remove()
      resolve()
    }, duration)
  })
}

function hexToRgba(hex: string, alpha: number): string {
  if (hex.startsWith('rgb')) return hex
  const h = hex.replace('#', '')
  const fullHex = h.length === 3 ? h.split('').map(c => c + c).join('') : h
  const r = parseInt(fullHex.slice(0, 2), 16)
  const g = parseInt(fullHex.slice(2, 4), 16)
  const b = parseInt(fullHex.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
