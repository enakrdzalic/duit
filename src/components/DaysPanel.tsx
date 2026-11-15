import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type UIEvent,
} from 'react'
import { colorById } from '../colors'
import { useApp } from '../context/AppContext'
import {
  dayWindow,
  dueLabel,
  formatDayHeading,
  isFutureDay,
  toISODate,
} from '../dates'
import type { Category, HashCommand, Task } from '../types'
import { HashMenu } from './HashMenu'
import { StickyNote } from './StickyNote'

type Props = {
  categoryId?: string | null
}

type DayTaskItemProps = {
  task: Task
  showCategory: boolean
  categories: Category[]
  onComplete: () => void
  onUncomplete: () => void
  onDragStart: (e: DragEvent, id: string) => void
}

const COLLAPSE_KEY = 'duit-days-collapsed'

function readCollapsed(): boolean {
  try {
    const raw = localStorage.getItem(COLLAPSE_KEY)
    if (raw === '1') return true
    if (raw === '0') return false
  } catch {
    /* ignore */
  }
  // First visit on a narrow screen: start minimized so todos get the room.
  if (typeof window !== 'undefined' && window.matchMedia('(max-width: 760px)').matches) {
    return true
  }
  return false
}

function DayTaskItem({
  task,
  showCategory,
  categories,
  onComplete,
  onUncomplete,
  onDragStart,
}: DayTaskItemProps) {
  const {
    setTaskNote,
    setDueDate,
    setCategory,
    toggleStar,
    toggleRecurring,
    deleteTask,
  } = useApp()
  const [noteOpen, setNoteOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [menuMode, setMenuMode] = useState<'commands' | 'due' | 'category'>(
    'commands',
  )
  const done = task.status === 'done'
  const hasNote = Boolean(task.note)
  const menuVisible = moreOpen || noteOpen
  const cat = task.categoryId
    ? categories.find((c) => c.id === task.categoryId)
    : undefined
  const catColor = cat ? colorById(cat.colorId) : null

  const openNote = () => {
    if (!task.note) setTaskNote(task.id, { body: '' })
    setMoreOpen(false)
    setMenuMode('commands')
    setNoteOpen(true)
  }

  const handlePickCommand = (cmd: HashCommand) => {
    if (cmd === 'priority') {
      toggleStar(task.id)
      setMoreOpen(false)
      return
    }
    if (cmd === 'repeat') {
      toggleRecurring(task.id)
      setMoreOpen(false)
      return
    }
    if (cmd === 'note') {
      openNote()
      return
    }
    if (cmd === 'delete') {
      deleteTask(task.id)
      setMoreOpen(false)
      return
    }
    if (cmd === 'due') {
      setMenuMode('due')
      return
    }
    if (cmd === 'category') {
      setMenuMode('category')
      return
    }
  }

  return (
    <li
      className={`day-item${done ? ' is-done' : ''}${menuVisible ? ' is-menu-open' : ''}`}
      draggable={!menuVisible}
      onDragStart={(e) => onDragStart(e, task.id)}
    >
      <button
        type="button"
        className={`day-item__check${done ? ' is-done' : ''}`}
        aria-label={done ? 'Uncheck task' : 'Complete task'}
        title={done ? 'Uncheck' : 'Check off'}
        onClick={() => (done ? onUncomplete() : onComplete())}
      />
      <div className="day-item__body">
        <div className="day-item__line">
          <span className="day-item__text">{task.text}</span>
          {task.recurring && (
            <span className="task-row__badge" title="Recurring">
              ↻
            </span>
          )}
          {task.dueDate && (
            <span
              className={`task-row__due${dueLabel(task.dueDate).includes('overdue') ? ' is-late' : ''}`}
            >
              {dueLabel(task.dueDate)}
            </span>
          )}
          {showCategory && cat && catColor && (
            <span
              className="task-row__cat"
              style={{
                background: catColor.folder,
                boxShadow: `inset 0 0 0 1px ${catColor.tab}`,
              }}
            >
              {cat.name}
            </span>
          )}
          {hasNote && (
            <button
              type="button"
              className={`task-row__note-icon${noteOpen ? ' is-open' : ''}`}
              aria-label={noteOpen ? 'Hide sticky note' : 'Show sticky note'}
              title="Sticky note"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                setNoteOpen((v) => !v)
              }}
            >
              ▤
            </button>
          )}
          <div className="task-row__more-wrap">
            <button
              type="button"
              className={`task-row__more${moreOpen ? ' is-open' : ''}`}
              aria-label="Task options"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                if (moreOpen) {
                  setMoreOpen(false)
                  setMenuMode('commands')
                } else {
                  setMenuMode('commands')
                  setMoreOpen(true)
                }
              }}
            >
              ⋯
            </button>
            <HashMenu
              open={moreOpen}
              categories={categories}
              mode={menuMode}
              variant="more"
              starred={task.starred}
              hasNote={hasNote}
              currentCategoryId={task.categoryId}
              currentDueDate={task.dueDate}
              onPickCommand={handlePickCommand}
              onPickDue={(iso) => {
                setDueDate(task.id, iso)
                setMoreOpen(false)
                setMenuMode('commands')
              }}
              onPickCategory={(id) => {
                setCategory(task.id, id)
                setMoreOpen(false)
                setMenuMode('commands')
              }}
              onClose={() => {
                setMoreOpen(false)
                setMenuMode('commands')
              }}
            />
          </div>
        </div>
        {noteOpen && (
          <StickyNote
            body={task.note?.body ?? ''}
            autoFocus={!task.note?.body?.trim()}
            onChange={(body) => setTaskNote(task.id, { body })}
            onClose={() => setNoteOpen(false)}
            onRemove={() => {
              setTaskNote(task.id, null)
              setNoteOpen(false)
            }}
          />
        )}
      </div>
    </li>
  )
}

