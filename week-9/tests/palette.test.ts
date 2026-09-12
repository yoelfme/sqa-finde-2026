import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { TYPE_ORDER } from '~/lib/types'
import { contrastRatio, oklchToLinearSrgb, parseOklchTokens } from './oklch'

// Under jsdom `import.meta.url` is an http URL, so the stylesheet is read
// relative to the project root instead.
const css = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8')
const tokens = parseOklchTokens(css, 'type-')
const neutrals = parseOklchTokens(css, 'color-')

const ground = neutrals.get('color-ground')!
const groundRgb = oklchToLinearSrgb(...ground)

/**
 * The type palette is a design decision with a measurable contract, so it is
 * asserted rather than eyeballed: a hue nudged for looks that drops below 4.5:1
 * fails here instead of shipping.
 */
describe('type palette', () => {
  it('defines a hue for every chart type', () => {
    expect([...tokens.keys()].sort()).toEqual(TYPE_ORDER.map((name) => `type-${name}`).sort())
  })

  it.each(TYPE_ORDER)('%s clears 4.5:1 against the ground', (name) => {
    const swatch = oklchToLinearSrgb(...tokens.get(`type-${name}`)!)
    expect(contrastRatio(swatch, groundRgb)).toBeGreaterThanOrEqual(4.5)
  })

  it('holds the hues in one lightness band so they read as a single system', () => {
    // `dark` is deliberately darker; the rest stay within a narrow band.
    const lightness = TYPE_ORDER.filter((name) => name !== 'dark').map(
      (name) => tokens.get(`type-${name}`)![0],
    )
    expect(Math.max(...lightness) - Math.min(...lightness)).toBeLessThanOrEqual(0.05)
  })

  it('keeps every hue distinct', () => {
    const seen = new Set(TYPE_ORDER.map((name) => tokens.get(`type-${name}`)!.join(' ')))
    expect(seen.size).toBe(TYPE_ORDER.length)
  })
})

describe('text neutrals', () => {
  it.each(['color-ink', 'color-ink-soft', 'color-ink-faint'])(
    '%s is readable body text on the ground',
    (token) => {
      const colour = oklchToLinearSrgb(...neutrals.get(token)!)
      expect(contrastRatio(colour, groundRgb)).toBeGreaterThanOrEqual(4.5)
    },
  )
})
