// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { highlight } from '../actions/highlight.js'
import { scroll } from '../actions/scroll.js'
import { click } from '../actions/click.js'
import { fill } from '../actions/fill.js'
import { showMessage } from '../actions/show-message.js'

describe('Actions', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <button data-ai="btn">Click</button>
      <input data-ai="email" type="text" />
      <section data-ai="section" style="height: 200px;">Content</section>
    `
  })

  describe('highlight', () => {
    it('adds cutout overlay and removes after duration', async () => {
      const el = document.querySelector<HTMLElement>('[data-ai="btn"]')!
      const promise = highlight(el, { duration: 100 })

      expect(document.querySelector('.sa-overlay-cutout')).not.toBeNull()

      await promise
      expect(document.querySelector('.sa-overlay-cutout')).toBeNull()
    })
  })

  describe('scroll', () => {
    it('calls scrollIntoView', async () => {
      const el = document.querySelector<HTMLElement>('[data-ai="section"]')!
      el.scrollIntoView = vi.fn()
      await scroll(el)
      expect(el.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' })
    })
  })

  describe('click', () => {
    it('triggers click on element', async () => {
      const el = document.querySelector<HTMLElement>('[data-ai="btn"]')!
      const onClick = vi.fn()
      el.addEventListener('click', onClick)
      await click(el)
      expect(onClick).toHaveBeenCalled()
    })
  })

  describe('fill', () => {
    it('sets value and dispatches events', async () => {
      const el = document.querySelector<HTMLInputElement>('[data-ai="email"]')!
      const onInput = vi.fn()
      el.addEventListener('input', onInput)

      await fill(el, 'test@example.com')
      expect(el.value).toBe('test@example.com')
      expect(onInput).toHaveBeenCalled()
    })

    it('throws for non-input elements', async () => {
      const el = document.querySelector<HTMLElement>('[data-ai="btn"]')!
      await expect(fill(el, 'x')).rejects.toThrow()
    })
  })

  describe('showMessage', () => {
    it('creates and removes tooltip', async () => {
      const el = document.querySelector<HTMLElement>('[data-ai="btn"]')!
      const promise = showMessage(el, 'Hello!', { duration: 100 })
      expect(document.querySelector('.sa-tooltip')).not.toBeNull()
      await promise
      expect(document.querySelector('.sa-tooltip')).toBeNull()
    })
  })
})
