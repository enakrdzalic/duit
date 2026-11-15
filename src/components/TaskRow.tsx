import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type DragEvent,
  type TouchEvent as ReactTouchEvent,
} from 'react'
import { colorById } from '../colors'
import { dueLabel } from '../dates'
import type { Category, HashCommand, Task, TaskNote } from '../types'
import { HashMenu } from './HashMenu'
import { StickyNote } from './StickyNote'

const TOUCH_LONG_PRESS_MS = 360
const TOUCH_MOVE_CANCEL_PX = 12
const INTERACTIVE_SEL =
  'input, textarea, button, a, .hash-menu, .task-row__more-wrap, .sticky-note'

type Props = {
  task: Task
  categories: Category[]
  onTextChange: (text: string) => void
  onDelete: () => void
  onToggleStar: () => void
  onComplete: () => void
  onToggleRecurring: () => void
  onSetDue: (iso: string | null) => void
  onSetCategory: (id: string | null) => void
  onSetNote: (note: TaskNote | null) => void
  draggable?: boolean
  /** Hide the category pill (e.g. on a category page). */
  showCategoryTag?: boolean
  dropEdge?: 'before' | 'after' | null
  touchDragging?: boolean
  onDragTrack?: () => void
  onRowDragOver?: (e: DragEvent) => void
  onRowDragLeave?: () => void
  onRowDrop?: (e: DragEvent) => void
  onRowDragEnd?: () => void
  onTouchDragStart?: () => void
}

