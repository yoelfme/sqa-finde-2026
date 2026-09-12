import type { z } from 'zod'

export const POKEAPI_BASE = 'https://pokeapi.co/api/v2'

/** Distinguishes "this name does not exist" from "the request failed". */
export class NotFoundError extends Error {
  constructor(path: string) {
    super(`Nothing in the Pokedex answers to ${path}.`)
    this.name = 'NotFoundError'
  }
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    path: string,
  ) {
    super(`PokeAPI returned ${status} for ${path}.`)
    this.name = 'ApiError'
  }
}

export async function fetchResource<T>(path: string, schema: z.ZodType<T>): Promise<T> {
  const response = await fetch(`${POKEAPI_BASE}${path}`, {
    headers: { Accept: 'application/json' },
  })

  if (response.status === 404) throw new NotFoundError(path)
  if (!response.ok) throw new ApiError(response.status, path)

  return schema.parse(await response.json())
}
