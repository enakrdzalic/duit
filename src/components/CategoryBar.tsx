import {
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
  type KeyboardEvent,
  type MouseEvent,
} from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { colorById } from '../colors'
import { useApp } from '../context/AppContext'

export function CategoryBar() {
  const { categories, addCategory, renameCategory, reorderCategories } = useApp()
  const { categoryId } = useParams()
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const draggingId = useRef<string | null>(null)
  const didDrag = useRef(false)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const cat = addCategory(name)
    setName('')
    setCreating(false)
    navigate(`/c/${cat.id}`)
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
    // Avoid the browser using the whole link chrome as a giant ghost
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

  return (
    <nav className="folder-tabs" aria-label="Categories">
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
              />
            </form>
          )
        }
        return (
          <Link
            key={cat.id}
            to={`/c/${cat.id}`}
            draggable
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
      {creating ? (
        <form className="folder-tab folder-tab--form" onSubmit={submit}>
          <span className="folder-tab__sizer" aria-hidden>
            {name || 'name…'}
          </span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="name…"
            onBlur={() => {
              if (!name.trim()) setCreating(false)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setCreating(false)
                setName('')
              }
            }}
            spellCheck={false}
          />
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
    </nav>
  )
}
