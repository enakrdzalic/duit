import { useRef, useState, type KeyboardEvent, type DragEvent } from 'react'
import { colorById } from '../colors'
import { dueLabel } from '../dates'
import type { Category, HashCommand, Task } from '../types'
import { HashMenu } from './HashMenu'

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
  draggable?: boolean
  /** Hide the category pill (e.g. on a category page). */
  showCategoryTag?: boolean
  dropEdge?: 'before' | 'after' | null
  onDragTrack?: () => void
  onRowDragOver?: (e: DragEvent) => void
  onRowDragLeave?: () => void
  onRowDrop?: (e: DragEvent) => void
  onRowDragEnd?: () => void
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
  draggable = true,
  showCategoryTag = true,
  dropEdge = null,
  onDragTrack,
  onRowDragOver,
  onRowDragLeave,
  onRowDrop,
  onRowDragEnd,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [hashOpen, setHashOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [menuMode, setMenuMode] = useState<'commands' | 'due' | 'category'>(
    'commands',
  )
  const [menuLeft, setMenuLeft] = useState(0)

  const menuVisible = moreOpen || hashOpen

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
    if (
      target.closest('input, textarea, button, a, .hash-menu, .task-row__more-wrap')
    ) {
      e.preventDefault()
      return
    }
    onDragTrack?.()
    e.dataTransfer.setData('text/duit-task', task.id)
    e.dataTransfer.setData('text/plain', task.id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const category = task.categoryId
    ? categories.find((c) => c.id === task.categoryId)
    : undefined
  const categoryColor = category ? colorById(category.colorId) : null

  return (
    <div
      className={`task-row${task.starred ? ' task-row--starred' : ''}${menuVisible ? ' is-menu-open' : ''}${dropEdge === 'before' ? ' is-drop-before' : ''}${dropEdge === 'after' ? ' is-drop-after' : ''}`}
      draggable={draggable && !menuVisible}
      onDragStart={draggable ? onDragStart : undefined}
      onDragOver={onRowDragOver}
      onDragLeave={onRowDragLeave}
      onDrop={onRowDrop}
      onDragEnd={onRowDragEnd}
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
            draggable={false}
            onChange={(e) => onTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onMouseDown={(e) => e.stopPropagation()}
            spellCheck={false}
          />
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
      </div>
    </div>
  )
}
