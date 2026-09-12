/** Minimal OKLCH -> linear sRGB and WCAG contrast, for asserting the palette. */

export function oklchToLinearSrgb(L: number, C: number, hDeg: number): [number, number, number] {
  const h = (hDeg * Math.PI) / 180
  const a = C * Math.cos(h)
  const b = C * Math.sin(h)

  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3

  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}

export function contrastRatio(a: readonly number[], b: readonly number[]): number {
  const luminance = (linear: readonly number[]) => {
    const [r = 0, g = 0, bl = 0] = linear.map((u) => Math.min(Math.max(u, 0), 1))
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl
  }
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}

/** Reads `--name: oklch(L C H)` declarations out of a stylesheet. */
export function parseOklchTokens(css: string, prefix: string): Map<string, [number, number, number]> {
  const found = new Map<string, [number, number, number]>()
  const pattern = new RegExp(
    `--(${prefix}[\\w-]*)\\s*:\\s*oklch\\(\\s*([\\d.]+)\\s+([\\d.]+)\\s+([\\d.]+)\\s*\\)`,
    'g',
  )
  for (const match of css.matchAll(pattern)) {
    found.set(match[1]!, [Number(match[2]), Number(match[3]), Number(match[4])])
  }
  return found
}
