export async function fill(el: HTMLElement, value: string): Promise<void> {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    // Use native setter to trigger React/Vue change detection
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      el instanceof HTMLInputElement ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype,
      'value'
    )?.set

    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(el, value)
    } else {
      el.value = value
    }

    // Dispatch events that frameworks listen for
    el.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }))
    el.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }))
    // Also dispatch InputEvent for modern frameworks
    el.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, data: value, inputType: 'insertText' }))
  } else if (el.isContentEditable) {
    el.textContent = value
    el.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }))
  } else {
    throw new Error(`Element [${el.tagName}] is not an input/textarea/contenteditable`)
  }
}
