const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

/** Local calendar date as YYYY-MM-DD */
export function toISODate(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(iso: string, delta: number): string {
  const d = parseISODate(iso)
  d.setDate(d.getDate() + delta)
  return toISODate(d)
}

/** Today + previous (count - 1) days, newest first */
export function rollingDayWindow(count = 14): string[] {
  const today = toISODate()
  return Array.from({ length: count }, (_, i) => addDays(today, -i))
}

/**
 * Upcoming → today → past (top to bottom).
 * Start scrolled to today; scroll up for future days.
 */
export function dayWindow(past = 14, future = 14): string[] {
  const today = toISODate()
  const days: string[] = []
  for (let i = future; i >= -past; i--) {
    days.push(addDays(today, i))
  }
  return days
}

export function formatDayHeading(iso: string, today = toISODate()): string {
  if (iso === today) return 'today'
  if (iso === addDays(today, -1)) return 'yesterday'
  if (iso === addDays(today, 1)) return 'tomorrow'
  const d = parseISODate(iso)
  return `${WEEKDAYS[d.getDay()]} ${MONTHS[d.getMonth()]} ${d.getDate()}`
}

export function isFutureDay(iso: string, today = toISODate()): boolean {
  return iso > today
}

export function formatShortDate(iso: string): string {
  const d = parseISODate(iso)
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`
}

export function dueLabel(dueDate: string, today = toISODate()): string {
  const short = formatShortDate(dueDate)
  const due = parseISODate(dueDate)
  const now = parseISODate(today)
  const diff = Math.round((due.getTime() - now.getTime()) / 86_400_000)

  if (diff === 0) return `(${short} ✦ Today)`
  if (diff === 1) return `(${short} ✦ In 1 day)`
  if (diff > 1) return `(${short} ✦ In ${diff} days)`
  if (diff === -1) return `(${short} ✦ 1 day overdue)`
  return `(${short} ✦ ${Math.abs(diff)} days overdue)`
}

export function uid(): string {
  return crypto.randomUUID()
}
