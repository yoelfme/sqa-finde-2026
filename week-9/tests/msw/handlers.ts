import { HttpResponse, http } from 'msw'

import pokemonIndex from './fixtures/pokemon-index.json'
import typeIndex from './fixtures/type-index.json'
import typeWater from './fixtures/type-water.json'
import pokemonPikachu from './fixtures/pokemon-pikachu.json'
import speciesPikachu from './fixtures/species-pikachu.json'

const BASE = 'https://pokeapi.co/api/v2'

/**
 * Fixtures are real PokeAPI responses trimmed to the fields the schemas read,
 * so a shape change upstream shows up as a failing test rather than as a
 * handler that quietly disagrees with production.
 */
export const handlers = [
  http.get(`${BASE}/pokemon`, () => HttpResponse.json(pokemonIndex)),
  http.get(`${BASE}/type`, () => HttpResponse.json(typeIndex)),

  http.get(`${BASE}/type/:name`, ({ params }) =>
    params.name === 'water'
      ? HttpResponse.json(typeWater)
      : HttpResponse.json({ name: params.name, pokemon: [] }),
  ),

  http.get(`${BASE}/pokemon/:name`, ({ params }) =>
    params.name === 'pikachu'
      ? HttpResponse.json(pokemonPikachu)
      : new HttpResponse('Not Found', { status: 404 }),
  ),

  http.get(`${BASE}/pokemon-species/:name`, ({ params }) =>
    params.name === 'pikachu'
      ? HttpResponse.json(speciesPikachu)
      : new HttpResponse('Not Found', { status: 404 }),
  ),
]

/** Turns any PokeAPI call into a server error, for exercising the error state. */
export const failingHandlers = [
  http.get(`${BASE}/*`, () => new HttpResponse('Bad Gateway', { status: 502 })),
]
