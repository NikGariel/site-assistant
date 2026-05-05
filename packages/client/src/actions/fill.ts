export async function fill(el: HTMLElement, value: string): Promise<void> {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    el.value = value
    el.dispatchEvent(new Event('input', { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
  } else {
    throw new Error(`Element [${el.tagName}] is not an input/textarea`)
  }
}
