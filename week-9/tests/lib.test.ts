import { describe, expect, it } from 'vitest'

import { artworkUrl, dexNumber, idFromUrl } from '~/lib/sprites'
import { displayName } from '~/lib/names'
import { normalizeFlavorText } from '~/lib/flavor'
import { isPokemonType, typeHue } from '~/lib/types'
import speciesPikachu from './msw/fixtures/species-pikachu.json'

describe('idFromUrl', () => {
  it('reads the id from a PokeAPI resource URL', () => {
    expect(idFromUrl('https://pokeapi.co/api/v2/pokemon/25/')).toBe(25)
    expect(idFromUrl('https://pokeapi.co/api/v2/pokemon/1025')).toBe(1025)
  })

  it('throws rather than yielding NaN when the URL carries no id', () => {
    expect(() => idFromUrl('https://pokeapi.co/api/v2/pokemon/')).toThrow(/resource id/)
  })
})

describe('dexNumber', () => {
  it('pads national dex numbers to four digits so columns align', () => {
    expect(dexNumber(1)).toBe('0001')
    expect(dexNumber(1025)).toBe('1025')
  })

  it('leaves alternate-form ids at full length', () => {
    expect(dexNumber(10034)).toBe('10034')
  })
})

describe('artworkUrl', () => {
  it('addresses artwork by id, with no detail request needed', () => {
    expect(artworkUrl(25)).toMatch(/official-artwork\/25\.png$/)
  })
})

describe('displayName', () => {
  it('titlecases each hyphenated part', () => {
    expect(displayName('pikachu')).toBe('Pikachu')
    expect(displayName('mr-mime')).toBe('Mr Mime')
    expect(displayName('charizard-mega-x')).toBe('Charizard Mega X')
  })
})

describe('normalizeFlavorText', () => {
  it('removes the game text-box line breaks and form feeds', () => {
    const raw = speciesPikachu.flavor_text_entries[0]!.flavor_text
    expect(raw).toMatch(/[\n\f]/)

    const clean = normalizeFlavorText(raw)
    expect(clean).not.toMatch(/[\n\r\f]/)
    expect(clean).not.toMatch(/\s{2,}/)
    expect(clean).toContain('When several of these Pokémon gather')
  })

  it('restores proper nouns the Game Boy games shouted', () => {
    expect(normalizeFlavorText('a POKéMON and a POKEMON')).toBe('a Pokémon and a Pokémon')
  })

  it('joins words split by a soft hyphen', () => {
    expect(normalizeFlavorText('elec­tricity')).toBe('electricity')
  })
})

describe('typeHue', () => {
  it('resolves a known type to its palette token', () => {
    expect(typeHue('water')).toBe('var(--type-water)')
  })

  it('falls back to ink for an unknown or absent type', () => {
    expect(typeHue('stellar')).toBe('var(--color-ink)')
    expect(typeHue(null)).toBe('var(--color-ink)')
    expect(typeHue(undefined)).toBe('var(--color-ink)')
  })

  it('recognises exactly the eighteen chart types', () => {
    expect(isPokemonType('ghost')).toBe(true)
    expect(isPokemonType('shadow')).toBe(false)
  })
})
