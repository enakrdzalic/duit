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
    folder: '#d4aebc',
    tab: '#b58a9a',
    highlight: '#e0c4ce',
  },
  {
    id: 'peach',
    folder: '#dcc0a8',
    tab: '#b89a7e',
    highlight: '#e8d2be',
  },
  {
    id: 'lilac',
    folder: '#c5b8d9',
    tab: '#a393bc',
    highlight: '#d4cae6',
  },
  {
    id: 'mint',
    folder: '#a8c4bc',
    tab: '#849e96',
    highlight: '#bdd4cc',
  },
  {
    id: 'butter',
    folder: '#e0d4a4',
    tab: '#c0b07a',
    highlight: '#ebe2bc',
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
