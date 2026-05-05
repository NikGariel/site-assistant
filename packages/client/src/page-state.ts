import type { PageState, ElementInfo } from 'site-assistant-shared'
import type { ElementResolver } from './element-resolver.js'

const MAX_TEXT_LENGTH = 120

function truncate(text: string): string {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (cleaned.length <= MAX_TEXT_LENGTH) return cleaned
  return cleaned.slice(0, MAX_TEXT_LENGTH) + '...'
}

function isVisible(el: HTMLElement): boolean {
  if (el.offsetParent === null && getComputedStyle(el).position !== 'fixed') return false
  const style = getComputedStyle(el)
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false
  const rect = el.getBoundingClientRect()
  if (rect.width === 0 && rect.height === 0) return false
  return true
}

function isInViewport(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect()
  return (
    rect.top < window.innerHeight &&
    rect.bottom > 0 &&
    rect.left < window.innerWidth &&
    rect.right > 0
  )
}

function getElementInfo(el: HTMLElement): ElementInfo {
  const rect = el.getBoundingClientRect()
  const info: ElementInfo = {
    tag: el.tagName.toLowerCase(),
    text: truncate(el.textContent || ''),
    visible: isVisible(el) && isInViewport(el),
    enabled: !(el as any).disabled,
    rect: {
      top: Math.round(rect.top),
      left: Math.round(rect.left),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    },
  }

  // Label from data-ai-label
  const label = el.getAttribute('data-ai-label')
  if (label) info.label = label

  // Input-specific
  if (el instanceof HTMLInputElement) {
    info.inputType = el.type
    info.value = el.value
  } else if (el instanceof HTMLTextAreaElement) {
    info.inputType = 'textarea'
    info.value = el.value
  } else if (el instanceof HTMLSelectElement) {
    info.inputType = 'select'
    info.value = el.value
  }

  return info
}

export function collectPageState(resolver: ElementResolver): PageState {
  const elements: Record<string, ElementInfo> = {}

  // Collect all data-ai elements
  document.querySelectorAll<HTMLElement>('[data-ai]').forEach((el) => {
    const name = el.getAttribute('data-ai')
    if (name) {
      elements[name] = getElementInfo(el)
    }
  })

  // Also include registered elements that aren't data-ai
  const registered = resolver.getRegistered()
  for (const [name, selector] of registered) {
    if (elements[name]) continue // data-ai takes priority
    const el = document.querySelector<HTMLElement>(selector)
    if (el) {
      elements[name] = getElementInfo(el)
    }
  }

  return {
    url: window.location.href,
    title: document.title,
    elements,
  }
}