export function TaskRow({
  task,
  categories,
  onTextChange,
  onDelete,
  onToggleStar,
  onComplete,
  onToggleRecurring,
  onSetDue,
  onSetCategory,
  onSetNote,
  draggable = true,
  showCategoryTag = true,
  dropEdge = null,
  touchDragging = false,
  onDragTrack,
  onRowDragOver,
  onRowDragLeave,
  onRowDrop,
  onRowDragEnd,
  onTouchDragStart,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const longPressTimer = useRef<number | null>(null)
  const touchOrigin = useRef<{ x: number; y: number } | null>(null)
  const [hashOpen, setHashOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  const [menuMode, setMenuMode] = useState<'commands' | 'due' | 'category'>(
    'commands',
  )
  const [menuLeft, setMenuLeft] = useState(0)

  const clearLongPress = () => {
    if (longPressTimer.current != null) {
      window.clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    touchOrigin.current = null
  }

  useEffect(() => () => clearLongPress(), [])

  const hasNote = Boolean(task.note)
  const menuVisible = moreOpen || hashOpen || noteOpen

  const openHashMenu = () => {
    const el = inputRef.current
    if (!el) return
    const mirror = document.createElement('span')
    mirror.style.cssText =
      'position:absolute;visibility:hidden;white-space:pre;font:inherit'
    mirror.textContent = el.value.slice(0, el.selectionStart ?? el.value.length)
    el.parentElement?.appendChild(mirror)
    setMenuLeft(el.offsetLeft + mirror.offsetWidth)
    mirror.remove()
    setMenuMode('commands')
    setMoreOpen(false)
    setHashOpen(true)
  }

  const openMoreMenu = () => {
    setMenuMode('commands')
    setHashOpen(false)
    setMoreOpen(true)
  }

  const openNote = () => {
    if (!task.note) onSetNote({ body: '' })
    setHashOpen(false)
    setMoreOpen(false)
    setMenuMode('commands')
    setNoteOpen(true)
  }

  const stripHashToken = () => {
    const el = inputRef.current
    if (!el) return
    const pos = el.selectionStart ?? el.value.length
    const before = el.value.slice(0, pos)
    const after = el.value.slice(pos)
    const cleaned = before.replace(/#$/, '')
    onTextChange(cleaned + after)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && task.text === '') {
      e.preventDefault()
      onDelete()
      return
    }
    if (e.key === '#') {
      requestAnimationFrame(() => openHashMenu())
    }
    if (e.key === 'Escape') {
      setHashOpen(false)
      setMoreOpen(false)
      setNoteOpen(false)
    }
  }

  const handlePickCommand = (cmd: HashCommand, fromHash: boolean) => {
    if (fromHash) stripHashToken()
    if (cmd === 'priority') {
      onToggleStar()
      setHashOpen(false)
      setMoreOpen(false)
      return
    }
    if (cmd === 'repeat') {
      onToggleRecurring()
      setHashOpen(false)
      setMoreOpen(false)
      return
    }
    if (cmd === 'note') {
      openNote()
      return
    }
    if (cmd === 'delete') {
      onDelete()
      setHashOpen(false)
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

  const onDragStart = (e: DragEvent) => {
    const target = e.target as HTMLElement
    if (target.closest(INTERACTIVE_SEL)) {
      e.preventDefault()
      return
    }
    onDragTrack?.()
    e.dataTransfer.setData('text/duit-task', task.id)
    e.dataTransfer.setData('text/plain', task.id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const onTouchStart = (e: ReactTouchEvent) => {
    if (!draggable || menuVisible || !onTouchDragStart) return
    if ((e.target as HTMLElement).closest(INTERACTIVE_SEL)) return
    if (e.touches.length !== 1) return
    const t = e.touches[0]
    touchOrigin.current = { x: t.clientX, y: t.clientY }
    clearLongPress()
    longPressTimer.current = window.setTimeout(() => {
      longPressTimer.current = null
      touchOrigin.current = null
      onTouchDragStart()
    }, TOUCH_LONG_PRESS_MS)
  }

  const onTouchMove = (e: ReactTouchEvent) => {
    if (longPressTimer.current == null || !touchOrigin.current) return
    const t = e.touches[0]
    if (!t) return
    const dx = t.clientX - touchOrigin.current.x
    const dy = t.clientY - touchOrigin.current.y
    if (dx * dx + dy * dy > TOUCH_MOVE_CANCEL_PX * TOUCH_MOVE_CANCEL_PX) {
      clearLongPress()
    }
  }

  const category = task.categoryId
    ? categories.find((c) => c.id === task.categoryId)
    : undefined
  const categoryColor = category ? colorById(category.colorId) : null

  return (
    <div
      data-task-id={task.id}
      className={`task-row${task.starred ? ' task-row--starred' : ''}${menuVisible ? ' is-menu-open' : ''}${dropEdge === 'before' ? ' is-drop-before' : ''}${dropEdge === 'after' ? ' is-drop-after' : ''}${touchDragging ? ' is-touch-dragging' : ''}`}
      draggable={draggable && !menuVisible}
      onDragStart={draggable ? onDragStart : undefined}
      onDragOver={onRowDragOver}
      onDragLeave={onRowDragLeave}
      onDrop={onRowDrop}
      onDragEnd={onRowDragEnd}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={clearLongPress}
      onTouchCancel={clearLongPress}
    >
      <button
        type="button"
        className="task-row__check"
        aria-label="Complete task"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={onComplete}
      />
      <div className="task-row__body">
        <div className="task-row__line">
          <input
            ref={inputRef}
            className="task-row__input"
            value={task.text}
            size={Math.max(task.text.length, 1)}
            draggable={false}
            onChange={(e) => onTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onMouseDown={(e) => e.stopPropagation()}
            spellCheck={false}
          />
          {/* Fills leftover row width so grab cursor shows past the text */}
          <span className="task-row__grip" aria-hidden />
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
          {showCategoryTag && category && categoryColor && (
            <span
              className="task-row__cat"
              style={{
                background: categoryColor.folder,
                boxShadow: `inset 0 0 0 1px ${categoryColor.tab}`,
              }}
            >
              {category.name}
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
                } else openMoreMenu()
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
              onPickCommand={(cmd) => handlePickCommand(cmd, false)}
              onPickDue={(iso) => {
                onSetDue(iso)
                setMoreOpen(false)
                setMenuMode('commands')
              }}
              onPickCategory={(id) => {
                onSetCategory(id)
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
        <HashMenu
          open={hashOpen}
          anchorLeft={menuLeft}
          categories={categories}
          mode={menuMode}
          starred={task.starred}
          hasNote={hasNote}
          currentCategoryId={task.categoryId}
          currentDueDate={task.dueDate}
          onPickCommand={(cmd) => handlePickCommand(cmd, true)}
          onPickDue={(iso) => {
            stripHashToken()
            onSetDue(iso)
            setHashOpen(false)
            setMenuMode('commands')
          }}
          onPickCategory={(id) => {
            stripHashToken()
            onSetCategory(id)
            setHashOpen(false)
            setMenuMode('commands')
          }}
          onClose={() => {
            setHashOpen(false)
            setMenuMode('commands')
          }}
        />
        {noteOpen && (
          <StickyNote
            body={task.note?.body ?? ''}
            autoFocus={!task.note?.body?.trim()}
            onChange={(body) => onSetNote({ body })}
            onClose={() => setNoteOpen(false)}
            onRemove={() => {
              onSetNote(null)
              setNoteOpen(false)
            }}
          />
        )}
      </div>
    </div>
  )
}