export function DaysPanel({ categoryId = null }: Props) {
  const { tasks, categories, completeTask, uncompleteTask, moveToDay } =
    useApp()
  const days = useMemo(() => dayWindow(14, 14), [])
  const today = useMemo(() => toISODate(), [])
  const [overDay, setOverDay] = useState<string | null>(null)
  const [showFutureHint, setShowFutureHint] = useState(true)
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(max-width: 760px)').matches
      : false,
  )
  const scrollRef = useRef<HTMLDivElement>(null)
  const todayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 760px)')
    const sync = () => setIsMobile(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (!isMobile) return
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [collapsed, isMobile])

  // Minimize only applies on narrow layouts.
  const minimized = isMobile && collapsed

  const tasksByDay = useMemo(() => {
    const map = new Map<string, typeof tasks>()
    for (const day of days) map.set(day, [])
    for (const task of tasks) {
      if (!task.onDay) continue
      if (categoryId && task.categoryId !== categoryId) continue
      map.get(task.onDay)?.push(task)
    }
    for (const list of map.values()) {
      list.sort((a, b) => {
        // Unchecked first, then newest
        if (a.status !== b.status) return a.status === 'open' ? -1 : 1
        return b.createdAt - a.createdAt
      })
    }
    return map
  }, [tasks, days, categoryId])

  const scrollToToday = () => {
    const scroller = scrollRef.current
    const todayEl = todayRef.current
    if (!scroller || !todayEl) return
    const delta =
      todayEl.getBoundingClientRect().top - scroller.getBoundingClientRect().top
    scroller.scrollTop += delta
  }

  // Pin "today" to the top of the scroller after layout / expand.
  useLayoutEffect(() => {
    if (minimized) return
    scrollToToday()
    const t0 = window.setTimeout(scrollToToday, 0)
    const t1 = window.setTimeout(scrollToToday, 100)
    return () => {
      window.clearTimeout(t0)
      window.clearTimeout(t1)
    }
  }, [days, categoryId, minimized])

  const onScroll = (e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const todayEl = todayRef.current
    if (!todayEl) return
    const todayOffset =
      todayEl.getBoundingClientRect().top - el.getBoundingClientRect().top
    setShowFutureHint(todayOffset <= 16)
  }

  const onDragOver = (e: DragEvent, day: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setOverDay(day)
  }

  const onPanelDragOver = (e: DragEvent) => {
    if (!minimized) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setCollapsed(false)
  }

  const onDrop = (e: DragEvent, day: string) => {
    e.preventDefault()
    setOverDay(null)
    const id =
      e.dataTransfer.getData('text/duit-task') ||
      e.dataTransfer.getData('text/plain')
    if (!id) return
    const task = tasks.find((t) => t.id === id)
    if (!task) return
    moveToDay(id, day)
  }

  const onItemDragStart = (e: DragEvent, id: string) => {
    e.dataTransfer.setData('text/duit-task', id)
    e.dataTransfer.setData('text/plain', id)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <aside
      className={`days-panel${minimized ? ' is-collapsed' : ''}`}
      onDragOver={onPanelDragOver}
    >
      <header className="pane-header pane-header--days">
        <h2>days</h2>
        <div className="days-panel__trailing">
          <p
            className={`days-panel__hint${showFutureHint && !minimized ? ' is-visible' : ''}`}
            aria-hidden={minimized || !showFutureHint}
          >
            ↑ scroll for upcoming
          </p>
          {isMobile && (
            <button
              type="button"
              className="days-panel__toggle"
              aria-expanded={!minimized}
              aria-controls="days-panel-scroll"
              title={minimized ? 'Expand days' : 'Minimize days'}
              onClick={() => setCollapsed((v) => !v)}
            >
              {minimized ? 'expand' : 'minimize'}
            </button>
          )}
        </div>
      </header>
      {!minimized && (
        <div
          id="days-panel-scroll"
          className="days-panel__scroll"
          ref={scrollRef}
          onScroll={onScroll}
        >
          {days.map((day) => {
            const items = tasksByDay.get(day) ?? []
            const future = isFutureDay(day, today)
            const isToday = day === today
            return (
              <div
                key={day}
                ref={isToday ? todayRef : undefined}
                className={`day-group${overDay === day ? ' is-drop' : ''}${items.length === 0 ? ' is-empty' : ''}${future ? ' is-future' : ''}${isToday ? ' is-today' : ''}`}
                onDragOver={(e) => onDragOver(e, day)}
                onDragLeave={() => setOverDay((d) => (d === day ? null : d))}
                onDrop={(e) => onDrop(e, day)}
              >
                <h3 className="day-group__title">{formatDayHeading(day)}</h3>
                {items.length === 0 ? (
                  <p className="day-group__empty">nothing to see here…</p>
                ) : (
                  <ul className="day-group__list">
                    {items.map((task) => (
                      <DayTaskItem
                        key={task.id}
                        task={task}
                        showCategory={!categoryId}
                        categories={categories}
                        onComplete={() => completeTask(task.id, day)}
                        onUncomplete={() => uncompleteTask(task.id)}
                        onDragStart={onItemDragStart}
                      />
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      )}
    </aside>
  )
}
