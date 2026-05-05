import { injectStyles } from '../styles.js'
import { getTheme } from '../theme.js'

export async function ghostCursor(el: HTMLElement, options?: { click?: boolean }): Promise<void> {
  injectStyles()
  const theme = getTheme()

  const cursor = document.createElement('div')
  cursor.className = 'sa-ghost-cursor'
  cursor.innerHTML = theme.cursorSvg
  cursor.style.cssText = `
    position: fixed;
    z-index: ${theme.zIndexBase + 3};
    pointer-events: none;
    width: ${theme.cursorSize}px;
    height: ${theme.cursorSize}px;
    top: 50%;
    left: 50%;
    transition: top ${theme.cursorDuration}ms ${theme.cursorEasing}, left ${theme.cursorDuration}ms ${theme.cursorEasing};
  `
  document.body.appendChild(cursor)

  // Animate to target
  const rect = el.getBoundingClientRect()
  const targetX = rect.left + rect.width / 2
  const targetY = rect.top + rect.height / 2

  // Trigger reflow then set target
  cursor.getBoundingClientRect()
  cursor.style.top = `${targetY}px`
  cursor.style.left = `${targetX}px`

  await new Promise((r) => setTimeout(r, theme.cursorDuration + 100))

  // Optional click effect
  if (options?.click) {
    cursor.style.transform = 'scale(0.8)'
    cursor.style.transition = 'transform 0.1s'
    await new Promise((r) => setTimeout(r, 100))
    cursor.style.transform = 'scale(1)'
    await new Promise((r) => setTimeout(r, 100))
    el.click()
  }

  // Remove cursor
  cursor.style.opacity = '0'
  cursor.style.transition = 'opacity 0.3s'
  await new Promise((r) => setTimeout(r, 300))
  cursor.remove()
}
