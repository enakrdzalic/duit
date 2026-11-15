import {
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
  type KeyboardEvent,
  type MouseEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { colorById } from '../colors'
import { useApp } from '../context/AppContext'

const MOBILE_MQ = '(max-width: 760px)'

export function CategoryBar() {
  const { categories, addCategory, renameCategory, reorderCategories } = useApp()
  const { categoryId } = useParams()
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(MOBILE_MQ).matches : false,
  )
  const draggingId = useRef<string | null>(null)
  const didDrag = useRef(false)
  const tabsRef = useRef<HTMLElement>(null)
  const createInputRef = useRef<HTMLInputElement>(null)
  const createFormRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ)
    const sync = () => setIsMobile(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  // Keep the active category tab visible when the strip scrolls on mobile.
  useEffect(() => {
    const root = tabsRef.current
    if (!root) return
    const active = root.querySelector('.folder-tab.is-active')
    if (active instanceof HTMLElement) {
      active.scrollIntoView({
        inline: 'nearest',
        block: 'nearest',
        behavior: 'smooth',
      })
    }
  }, [categoryId, editingId])

  useEffect(() => {
    if (!creating) return
    if (!isMobile) {
      createFormRef.current?.scrollIntoView({
        inline: 'nearest',
        block: 'nearest',
      })
    }
    const id = window.setTimeout(() => {
      createInputRef.current?.focus({ preventScroll: true })
    }, 40)
    return () => window.clearTimeout(id)
  }, [creating, isMobile])

  const cancelCreate = () => {
    setCreating(false)
    setName('')
  }

  useEffect(() => {
    if (!creating || !isMobile) return
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCreating(false)
        setName('')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [creating, isMobile])

  const finishCreate = (raw: string) => {
    const trimmed = raw.trim()
    if (!trimmed) return false
    const cat = addCategory(trimmed)
    setName('')
    setCreating(false)
    navigate(`/c/${cat.id}`)
    return true
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    finishCreate(name)
  }

  const startEdit = (id: string, current: string) => {
    setEditingId(id)
    setEditName(current)
  }

  const commitEdit = () => {
    if (editingId) {
      renameCategory(editingId, editName.trim() || 'untitled')
    }
    setEditingId(null)
  }

  const onEditKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitEdit()
    }
    if (e.key === 'Escape') setEditingId(null)
  }

  const onTabClick = (
    e: MouseEvent<HTMLAnchorElement>,
    id: string,
    current: string,
    active: boolean,
  ) => {
    if (didDrag.current) {
      e.preventDefault()
      didDrag.current = false
      return
    }
    if (active) {
      e.preventDefault()
      startEdit(id, current)
    }
  }

  const onDragStart = (e: DragEvent, id: string) => {
    draggingId.current = id
    didDrag.current = false
    e.dataTransfer.setData('text/duit-category', id)
    e.dataTransfer.setData('text/plain', id)
    e.dataTransfer.effectAllowed = 'move'
    if (e.currentTarget instanceof HTMLElement) {
      e.dataTransfer.setDragImage(e.currentTarget, 20, 16)
    }
  }

  const onDragOver = (e: DragEvent, id: string) => {
    if (!draggingId.current || draggingId.current === id) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverId(id)
    didDrag.current = true
  }

  const onDrop = (e: DragEvent, id: string) => {
    e.preventDefault()
    const fromId =
      e.dataTransfer.getData('text/duit-category') ||
      draggingId.current ||
      e.dataTransfer.getData('text/plain')
    setDragOverId(null)
    draggingId.current = null
    if (fromId && fromId !== id) {
      reorderCategories(fromId, id)
      didDrag.current = true
    }
  }

  const onDragEnd = () => {
    setDragOverId(null)
    draggingId.current = null
  }

  const createFields = (
    <>
      <label className="cat-create__label" htmlFor="cat-create-name">
        Category name
      </label>
      <input
        id="cat-create-name"
        ref={createInputRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. errands"
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault()
            cancelCreate()
          }
        }}
        spellCheck={false}
        enterKeyHint="done"
        autoComplete="off"
        autoCorrect="off"
      />
      <div className="cat-create__actions">
        <button type="button" className="cat-create__cancel" onClick={cancelCreate}>
          Cancel
        </button>
        <button
          type="submit"
          className="cat-create__submit"
          disabled={!name.trim()}
        >
          Add category
        </button>
      </div>
    </>
  )

  return (
    <nav ref={tabsRef} className="folder-tabs" aria-label="Categories">
      <Link
        to="/"
        className={`folder-tab folder-tab--home${!categoryId ? ' is-active' : ''}`}
      >
        home
      </Link>
      {categories.map((cat) => {
        const color = colorById(cat.colorId)
        const active = categoryId === cat.id
        if (editingId === cat.id) {
          return (
            <form
              key={cat.id}
              className="folder-tab folder-tab--form is-active"
              style={{
                background: color.folder,
                color: 'rgba(31, 26, 22, 0.75)',
              }}
              onSubmit={(e) => {
                e.preventDefault()
                commitEdit()
              }}
            >
              <span className="folder-tab__sizer" aria-hidden>
                {editName || ' '}
              </span>
              <input
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={onEditKey}
                aria-label="Rename category"
                spellCheck={false}
                enterKeyHint="done"
              />
            </form>
          )
        }
        return (
          <Link
            key={cat.id}
            to={`/c/${cat.id}`}
            draggable={!isMobile}
            className={`folder-tab${active ? ' is-active' : ''}${dragOverId === cat.id ? ' is-drag-over' : ''}`}
            style={{
              background: active ? color.folder : color.tab,
              color: active
                ? 'rgba(31, 26, 22, 0.72)'
                : 'rgba(255, 255, 255, 0.9)',
              cursor: active ? 'text' : 'grab',
            }}
            onClick={(e) => onTabClick(e, cat.id, cat.name, active)}
            onDragStart={(e) => onDragStart(e, cat.id)}
            onDragOver={(e) => onDragOver(e, cat.id)}
            onDragLeave={() =>
              setDragOverId((id) => (id === cat.id ? null : id))
            }
            onDrop={(e) => onDrop(e, cat.id)}
            onDragEnd={onDragEnd}
            title={active ? 'Click to rename · drag to reorder' : 'Drag to reorder'}
          >
            {cat.name}
          </Link>
        )
      })}

      {creating && !isMobile ? (
        <form
          ref={createFormRef}
          className="folder-tab folder-tab--form folder-tab--create"
          onSubmit={submit}
        >
          <input
            ref={createInputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="name…"
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault()
                cancelCreate()
              }
            }}
            spellCheck={false}
            enterKeyHint="done"
            aria-label="New category name"
          />
          <button
            type="submit"
            className="folder-tab__add"
            disabled={!name.trim()}
          >
            Add
          </button>
          <button
            type="button"
            className="folder-tab__cancel"
            onClick={cancelCreate}
            aria-label="Cancel"
          >
            ×
          </button>
        </form>
      ) : (
        <button
          type="button"
          className="folder-tab folder-tab--new"
          onClick={() => setCreating(true)}
        >
          + new
        </button>
      )}

      {creating &&
        isMobile &&
        createPortal(
          <div
            className="cat-create-overlay"
            role="presentation"
            onClick={cancelCreate}
          >
            <form
              className="cat-create-sheet"
              role="dialog"
              aria-modal="true"
              aria-labelledby="cat-create-title"
              onClick={(e) => e.stopPropagation()}
              onSubmit={submit}
            >
              <div className="cat-create-sheet__top">
                <h2 id="cat-create-title">New category</h2>
                <button
                  type="button"
                  className="cat-create-sheet__close"
                  onClick={cancelCreate}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              {createFields}
            </form>
          </div>,
          document.body,
        )}
    </nav>
  )
}
