import { describe, expect, it } from 'vitest'

import { filterByName } from '~/lib/search'

const dex = [
  { name: 'bulbasaur' },
  { name: 'charmander' },
  { name: 'charmeleon' },
  { name: 'charizard' },
  { name: 'chimchar' },
  { name: 'charjabug' },
  { name: 'mr-mime' },
]

describe('filterByName', () => {
  it('returns every entry when the query is empty', () => {
    expect(filterByName(dex, '')).toHaveLength(dex.length)
    expect(filterByName(dex, '   ')).toHaveLength(dex.length)
  })

  it('does not mutate or alias the source list', () => {
    const result = filterByName(dex, '')
    result.pop()
    expect(dex).toHaveLength(7)
  })

  it('matches on a partial name rather than requiring the whole one', () => {
    const names = filterByName(dex, 'char').map((entry) => entry.name)
    expect(names).toContain('charmander')
    expect(names).toContain('chimchar')
    expect(names).not.toContain('bulbasaur')
  })

  it('ranks an exact match, then prefixes, then anything containing the query', () => {
    const names = filterByName(dex, 'char').map((entry) => entry.name)
    // charmander/charmeleon/charizard/charjabug start with it; chimchar only contains it.
    expect(names.indexOf('chimchar')).toBe(names.length - 1)
    expect(names.slice(0, 4).every((name) => name.startsWith('char'))).toBe(true)
  })

  it('puts an exact match first even when longer names also start with it', () => {
    const entries = [{ name: 'charizard' }, { name: 'char' }, { name: 'charmander' }]
    expect(filterByName(entries, 'char')[0]?.name).toBe('char')
  })

  it('ignores case, spaces and punctuation, so "Mr. Mime" reaches mr-mime', () => {
    for (const query of ['Mr. Mime', 'mr mime', 'MR-MIME', 'mrmime']) {
      expect(filterByName(dex, query).map((entry) => entry.name)).toContain('mr-mime')
    }
  })

  it('returns nothing for a name that is not in the dex', () => {
    expect(filterByName(dex, 'notapokemon')).toEqual([])
  })
})
