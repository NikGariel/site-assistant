export class ElementResolver {
  private registry = new Map<string, string>()

  register(name: string, selector: string): void {
    this.registry.set(name, selector)
  }

  resolve(target: string): HTMLElement | null {
    // Priority 1: data-ai attribute
    const byAttr = document.querySelector<HTMLElement>(`[data-ai="${target}"]`)
    if (byAttr) return byAttr

    // Priority 2: registered selector
    const selector = this.registry.get(target)
    if (selector) {
      return document.querySelector<HTMLElement>(selector)
    }

    return null
  }
}
