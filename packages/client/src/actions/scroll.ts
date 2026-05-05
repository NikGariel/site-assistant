export async function scroll(el: HTMLElement): Promise<void> {
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  return new Promise((resolve) => setTimeout(resolve, 500))
}
