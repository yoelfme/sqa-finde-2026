import { createFileRoute, notFound } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'

import { typeRosterQuery } from '~/api/queries'
import { NotFoundError } from '~/api/client'
import { filterByName } from '~/lib/search'
import { displayName } from '~/lib/names'
import { ResultsHeader } from '~/components/ResultsHeader'
import { EmptyState, GridSkeleton, SpecimenGrid } from '~/components/SpecimenGrid'

export const Route = createFileRoute('/type/$typeName')({
  loader: async ({ context, params }) => {
    try {
      await context.queryClient.ensureQueryData(typeRosterQuery(params.typeName))
    } catch (error) {
      if (error instanceof NotFoundError) throw notFound()
      throw error
    }
  },
  pendingComponent: PendingRoster,
  component: TypeRoster,
})

function PendingRoster() {
  const { typeName } = Route.useParams()
  return (
    <>
      <ResultsHeader title={displayName(typeName)} count={null} typeName={typeName} />
      <GridSkeleton />
    </>
  )
}

function TypeRoster() {
  const { typeName } = Route.useParams()
  const { q = '' } = Route.useSearch()
  const { data: roster } = useSuspenseQuery(typeRosterQuery(typeName))
  const results = filterByName(roster.specimens, q)

  return (
    <>
      <ResultsHeader
        title={displayName(typeName)}
        count={results.length}
        typeName={typeName}
        note={
          q
            ? `Matching “${q}” within ${displayName(typeName)}.`
            : `Every Pokémon carrying the ${typeName} type, primary or secondary.`
        }
      />
      {results.length === 0 ? <EmptyState query={q} /> : <SpecimenGrid specimens={results} />}
    </>
  )
}
