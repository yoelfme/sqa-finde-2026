import { z } from 'zod'

/**
 * A Pokemon detail payload is ~291KB, most of it `moves`. These schemas pick
 * only the fields the interface renders, so parsing stays cheap and a shape
 * change upstream fails loudly at the boundary instead of quietly in a view.
 */

const namedResource = z.object({
  name: z.string(),
  url: z.string(),
})
export type NamedResource = z.infer<typeof namedResource>

export const pokemonIndexSchema = z.object({
  count: z.number(),
  results: z.array(namedResource),
})
export type PokemonIndex = z.infer<typeof pokemonIndexSchema>

export const typeIndexSchema = z.object({
  results: z.array(namedResource),
})

export const typeDetailSchema = z.object({
  name: z.string(),
  pokemon: z.array(z.object({ slot: z.number(), pokemon: namedResource })),
})
export type TypeDetail = z.infer<typeof typeDetailSchema>

export const pokemonSchema = z.object({
  id: z.number(),
  name: z.string(),
  height: z.number(),
  weight: z.number(),
  // Alternate forms carry a species name of their own ("deoxys-normal" is the
  // Pokemon, "deoxys" is the species), so flavor text must follow this ref.
  species: namedResource,
  types: z.array(z.object({ slot: z.number(), type: namedResource })),
  abilities: z.array(z.object({ is_hidden: z.boolean(), ability: namedResource })),
  stats: z.array(z.object({ base_stat: z.number(), stat: namedResource })),
  sprites: z.object({
    front_default: z.string().nullable(),
    other: z.object({
      'official-artwork': z.object({ front_default: z.string().nullable() }),
    }),
  }),
})
export type Pokemon = z.infer<typeof pokemonSchema>

export const speciesSchema = z.object({
  genera: z.array(z.object({ genus: z.string(), language: namedResource })),
  flavor_text_entries: z.array(
    z.object({
      flavor_text: z.string(),
      language: namedResource,
      version: namedResource,
    }),
  ),
})
export type Species = z.infer<typeof speciesSchema>
