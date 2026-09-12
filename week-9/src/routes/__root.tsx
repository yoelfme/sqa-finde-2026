/// <reference types="vite/client" />
import type { ReactNode } from 'react'
import { z } from 'zod'
import type { QueryClient } from '@tanstack/react-query'
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'

import { TypeRail } from '~/components/TypeRail'
import { NotFound } from '~/components/NotFound'
import { pokemonIndexQuery, typeNamesQuery } from '~/api/queries'
import appCss from '~/styles.css?url'

/**
 * `q` is declared on the root so every route below inherits it: the search
 * field can stay in the rail and filter whatever list is on screen, and any
 * result set remains a shareable URL.
 */
const searchSchema = z.object({
  q: z.string().optional().catch(undefined),
})

export interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Pokédex' },
      {
        name: 'description',
        content:
          'A specimen index of every Pokémon: search by name, or browse a type’s full roster.',
      },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  // Both are needed by the rail on every route, and both are immutable, so
  // resolving them here means the server-rendered first paint already has them.
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(pokemonIndexQuery),
      context.queryClient.ensureQueryData(typeNamesQuery),
    ])
  },
  notFoundComponent: NotFound,
  shellComponent: RootDocument,
  component: RootLayout,
})

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}

function RootLayout() {
  return (
    <div className="min-h-dvh md:grid md:grid-cols-[16.5rem_minmax(0,1fr)]">
      <TypeRail />
      <main className="min-w-0 px-5 md:px-8 lg:px-10">
        <Outlet />
      </main>
    </div>
  )
}
