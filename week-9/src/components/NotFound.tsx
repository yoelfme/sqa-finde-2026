import { Link } from '@tanstack/react-router'

export function NotFound() {
  return (
    <div className="max-w-[48ch] py-20">
      <h1 className="text-[1.5rem] leading-none font-bold tracking-[-0.025em] text-ink">
        No entry here
      </h1>
      <p className="mt-3 text-[0.9375rem] text-ink-soft">
        That address does not match a Pokémon or a type. Names in the dex are lowercase and
        hyphenated — <span className="text-ink">mr-mime</span>, not{' '}
        <span className="text-ink">Mr. Mime</span>.
      </p>
      <Link
        to="/"
        search={{ q: undefined }}
        className="mt-6 inline-block border-b border-ink pb-0.5 text-[0.875rem] text-ink transition-colors duration-150 hover:border-transparent"
      >
        Back to the index
      </Link>
    </div>
  )
}
