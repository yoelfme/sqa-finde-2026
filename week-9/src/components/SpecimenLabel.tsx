import type { CSSProperties } from 'react'
import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'

import type { Pokemon, Species } from '~/api/schemas'
import { artworkUrl, dexNumber } from '~/lib/sprites'
import { displayName } from '~/lib/names'
import { normalizeFlavorText } from '~/lib/flavor'
import { typeHue } from '~/lib/types'
import type { SearchParams } from '~/lib/searchParams'

const STAT_LABELS: Record<string, string> = {
  hp: 'HP',
  attack: 'Attack',
  defense: 'Defense',
  'special-attack': 'Sp. Attack',
  'special-defense': 'Sp. Defense',
  speed: 'Speed',
}

/** The highest base stat any Pokemon reaches, so bars share one scale. */
const STAT_CEILING = 255

function englishGenus(species: Species | undefined): string | null {
  return species?.genera.find((entry) => entry.language.name === 'en')?.genus ?? null
}

function englishFlavor(species: Species | undefined): string | null {
  const entry = species?.flavor_text_entries.find((item) => item.language.name === 'en')
  return entry ? normalizeFlavorText(entry.flavor_text) : null
}

export function SpecimenLabel({
  pokemon,
  species,
}: {
  pokemon: Pokemon
  species: Species | undefined
}) {
  const primaryType = pokemon.types[0]?.type.name
  const genus = englishGenus(species)
  const flavor = englishFlavor(species)

  return (
    <article
      style={{ '--hue': typeHue(primaryType) } as CSSProperties}
      className="pt-8 pb-16 md:pt-10"
    >
      <Link
        to="/"
        search={(prev: SearchParams) => ({ q: prev.q })}
        className="inline-flex items-center gap-1.5 text-[0.8125rem] text-ink-soft transition-colors duration-150 hover:text-ink"
      >
        <ArrowLeft className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
        Back to the index
      </Link>

      <div className="mt-6 grid gap-8 md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] md:gap-12">
        <Artwork id={pokemon.id} name={pokemon.name} />

        <div className="min-w-0 max-w-2xl">
          <p className="tnum text-[0.8125rem] text-ink-faint">{dexNumber(pokemon.id)}</p>
          <h1 className="mt-1 text-[2rem] leading-none font-bold tracking-[-0.03em] text-ink">
            {displayName(pokemon.name)}
          </h1>
          {genus ? <p className="mt-2 text-[0.9375rem] italic text-ink-soft">{genus}</p> : null}

          <div className="mt-5 h-0.5 bg-[var(--hue)]" aria-hidden="true" />

          <ul className="mt-5 flex flex-wrap gap-2">
            {pokemon.types.map(({ type }) => (
              <li key={type.name}>
                <Link
                  to="/type/$typeName"
                  params={{ typeName: type.name }}
                  search={{ q: undefined }}
                  style={{ '--hue': typeHue(type.name) } as CSSProperties}
                  className="inline-flex items-center gap-2 border border-[var(--hue)] px-2.5 py-1 text-[0.8125rem] text-[var(--hue)] transition-colors duration-150 hover:bg-[color-mix(in_oklab,var(--hue)_10%,transparent)]"
                >
                  <span aria-hidden="true" className="size-1.5 bg-[var(--hue)]" />
                  {displayName(type.name)}
                </Link>
              </li>
            ))}
          </ul>

          {flavor ? (
            <p className="mt-7 text-[0.9375rem] leading-relaxed text-ink">{flavor}</p>
          ) : null}

          <Measurements pokemon={pokemon} />
          <Stats pokemon={pokemon} />
        </div>
      </div>
    </article>
  )
}

function Artwork({ id, name }: { id: number; name: string }) {
  const [failed, setFailed] = useState(false)

  return (
    <div className="grid aspect-square w-full place-items-center border border-rule bg-rail p-6">
      {failed ? (
        <span className="text-[0.8125rem] text-ink-faint">No artwork on file</span>
      ) : (
        <img
          src={artworkUrl(id)}
          alt={`Official artwork of ${displayName(name)}`}
          width={320}
          height={320}
          onError={() => setFailed(true)}
          className="size-full object-contain"
        />
      )}
    </div>
  )
}

function Measurements({ pokemon }: { pokemon: Pokemon }) {
  // PokeAPI stores height in decimetres and weight in hectograms.
  const rows: Array<[string, string]> = [
    ['Height', `${(pokemon.height / 10).toFixed(1)} m`],
    ['Weight', `${(pokemon.weight / 10).toFixed(1)} kg`],
    [
      pokemon.abilities.length === 1 ? 'Ability' : 'Abilities',
      pokemon.abilities
        .map((entry) =>
          entry.is_hidden
            ? `${displayName(entry.ability.name)} (hidden)`
            : displayName(entry.ability.name),
        )
        .join(', '),
    ],
  ]

  return (
    <dl className="mt-8 max-w-lg border-t border-rule">
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="grid grid-cols-[7rem_1fr] gap-4 border-b border-rule py-2.5 text-[0.875rem]"
        >
          <dt className="text-ink-faint">{label}</dt>
          <dd className="tnum text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function Stats({ pokemon }: { pokemon: Pokemon }) {
  const total = pokemon.stats.reduce((sum, entry) => sum + entry.base_stat, 0)

  return (
    <section className="mt-8 max-w-lg">
      <h2 className="text-[0.8125rem] font-semibold text-ink">Base stats</h2>
      <dl className="mt-3">
        {pokemon.stats.map((entry) => (
          <div
            key={entry.stat.name}
            className="grid grid-cols-[7rem_2.5rem_1fr] items-center gap-4 py-1.5 text-[0.875rem]"
          >
            <dt className="text-ink-faint">{STAT_LABELS[entry.stat.name] ?? entry.stat.name}</dt>
            <dd className="tnum text-right text-ink">{entry.base_stat}</dd>
            <dd
              aria-hidden="true"
              className="h-px bg-rule"
              // A measured rule, not a bar: the hue's length is the value.
            >
              <div
                className="h-0.5 -translate-y-px bg-[var(--hue)]"
                style={{ width: `${Math.min(100, (entry.base_stat / STAT_CEILING) * 100)}%` }}
              />
            </dd>
          </div>
        ))}
        <div className="mt-2 grid grid-cols-[7rem_2.5rem_1fr] gap-4 border-t border-rule pt-2.5 text-[0.875rem]">
          <dt className="text-ink-faint">Total</dt>
          <dd className="tnum text-right font-semibold text-ink">{total}</dd>
          <dd />
        </div>
      </dl>
    </section>
  )
}
