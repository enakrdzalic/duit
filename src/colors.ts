export type CategoryColor = {
  id: string
  /** Main folder body */
  folder: string
  /** Inactive tab */
  tab: string
  /** Soft gradient highlight */
  highlight: string
}

/** Pastel palette that matches the site (blush, peach, cream, mint, lilac, sky, butter, sage) */
export const CATEGORY_COLORS: CategoryColor[] = [
  {
    id: 'sky',
    folder: '#b7c9e0',
    tab: '#8fa8c8',
    highlight: '#c5d4e8',
  },
  {
    id: 'blush',
    folder: '#e8a4b8',
    tab: '#c9839a',
    highlight: '#f0bdd0',
  },
  {
    id: 'peach',
    folder: '#f0c4a8',
    tab: '#d4a07e',
    highlight: '#f6d4be',
  },
  {
    id: 'lilac',
    folder: '#c5b8d9',
    tab: '#a393bc',
    highlight: '#d4cae6',
  },
  {
    id: 'mint',
    folder: '#b8d4c8',
    tab: '#8fb3a4',
    highlight: '#c9e2d8',
  },
  {
    id: 'butter',
    folder: '#e8d89a',
    tab: '#c9b872',
    highlight: '#f0e4b0',
  },
  {
    id: 'sage',
    folder: '#c5d0a8',
    tab: '#a3b084',
    highlight: '#d5dec0',
  },
  {
    id: 'cream',
    folder: '#e4d5c0',
    tab: '#c4b39a',
    highlight: '#efe4d4',
  },
]

export const DEFAULT_FOLDER = CATEGORY_COLORS[0]

export function colorById(id: string | undefined): CategoryColor {
  return CATEGORY_COLORS.find((c) => c.id === id) ?? DEFAULT_FOLDER
}

export function nextColorId(existing: string[]): string {
  const counts = new Map(CATEGORY_COLORS.map((c) => [c.id, 0]))
  for (const id of existing) {
    counts.set(id, (counts.get(id) ?? 0) + 1)
  }
  let best = CATEGORY_COLORS[0].id
  let bestCount = Infinity
  for (const c of CATEGORY_COLORS) {
    const n = counts.get(c.id) ?? 0
    if (n < bestCount) {
      best = c.id
      bestCount = n
    }
  }
  return best
}
