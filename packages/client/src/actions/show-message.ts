import { injectStyles } from '../styles.js'

export async function showMessage(
  el: HTMLElement,
  text: string,
  options?: { position?: 'top' | 'bottom' | 'left' | 'right'; duration?: number }
): Promise<void> {
  injectStyles()
  const position = options?.position ?? 'top'
  const duration = options?.duration ?? 4000

  const rect = el.getBoundingClientRect()
  const tooltip = document.createElement('div')
  tooltip.className = 'sa-tooltip'
  tooltip.textContent = text

  document.body.appendChild(tooltip)

  const tooltipRect = tooltip.getBoundingClientRect()
  switch (position) {
    case 'top':
      tooltip.style.left = `${rect.left + rect.width / 2 - tooltipRect.width / 2}px`
      tooltip.style.top = `${rect.top - tooltipRect.height - 8 + window.scrollY}px`
      break
    case 'bottom':
      tooltip.style.left = `${rect.left + rect.width / 2 - tooltipRect.width / 2}px`
      tooltip.style.top = `${rect.bottom + 8 + window.scrollY}px`
      break
    case 'left':
      tooltip.style.left = `${rect.left - tooltipRect.width - 8}px`
      tooltip.style.top = `${rect.top + rect.height / 2 - tooltipRect.height / 2 + window.scrollY}px`
      break
    case 'right':
      tooltip.style.left = `${rect.right + 8}px`
      tooltip.style.top = `${rect.top + rect.height / 2 - tooltipRect.height / 2 + window.scrollY}px`
      break
  }

  return new Promise((resolve) => {
    setTimeout(() => {
      tooltip.remove()
      resolve()
    }, duration)
  })
}
