import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'

import { pokemonIndexQuery } from '~/api/queries'
import { filterByName } from '~/lib/search'
import { ResultsHeader } from '~/components/ResultsHeader'
import { EmptyState, GridSkeleton, SpecimenGrid } from '~/components/SpecimenGrid'

export const Route = createFileRoute('/')({
  loader: ({ context }) => context.queryClient.ensureQueryData(pokemonIndexQuery),
  pendingComponent: () => (
    <>
      <ResultsHeader title="National Dex" count={null} />
      <GridSkeleton />
    </>
  ),
  component: NationalDex,
})

function NationalDex() {
  const { q = '' } = Route.useSearch()
  const { data: index } = useSuspenseQuery(pokemonIndexQuery)
  const results = filterByName(index, q)

  return (
    <>
      <ResultsHeader
        title={q ? `“${q}”` : 'National Dex'}
        count={results.length}
        note={q ? undefined : 'Every Pokémon, in the order the dex lists them.'}
      />
      {results.length === 0 ? <EmptyState query={q} /> : <SpecimenGrid specimens={results} />}
    </>
  )
}
