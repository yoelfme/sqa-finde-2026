import { queryOptions } from '@tanstack/react-query'
import { fetchResource } from './client'
import {
  pokemonIndexSchema,
  pokemonSchema,
  speciesSchema,
  typeDetailSchema,
  typeIndexSchema,
} from './schemas'
import { idFromUrl } from '~/lib/sprites'

/** A dex entry as the grid needs it: a name and the id that addresses artwork. */
export interface Specimen {
  name: string
  id: number
}

/**
 * The whole national dex in one 11.7KB (gzipped) response, 1351 entries.
 * It never changes between game releases, so it is fetched once and kept:
 * every name search then runs in memory instead of over the network.
 */
export const pokemonIndexQuery = queryOptions({
  queryKey: ['pokemon-index'],
  staleTime: Infinity,
  gcTime: Infinity,
  queryFn: async (): Promise<Specimen[]> => {
    const index = await fetchResource('/pokemon?limit=100000', pokemonIndexSchema)
    return index.results.map((entry) => ({ name: entry.name, id: idFromUrl(entry.url) }))
  },
})

/**
 * PokeAPI lists 21 types, three of which ("stellar", "unknown", "shadow") have
 * no Pokemon. They are filtered by their roster being empty rather than by name,
 * so a future type that gains members appears on its own.
 */
export const typeNamesQuery = queryOptions({
  queryKey: ['type-names'],
  staleTime: Infinity,
  gcTime: Infinity,
  queryFn: async (): Promise<string[]> => {
    const index = await fetchResource('/type?limit=100', typeIndexSchema)
    return index.results.map((entry) => entry.name)
  },
})

export interface TypeRoster {
  name: string
  specimens: Specimen[]
}

/**
 * Cached forever and prefetched for every type on the client, which is what
 * puts a live count beside each type in the rail and makes switching between
 * them instant. PokeAPI serves these with `max-age=86400`, so the 18 requests
 * happen at most once a day per browser.
 */
export function typeRosterQuery(typeName: string) {
  return queryOptions({
    queryKey: ['type', typeName],
    staleTime: Infinity,
    gcTime: Infinity,
    queryFn: async (): Promise<TypeRoster> => {
      const detail = await fetchResource(`/type/${typeName}`, typeDetailSchema)
      return {
        name: detail.name,
        specimens: detail.pokemon.map((entry) => ({
          name: entry.pokemon.name,
          id: idFromUrl(entry.pokemon.url),
        })),
      }
    },
  })
}

export function pokemonQuery(name: string) {
  return queryOptions({
    queryKey: ['pokemon', name],
    staleTime: 1000 * 60 * 60,
    queryFn: () => fetchResource(`/pokemon/${name}`, pokemonSchema),
  })
}

export function speciesQuery(speciesName: string) {
  return queryOptions({
    queryKey: ['species', speciesName],
    staleTime: 1000 * 60 * 60,
    queryFn: () => fetchResource(`/pokemon-species/${speciesName}`, speciesSchema),
  })
}
