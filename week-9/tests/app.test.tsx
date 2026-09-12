import { describe, expect, it } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'

import { renderApp } from './utils'

/** The result grid in reading order, which is what the ranking test asserts. */
function resultNames(): string[] {
  return screen
    .getAllByRole('link')
    .map((link) => link.getAttribute('href'))
    .filter((href): href is string => Boolean(href?.startsWith('/pokemon/')))
    .map((href) => href.replace('/pokemon/', ''))
}
import { server } from './msw/server'
import { failingHandlers } from './msw/handlers'

/**
 * These mount the real route tree over a memory history, so a failure here
 * means the app is broken, not that a stub drifted. Everything is queried by
 * accessible role and name, which is also how the Cypress pass will find it.
 */
describe('the index', () => {
  it('lists the dex with its dex numbers', async () => {
    renderApp('/')

    expect(await screen.findByRole('heading', { name: 'National Dex' })).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: 'Pikachu, no. 0025' })).toBeInTheDocument()
    expect(screen.getByText('13 specimens')).toBeInTheDocument()
  })

  it('shows every type in the rail with its roster count', async () => {
    renderApp('/')

    const rail = await screen.findByRole('navigation', { name: 'Filter by type' })
    await waitFor(() =>
      expect(within(rail).getByRole('link', { name: 'Water, 8 specimens' })).toBeInTheDocument(),
    )
    // The three memberless types PokeAPI lists never reach the rail.
    expect(within(rail).queryByRole('link', { name: /Stellar/ })).not.toBeInTheDocument()
  })
})

describe('searching by name', () => {
  it('filters the dex from the URL and keeps the ranked order', async () => {
    renderApp('/?q=char')

    expect(await screen.findByRole('heading', { name: '“char”' })).toBeInTheDocument()

    await screen.findByRole('link', { name: /^Charmander/ })
    const names = resultNames()
    expect(names[0]).toBe('charmander')
    expect(names).toContain('chimchar')
    expect(names).not.toContain('bulbasaur')
  })

  it('pushes the typed query into the URL so a result set is shareable', async () => {
    const { user, router } = renderApp('/')
    await screen.findByRole('heading', { name: 'National Dex' })

    await user.type(screen.getByRole('searchbox', { name: /Search Pokémon by name/ }), 'squirt')

    await waitFor(() => expect(router.state.location.search).toEqual({ q: 'squirt' }))
    expect(await screen.findByRole('link', { name: /^Squirtle/ })).toBeInTheDocument()
  })

  it('teaches the interface instead of erroring when nothing matches', async () => {
    renderApp('/?q=notapokemon')

    expect(await screen.findByText(/No specimen is named “notapokemon”/)).toBeInTheDocument()
    expect(screen.getByText(/Clear the search to see the full dex/)).toBeInTheDocument()
  })
})

describe('browsing by type', () => {
  it('renders the roster for the type in the URL', async () => {
    renderApp('/type/water')

    expect(await screen.findByRole('heading', { name: 'Water' })).toBeInTheDocument()
    expect(screen.getByText('8 specimens')).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: 'Squirtle, no. 0007' })).toBeInTheDocument()
  })

  it('narrows a type roster by the same search query', async () => {
    renderApp('/type/water?q=squirt')

    expect(await screen.findByRole('heading', { name: 'Water' })).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: /^Squirtle/ })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /^Psyduck/ })).not.toBeInTheDocument()
  })

  it('offers the same choices through the dropdown', async () => {
    const { user } = renderApp('/type/water')
    await screen.findByRole('heading', { name: 'Water' })

    await user.click(screen.getByRole('combobox', { name: 'Filter by type' }))

    const listbox = await screen.findByRole('listbox')
    expect(within(listbox).getByRole('option', { name: /All types/ })).toBeInTheDocument()
    expect(within(listbox).getByRole('option', { name: /Ghost/ })).toBeInTheDocument()
  })
})

describe('a specimen', () => {
  it('shows its measurements, abilities, stats and cleaned flavor text', async () => {
    renderApp('/pokemon/pikachu')

    expect(await screen.findByRole('heading', { name: 'Pikachu' })).toBeInTheDocument()
    expect(screen.getByText('Mouse Pokémon')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Electric/ })).toBeInTheDocument()
    expect(screen.getByText('0.4 m')).toBeInTheDocument()
    expect(screen.getByText('Static, Lightning Rod (hidden)')).toBeInTheDocument()
    expect(screen.getByText('320')).toBeInTheDocument()

    const flavor = screen.getByText(/When several of these Pokémon gather/)
    expect(flavor.textContent).not.toMatch(/[\n\r\f]/)
  })

  it('answers an unknown name with the not-found state, not an error', async () => {
    renderApp('/pokemon/notarealpokemon')

    expect(await screen.findByRole('heading', { name: 'No entry here' })).toBeInTheDocument()
  })
})

describe('when PokeAPI is unreachable', () => {
  it('names the problem and offers the recovery', async () => {
    server.use(...failingHandlers)
    renderApp('/')

    expect(await screen.findByRole('heading', { name: 'PokeAPI did not answer' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })
})
