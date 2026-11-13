import {
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

type Props = {
  categoryId?: string | null
}

export function DaysPanel({ categoryId = null }: Props) {
  const { tasks, categories, completeTask, uncompleteTask, moveToDay } =
    useApp()
  const days = useMemo(() => dayWindow(14, 14), [])
  const today = useMemo(() => toISODate(), [])
  const [overDay, setOverDay] = useState<string | null>(null)
  const [showFutureHint, setShowFutureHint] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const todayRef = useRef<HTMLDivElement>(null)

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

  // Pin "today" to the top of the scroller after layout (once per mount/route).
  useLayoutEffect(() => {
    scrollToToday()
    const t0 = window.setTimeout(scrollToToday, 0)
    const t1 = window.setTimeout(scrollToToday, 100)
    return () => {
      window.clearTimeout(t0)
      window.clearTimeout(t1)
    }
  }, [days, categoryId])

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
    <aside className="days-panel">
      <header className="pane-header pane-header--days">
        <h2>days</h2>
        <p
          className={`days-panel__hint${showFutureHint ? ' is-visible' : ''}`}
          aria-hidden={!showFutureHint}
        >
          ↑ scroll for upcoming
        </p>
      </header>
      <div
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
                <p className="day-group__empty">
                  {future ? 'drop to schedule' : 'drop a task here'}
                </p>
              ) : (
                <ul className="day-group__list">
                  {items.map((task) => {
                    const done = task.status === 'done'
                    const cat = task.categoryId
                      ? categories.find((c) => c.id === task.categoryId)
                      : undefined
                    const catColor = cat ? colorById(cat.colorId) : null
                    return (
                      <li
                        key={task.id}
                        className={`day-item${done ? ' is-done' : ''}`}
                        draggable
                        onDragStart={(e) => onItemDragStart(e, task.id)}
                      >
                        <button
                          type="button"
                          className={`day-item__check${done ? ' is-done' : ''}`}
                          aria-label={done ? 'Uncheck task' : 'Complete task'}
                          title={done ? 'Uncheck' : 'Check off'}
                          onClick={() =>
                            done ? uncompleteTask(task.id) : completeTask(task.id, day)
                          }
                        />
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
                        {!categoryId && cat && catColor && (
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
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </aside>
  )
}
