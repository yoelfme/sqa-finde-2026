import type { CSSProperties } from 'react'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { useQueries, useQuery } from '@tanstack/react-query'
import { Select } from 'radix-ui'
import { Check, ChevronDown } from 'lucide-react'

import { pokemonIndexQuery, typeNamesQuery, typeRosterQuery } from '~/api/queries'
import { displayName } from '~/lib/names'
import { TYPE_ORDER, typeHue } from '~/lib/types'
import type { SearchParams } from '~/lib/searchParams'
import { SearchField } from './SearchField'

interface RailType {
  name: string
  count: number | null
}

/**
 * Rosters are fetched for every type and cached for the session. That is what
 * puts a live count beside each entry, and it means switching types afterwards
 * is instant rather than a fresh round trip.
 */
function useRailTypes(): RailType[] {
  const { data: apiTypeNames } = useQuery(typeNamesQuery)
  const counts = useQueries({
    queries: (apiTypeNames ?? []).map((name) => typeRosterQuery(name)),
    // `combine` runs on every render and its result must survive React Query's
    // structural equality check. A Map is a fresh reference each time, which
    // makes the store snapshot change forever and spins an infinite render
    // loop; a plain object is compared field by field and stays stable.
    combine: (results): Record<string, number> =>
      Object.fromEntries(
        results.flatMap((result) =>
          result.data ? [[result.data.name, result.data.specimens.length]] : [],
        ),
      ),
  })

  // The eighteen chart types always render, so the rail never reflows as counts
  // arrive. A type PokeAPI adds later joins them once it has members of its own.
  const extras = (apiTypeNames ?? []).filter(
    (name) => !TYPE_ORDER.includes(name as never) && (counts[name] ?? 0) > 0,
  )

  return [...TYPE_ORDER, ...extras].map((name) => ({
    name,
    count: counts[name] ?? null,
  }))
}

function useActiveType(): string | undefined {
  return useParams({ strict: false }).typeName
}

export function TypeRail() {
  const types = useRailTypes()
  const activeType = useActiveType()
  const { data: index } = useQuery(pokemonIndexQuery)

  return (
    <aside className="sticky top-0 z-20 border-b border-rule bg-rail md:z-0 md:flex md:h-dvh md:flex-col md:border-r md:border-b-0">
      <div className="flex flex-col gap-3 px-5 py-4 md:gap-5 md:py-6">
        <Link
          to="/"
          search={{ q: undefined }}
          className="text-[1.0625rem] font-bold tracking-[-0.02em] text-ink"
        >
          Pokédex
        </Link>
        <SearchField />
        <MobileTypeSelect types={types} activeType={activeType} />
      </div>

      <nav
        aria-label="Filter by type"
        className="hidden min-h-0 flex-1 overflow-y-auto pb-6 md:block"
      >
        <ul>
          <li>
            <TypeRow name={null} count={index?.length ?? null} isActive={!activeType} />
          </li>
          {types.map((type) => (
            <li key={type.name}>
              <TypeRow
                name={type.name}
                count={type.count}
                isActive={activeType === type.name}
              />
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}

function TypeRow({
  name,
  count,
  isActive,
}: {
  name: string | null
  count: number | null
  isActive: boolean
}) {
  const hue = typeHue(name)
  const label = name ? displayName(name) : 'All types'

  const shared =
    'grid w-full grid-cols-[0.5rem_1fr_auto] items-center gap-3 px-5 py-[0.4375rem] text-left text-[0.875rem] transition-colors duration-150'
  const state = isActive
    ? 'bg-[color-mix(in_oklab,var(--hue)_11%,transparent)] font-semibold text-ink'
    : 'text-ink-soft hover:bg-[color-mix(in_oklab,var(--hue)_7%,transparent)] hover:text-ink'

  return (
    <Link
      to={name ? '/type/$typeName' : '/'}
      params={name ? { typeName: name } : undefined}
      search={(prev: SearchParams) => ({ q: prev.q })}
      aria-label={count === null ? label : `${label}, ${count} specimens`}
      aria-current={isActive ? 'page' : undefined}
      style={{ '--hue': hue } as CSSProperties}
      className={`${shared} ${state}`}
    >
      <span
        aria-hidden="true"
        className={
          name
            ? 'size-2 bg-[var(--hue)]'
            : 'size-2 border border-rule-strong'
        }
      />
      <span>{label}</span>
      <span className="tnum text-xs text-ink-faint">{count ?? ''}</span>
    </Link>
  )
}

function MobileTypeSelect({
  types,
  activeType,
}: {
  types: RailType[]
  activeType: string | undefined
}) {
  const navigate = useNavigate()
  const value = activeType ?? 'all'

  return (
    <div className="md:hidden">
      <Select.Root
        value={value}
        onValueChange={(next) => {
          void navigate(
            next === 'all'
              ? { to: '/', search: (prev: SearchParams) => ({ q: prev.q }) }
              : {
                  to: '/type/$typeName',
                  params: { typeName: next },
                  search: (prev: SearchParams) => ({ q: prev.q }),
                },
          )
        }}
      >
        <Select.Trigger
          aria-label="Filter by type"
          className="flex w-full items-center justify-between gap-2 border-b border-rule-strong py-2 text-[0.9375rem] text-ink data-[placeholder]:text-ink-faint"
        >
          <span className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              style={{ '--hue': typeHue(activeType) } as CSSProperties}
              className={
                activeType ? 'size-2 bg-[var(--hue)]' : 'size-2 border border-rule-strong'
              }
            />
            <Select.Value />
          </span>
          <Select.Icon>
            <ChevronDown className="size-4 text-ink-faint" strokeWidth={1.75} />
          </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Content
            position="popper"
            sideOffset={4}
            className="z-50 max-h-[60dvh] w-(--radix-select-trigger-width) overflow-hidden border border-rule-strong bg-ground shadow-[0_8px_24px_-8px_oklch(0.24_0.014_250/0.22)]"
          >
            <Select.Viewport className="py-1">
              <TypeOption value="all" label="All types" hue={null} />
              {types.map((type) => (
                <TypeOption
                  key={type.name}
                  value={type.name}
                  label={displayName(type.name)}
                  hue={typeHue(type.name)}
                  count={type.count}
                />
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  )
}

function TypeOption({
  value,
  label,
  hue,
  count,
}: {
  value: string
  label: string
  hue: string | null
  count?: number | null
}) {
  return (
    <Select.Item
      value={value}
      style={hue ? ({ '--hue': hue } as CSSProperties) : undefined}
      className="grid cursor-default grid-cols-[0.5rem_1fr_auto_1rem] items-center gap-3 px-4 py-2 text-[0.875rem] text-ink-soft outline-none data-[highlighted]:bg-[color-mix(in_oklab,var(--hue)_10%,transparent)] data-[highlighted]:text-ink"
    >
      <span
        aria-hidden="true"
        className={hue ? 'size-2 bg-[var(--hue)]' : 'size-2 border border-rule-strong'}
      />
      <Select.ItemText>{label}</Select.ItemText>
      <span className="tnum text-xs text-ink-faint">{count ?? ''}</span>
      <Select.ItemIndicator>
        <Check className="size-3.5" strokeWidth={2} />
      </Select.ItemIndicator>
    </Select.Item>
  )
}
