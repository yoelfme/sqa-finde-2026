import { createFileRoute, notFound } from '@tanstack/react-router'
import { useQuery, useSuspenseQuery } from '@tanstack/react-query'

import { pokemonQuery, speciesQuery } from '~/api/queries'
import { NotFoundError } from '~/api/client'
import { displayName } from '~/lib/names'
import { SpecimenLabel } from '~/components/SpecimenLabel'

export const Route = createFileRoute('/pokemon/$name')({
  loader: async ({ context, params }) => {
    try {
      const pokemon = await context.queryClient.ensureQueryData(pokemonQuery(params.name))
      // Species carries the genus and flavor text — the most readable content
      // on the page, so it is resolved before render rather than popped in
      // after hydration. A species failure degrades the label, not the route.
      await context.queryClient
        .ensureQueryData(speciesQuery(pokemon.species.name))
        .catch(() => undefined)
      return { speciesName: pokemon.species.name }
    } catch (error) {
      if (error instanceof NotFoundError) throw notFound()
      throw error
    }
  },
  head: ({ params }) => ({
    meta: [{ title: `${displayName(params.name)} · Pokédex` }],
  }),
  pendingComponent: () => (
    <div className="py-20 text-[0.875rem] text-ink-faint">Loading specimen…</div>
  ),
  component: SpecimenRoute,
})

function SpecimenRoute() {
  const { name } = Route.useParams()
  const { speciesName } = Route.useLoaderData()
  const { data: pokemon } = useSuspenseQuery(pokemonQuery(name))
  const { data: species } = useQuery(speciesQuery(speciesName))

  return <SpecimenLabel pokemon={pokemon} species={species} />
}
