// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { ghostCursor } from '../actions/ghost-cursor.js'

describe('ghostCursor', () => {
  beforeEach(() => {
    document.body.innerHTML = '<button data-ai="btn" style="position:absolute;top:100px;left:100px;width:50px;height:30px;">Click</button>'
  })

  it('creates cursor element and removes after animation', async () => {
    const el = document.querySelector<HTMLElement>('[data-ai="btn"]')!
    el.getBoundingClientRect = () => ({ top: 100, left: 100, width: 50, height: 30, bottom: 130, right: 150, x: 100, y: 100, toJSON: () => {} })

    const promise = ghostCursor(el, { click: true })
    const cursor = document.querySelector('.sa-ghost-cursor')
    expect(cursor).not.toBeNull()

    await promise
    expect(document.querySelector('.sa-ghost-cursor')).toBeNull()
  })
})
