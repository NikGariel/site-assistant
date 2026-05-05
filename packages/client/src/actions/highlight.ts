import { injectStyles } from '../styles.js'

export async function highlight(el: HTMLElement, options?: { duration?: number }): Promise<void> {
  injectStyles()
  const duration = options?.duration ?? 3000

  const overlay = document.createElement('div')
  overlay.className = 'sa-overlay'
  document.body.appendChild(overlay)

  el.classList.add('sa-highlight')

  return new Promise((resolve) => {
    setTimeout(() => {
      el.classList.remove('sa-highlight')
      overlay.remove()
      resolve()
    }, duration)
  })
}
