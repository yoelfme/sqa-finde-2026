import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { routeTree } from '~/routeTree.gen'
import { NotFound } from '~/components/NotFound'
import { RouteError } from '~/components/RouteError'

/**
 * Mounts the real route tree over a memory history, so a test exercises the
 * same loaders, search-param parsing and components the browser runs.
 *
 * The provider is explicit here because in the app it comes from
 * `setupRouterSsrQueryIntegration`, which belongs to the SSR entry.
 */
export function renderApp(initialPath = '/') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  })

  const router = createRouter({
    routeTree,
    context: { queryClient },
    history: createMemoryHistory({ initialEntries: [initialPath] }),
    defaultPendingMs: 0,
    defaultNotFoundComponent: NotFound,
    defaultErrorComponent: RouteError,
  })

  return {
    user: userEvent.setup(),
    router,
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    ),
  }
}
