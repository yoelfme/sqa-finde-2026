import { useEffect, useRef, useState } from 'react'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { Search, X } from 'lucide-react'

import type { SearchParams } from '~/lib/searchParams'

/**
 * Search lives in the URL so a result set is shareable and survives reload.
 * Navigation replaces rather than pushes: one history entry per search, not
 * one per keystroke.
 */
export function SearchField() {
  const navigate = useNavigate()
  const urlQuery = useRouterState({
    select: (state) => (state.location.search as { q?: string }).q ?? '',
  })
  const [value, setValue] = useState(urlQuery)
  const inputRef = useRef<HTMLInputElement>(null)

  // Keeps the field honest when the URL changes from elsewhere (back button,
  // clearing a type), without fighting the user mid-keystroke.
  useEffect(() => {
    if (document.activeElement !== inputRef.current) setValue(urlQuery)
  }, [urlQuery])

  useEffect(() => {
    if (value === urlQuery) return
    const timer = setTimeout(() => {
      void navigate({
        to: '.',
        search: (prev: SearchParams) => ({ ...prev, q: value || undefined }),
        replace: true,
      })
    }, 180)
    return () => clearTimeout(timer)
  }, [value, urlQuery, navigate])

  return (
    <div className="relative">
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-0 size-4 -translate-y-1/2 text-ink-faint"
        strokeWidth={1.75}
      />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search by name"
        aria-label="Search Pokémon by name"
        autoComplete="off"
        spellCheck={false}
        className="w-full border-b border-rule-strong bg-transparent py-2 pr-7 pl-6 text-[0.9375rem] text-ink transition-colors duration-150 placeholder:text-ink-faint focus:border-ink focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <button
          type="button"
          onClick={() => {
            setValue('')
            inputRef.current?.focus()
          }}
          aria-label="Clear search"
          className="absolute top-1/2 right-0 grid size-6 -translate-y-1/2 place-items-center text-ink-faint transition-colors duration-150 hover:text-ink"
        >
          <X className="size-3.5" strokeWidth={2} />
        </button>
      ) : null}
    </div>
  )
}
