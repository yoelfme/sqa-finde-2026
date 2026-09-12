import type { CSSProperties } from 'react'
import { typeHue } from '~/lib/types'

/**
 * The one authored moment on the surface: changing type redraws this rule in
 * the new hue. `key` restarts the animation, so the draw reads as a response
 * to the choice rather than as page-load decoration.
 */
export function ResultsHeader({
  title,
  count,
  typeName,
  note,
}: {
  title: string
  count: number | null
  typeName?: string | null
  note?: string
}) {
  return (
    <header
      style={{ '--hue': typeHue(typeName) } as CSSProperties}
      className="pt-8 pb-5 md:pt-10"
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-[1.5rem] leading-none font-bold tracking-[-0.025em] text-ink">
          {title}
        </h1>
        {count === null ? null : (
          <p className="tnum text-[0.8125rem] text-ink-faint">
            {count} {count === 1 ? 'specimen' : 'specimens'}
          </p>
        )}
      </div>
      {note ? <p className="mt-1.5 text-[0.8125rem] text-ink-soft">{note}</p> : null}
      <div
        key={typeName ?? 'all'}
        aria-hidden="true"
        className="mt-4 h-0.5 origin-left animate-[draw_260ms_var(--ease-out-quint)] bg-[var(--hue)]"
      />
    </header>
  )
}
