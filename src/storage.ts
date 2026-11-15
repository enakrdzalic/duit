import { nextColorId } from './colors'
import type { AppState, Category, Task } from './types'

const KEY = 'duit-v1'

export const emptyState = (): AppState => ({
  tasks: [],
  categories: [],
})

function storageKey(userId?: string | null): string {
  return userId ? `${KEY}:${userId}` : KEY
}

function migrateCategories(raw: unknown[]): Category[] {
  const used: string[] = []
  return raw.map((item) => {
    const c = item as Partial<Category> & { id?: string; name?: string }
    const colorId =
      typeof c.colorId === 'string' && c.colorId
        ? c.colorId
        : nextColorId(used)
    used.push(colorId)
    return {
      id: typeof c.id === 'string' ? c.id : crypto.randomUUID(),
      name: typeof c.name === 'string' ? c.name : 'untitled',
      colorId,
    }
  })
}

function migrateTasks(raw: unknown[]): Task[] {
  return raw.map((item) => {
    const t = item as Partial<Task>
    const status = t.status === 'done' ? 'done' : 'open'
    const completedOn =
      typeof t.completedOn === 'string' ? t.completedOn : null
    const onDay =
      typeof t.onDay === 'string'
        ? t.onDay
        : status === 'done'
          ? completedOn
          : null
    const rawNote = t.note
    const note =
      rawNote &&
      typeof rawNote === 'object' &&
      typeof (rawNote as { body?: unknown }).body === 'string'
        ? { body: (rawNote as { body: string }).body }
        : null
    return {
      id: typeof t.id === 'string' ? t.id : crypto.randomUUID(),
      text: typeof t.text === 'string' ? t.text : '',
      starred: Boolean(t.starred),
      recurring: Boolean(t.recurring),
      dueDate: typeof t.dueDate === 'string' ? t.dueDate : null,
      categoryId: typeof t.categoryId === 'string' ? t.categoryId : null,
      status,
      onDay,
      completedOn,
      note,
      createdAt: typeof t.createdAt === 'number' ? t.createdAt : Date.now(),
      order: typeof t.order === 'number' ? t.order : 0,
    }
  })
}

export function migrateState(raw: unknown): AppState {
  if (!raw || typeof raw !== 'object') return emptyState()
  const parsed = raw as Partial<AppState>
  if (!Array.isArray(parsed.tasks) || !Array.isArray(parsed.categories)) {
    return emptyState()
  }
  return {
    tasks: migrateTasks(parsed.tasks),
    categories: migrateCategories(parsed.categories),
  }
}

export function loadState(userId?: string | null): AppState {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) {
      // First login: seed from any pre-auth local data.
      if (userId) {
        const guest = localStorage.getItem(KEY)
        if (guest) return migrateState(JSON.parse(guest))
      }
      return emptyState()
    }
    return migrateState(JSON.parse(raw))
  } catch {
    return emptyState()
  }
}

export function saveState(state: AppState, userId?: string | null): void {
  localStorage.setItem(storageKey(userId), JSON.stringify(state))
}
