import { injectStyles } from '../styles.js'

const CURSOR_SVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M5 3L19 12L12 13L9 20L5 3Z" fill="#4f96ff" stroke="#fff" stroke-width="1.5"/>
</svg>`

export async function ghostCursor(el: HTMLElement, options?: { click?: boolean }): Promise<void> {
  injectStyles()

  const cursor = document.createElement('div')
  cursor.className = 'sa-ghost-cursor'
  cursor.innerHTML = CURSOR_SVG
  cursor.style.cssText = `
    position: fixed;
    z-index: 100001;
    pointer-events: none;
    top: 50%;
    left: 50%;
    transition: top 0.8s cubic-bezier(0.22, 1, 0.36, 1), left 0.8s cubic-bezier(0.22, 1, 0.36, 1);
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

  await new Promise((r) => setTimeout(r, 900))

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
