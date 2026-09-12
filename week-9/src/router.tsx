import { QueryClient } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'

import { routeTree } from './routeTree.gen'
import { NotFound } from './components/NotFound'
import { RouteError } from './components/RouteError'

/**
 * TanStack Start resolves this file by convention and requires the
 * `getRouter` export; the generated route tree augments `Register` from it.
 */
export function getRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // The dex is immutable between game releases, so refetching on focus
        // only costs bandwidth.
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  })

  const router = createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    scrollRestoration: true,
    defaultNotFoundComponent: NotFound,
    defaultErrorComponent: RouteError,
  })

  // Dehydrates the query cache into the SSR payload so the first paint ships
  // with its data instead of flashing a skeleton on hydration.
  setupRouterSsrQueryIntegration({ router, queryClient })

  return router
}
