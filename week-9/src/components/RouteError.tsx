import { useRouter } from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'

/** Names the problem and the recovery, rather than reporting that one occurred. */
export function RouteError({ error }: ErrorComponentProps) {
  const router = useRouter()

  return (
    <div className="max-w-[48ch] py-20">
      <h1 className="text-[1.5rem] leading-none font-bold tracking-[-0.025em] text-ink">
        PokeAPI did not answer
      </h1>
      <p className="mt-3 text-[0.9375rem] text-ink-soft">
        The dex data could not be loaded, so there is nothing to show yet. This is usually a
        dropped connection or a rate limit that clears on its own.
      </p>
      {error instanceof Error && error.message ? (
        <p className="mt-3 text-[0.8125rem] text-ink-faint">{error.message}</p>
      ) : null}
      <button
        type="button"
        onClick={() => void router.invalidate()}
        className="mt-6 border border-ink px-3 py-1.5 text-[0.875rem] text-ink transition-colors duration-150 hover:bg-ink hover:text-ground"
      >
        Try again
      </button>
    </div>
  )
}
