import { useEffect, useRef } from 'react'
import { colorById } from '../colors'
import type { Category, HashCommand } from '../types'

type Props = {
  open: boolean
  anchorLeft?: number
  categories: Category[]
  mode: 'commands' | 'due' | 'category'
  starred?: boolean
  currentCategoryId?: string | null
  currentDueDate?: string | null
  onPickCommand: (cmd: HashCommand) => void
  onPickDue: (iso: string | null) => void
  onPickCategory: (id: string | null) => void
  onClose: () => void
  variant?: 'hash' | 'more'
}

const HASH_COMMANDS: { id: HashCommand; label: string; hint: string }[] = [
  { id: 'priority', label: '#priority', hint: 'Toggle priority' },
  { id: 'repeat', label: '#repeat', hint: 'Toggle recurring' },
  { id: 'due', label: '#due', hint: 'Set deadline' },
  { id: 'category', label: '#category', hint: 'Assign category' },
  { id: 'delete', label: '#delete', hint: 'Remove task' },
]

function moreCommands(starred: boolean): {
  id: HashCommand
  label: string
  hint: string
  danger?: boolean
}[] {
  return [
    {
      id: 'priority',
      label: starred ? 'Unpriority' : 'Priority',
      hint: starred ? 'Unpin from top' : 'Pin to top',
    },
    { id: 'due', label: 'Due date', hint: 'Deadline' },
    { id: 'repeat', label: 'Repeat', hint: 'Toggle recurring' },
    { id: 'category', label: 'Category', hint: 'Move to…' },
    { id: 'delete', label: 'Delete', hint: 'Remove task', danger: true },
  ]
}

export function HashMenu({
  open,
  anchorLeft = 0,
  categories,
  mode,
  starred = false,
  currentCategoryId = null,
  currentDueDate = null,
  onPickCommand,
  onPickDue,
  onPickCategory,
  onClose,
  variant = 'hash',
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const commands =
    variant === 'more' ? moreCommands(starred) : HASH_COMMANDS

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    // Native date pickers render outside the menu DOM; closing on
    // mousedown while choosing a date would cancel the selection.
    const onPointer = (e: MouseEvent) => {
      if (mode === 'due') return
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onPointer)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousedown', onPointer)
    }
  }, [open, onClose, mode])

  if (!open) return null

  return (
    <div
      ref={ref}
      className={`hash-menu${variant === 'more' ? ' hash-menu--more' : ''}`}
      style={variant === 'hash' ? { left: Math.max(8, anchorLeft) } : undefined}
      role="listbox"
      onMouseDown={(e) => e.stopPropagation()}
    >
      {mode === 'commands' &&
        commands.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`hash-menu__item${'danger' in c && c.danger ? ' is-danger' : ''}`}
            role="option"
            onMouseDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onPickCommand(c.id)
            }}
          >
            <span>{c.label}</span>
            <span className="hash-menu__hint">{c.hint}</span>
          </button>
        ))}

      {mode === 'due' && (
        <>
          <label className="hash-menu__due">
            <span>Due date</span>
            <input
              type="date"
              autoFocus
              defaultValue={currentDueDate ?? ''}
              onMouseDown={(e) => e.stopPropagation()}
              onChange={(e) => {
                if (e.target.value) onPickDue(e.target.value)
              }}
            />
          </label>
          {currentDueDate && (
            <p className="hash-menu__current">
              Current: {currentDueDate}
            </p>
          )}
          <button
            type="button"
            className="hash-menu__item"
            onMouseDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onPickDue(null)
            }}
          >
            Clear due date
          </button>
          <button
            type="button"
            className="hash-menu__item hash-menu__item--muted"
            onMouseDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onClose()
            }}
          >
            Cancel
          </button>
        </>
      )}

      {mode === 'category' && (
        <>
          <button
            type="button"
            className={`hash-menu__item${!currentCategoryId ? ' is-selected' : ''}`}
            onMouseDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onPickCategory(null)
            }}
          >
            No category
          </button>
          {categories.map((cat) => {
            const color = colorById(cat.colorId)
            return (
              <button
                key={cat.id}
                type="button"
                className={`hash-menu__item${currentCategoryId === cat.id ? ' is-selected' : ''}`}
                onMouseDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onPickCategory(cat.id)
                }}
              >
                <span className="hash-menu__cat">
                  <i style={{ background: color.folder }} />
                  {cat.name}
                </span>
                {currentCategoryId === cat.id && (
                  <span className="hash-menu__hint">current</span>
                )}
              </button>
            )
          })}
          {categories.length === 0 && (
            <p className="hash-menu__empty">
              Create a category with + new on the tabs first
            </p>
          )}
        </>
      )}
    </div>
  )
}
