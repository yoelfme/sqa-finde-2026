import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'

import type { Specimen } from '~/api/queries'
import { artworkUrl, dexNumber } from '~/lib/sprites'
import { displayName } from '~/lib/names'

const PAGE = 60

const CELL =
  'hairline-lattice group relative flex flex-col items-center gap-1 px-3 pt-5 pb-4 transition-colors duration-150'

/**
 * A lattice of hairline rules, not a deck of cards. A cell draws only the two
 * rules it shares with its neighbours, so the artwork is the only object on
 * the page.
 */
export function SpecimenGrid({ specimens }: { specimens: Specimen[] }) {
  const [visible, setVisible] = useState(PAGE)
  const sentinel = useRef<HTMLDivElement>(null)

  // A new result set starts from the top again.
  const key = specimens.length > 0 ? `${specimens.length}:${specimens[0]?.name}` : 'empty'
  useEffect(() => setVisible(PAGE), [key])

  useEffect(() => {
    const node = sentinel.current
    if (!node || visible >= specimens.length) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible((current) => Math.min(current + PAGE, specimens.length))
        }
      },
      { rootMargin: '600px 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [visible, specimens.length])

  const shown = useMemo(() => specimens.slice(0, visible), [specimens, visible])

  return (
    <>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] border-t border-l border-rule">
        {shown.map((specimen) => (
          <li key={`${specimen.id}-${specimen.name}`} className="contents">
            <SpecimenCell specimen={specimen} />
          </li>
        ))}
      </ul>
      {visible < specimens.length ? (
        <div ref={sentinel} className="py-8 text-center text-xs text-ink-faint tnum">
          {specimens.length - visible} more
        </div>
      ) : null}
    </>
  )
}

function SpecimenCell({ specimen }: { specimen: Specimen }) {
  const [artworkFailed, setArtworkFailed] = useState(false)

  return (
    <Link
      to="/pokemon/$name"
      params={{ name: specimen.name }}
      // Without this the name and the dex number are announced as one run-on
      // token ("0001Bulbasaur"), and in the wrong order for a reader.
      aria-label={`${displayName(specimen.name)}, no. ${dexNumber(specimen.id)}`}
      className={`${CELL} hover:bg-[color-mix(in_oklab,var(--color-ink)_4%,transparent)]`}
    >
      <div className="grid size-24 place-items-center">
        {artworkFailed ? (
          <span aria-hidden="true" className="size-10 border border-rule-strong" />
        ) : (
          <img
            src={artworkUrl(specimen.id)}
            alt=""
            width={96}
            height={96}
            loading="lazy"
            decoding="async"
            onError={() => setArtworkFailed(true)}
            className="size-24 object-contain transition-transform duration-200 ease-out-quint group-hover:scale-105"
          />
        )}
      </div>
      <span className="tnum text-[0.6875rem] text-ink-faint">{dexNumber(specimen.id)}</span>
      <span className="text-center text-[0.8125rem] leading-tight text-ink group-hover:underline group-hover:decoration-rule-strong group-hover:underline-offset-[3px]">
        {displayName(specimen.name)}
      </span>
    </Link>
  )
}

/** Matches the grid's rhythm exactly, so nothing shifts when data lands. */
export function GridSkeleton({ count = 24 }: { count?: number }) {
  return (
    <div
      aria-hidden="true"
      className="grid grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] border-t border-l border-rule"
    >
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className={CELL}>
          <div className="size-24 animate-pulse rounded-full bg-[color-mix(in_oklab,var(--color-ink)_6%,transparent)]" />
          <div className="mt-1 h-2.5 w-8 animate-pulse bg-[color-mix(in_oklab,var(--color-ink)_6%,transparent)]" />
          <div className="mt-1 h-3 w-16 animate-pulse bg-[color-mix(in_oklab,var(--color-ink)_6%,transparent)]" />
        </div>
      ))}
    </div>
  )
}

export function EmptyState({ query }: { query: string }) {
  return (
    <div className="max-w-[46ch] py-16">
      <p className="text-[1.0625rem] text-ink">No specimen is named “{query}”.</p>
      <p className="mt-2 text-[0.875rem] text-ink-soft">
        Names are matched as you type, so a partial one works — “char” finds Charmander through
        Charizard. Clear the search to see the full dex, or pick a type to narrow it instead.
      </p>
    </div>
  )
}
