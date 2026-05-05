// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { ElementResolver } from '../element-resolver.js'

describe('ElementResolver', () => {
  let resolver: ElementResolver

  beforeEach(() => {
    document.body.innerHTML = `
      <button data-ai="signup_button">Sign Up</button>
      <section data-ai="pricing">Pricing</section>
      <div id="custom-el">Custom</div>
    `
    resolver = new ElementResolver()
  })

  it('finds element by data-ai attribute', () => {
    const el = resolver.resolve('signup_button')
    expect(el).toBe(document.querySelector('[data-ai="signup_button"]'))
  })

  it('finds element by registered selector', () => {
    resolver.register('custom', '#custom-el')
    const el = resolver.resolve('custom')
    expect(el).toBe(document.getElementById('custom-el'))
  })

  it('prefers data-ai over registered selector', () => {
    resolver.register('signup_button', '#custom-el')
    const el = resolver.resolve('signup_button')
    expect(el).toBe(document.querySelector('[data-ai="signup_button"]'))
  })

  it('returns null for unknown element', () => {
    const el = resolver.resolve('nonexistent')
    expect(el).toBeNull()
  })
})
