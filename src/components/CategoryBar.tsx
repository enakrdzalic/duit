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
  const [fadeLeft, setFadeLeft] = useState(false)
  const [fadeRight, setFadeRight] = useState(false)
  const draggingId = useRef<string | null>(null)
  const didDrag = useRef(false)
  const tabsRef = useRef<HTMLElement>(null)
  const createInputRef = useRef<HTMLInputElement>(null)
  const createFormRef = useRef<HTMLFormElement>(null)
  const createOverlayRef = useRef<HTMLDivElement>(null)

  const updateTabFades = () => {
    const root = tabsRef.current
    if (!root) {
      setFadeLeft(false)
      setFadeRight(false)
      return
    }
    const max = root.scrollWidth - root.clientWidth
    if (max <= 2) {
      setFadeLeft(false)
      setFadeRight(false)
      return
    }
    setFadeLeft(root.scrollLeft > 2)
    setFadeRight(root.scrollLeft < max - 2)
  }

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ)
    const sync = () => setIsMobile(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  // Keep the active category tab visible inside the scroll lane.
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
    updateTabFades()
  }, [categoryId, editingId, categories.length, creating])

  useEffect(() => {
    const root = tabsRef.current
    if (!root) return
    updateTabFades()
    const onScroll = () => updateTabFades()
    root.addEventListener('scroll', onScroll, { passive: true })
    const ro = new ResizeObserver(() => updateTabFades())
    ro.observe(root)
    window.addEventListener('resize', updateTabFades)
    return () => {
      root.removeEventListener('scroll', onScroll)
      ro.disconnect()
      window.removeEventListener('resize', updateTabFades)
    }
  }, [categories.length])

  useEffect(() => {
    if (!creating) return
    // Keep scroll inside the tab lane only — never scroll the page
    // (scrollIntoView was shifting the whole folder up).
    if (!isMobile) {
      const form = createFormRef.current
      const root = tabsRef.current
      if (form && root) {
        const left = form.offsetLeft
        const right = left + form.offsetWidth
        if (right > root.scrollLeft + root.clientWidth) {
          root.scrollLeft = right - root.clientWidth
        } else if (left < root.scrollLeft) {
          root.scrollLeft = left
        }
      }
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

  // Lock the page + pin the sheet to the visual viewport so the mobile
  // keyboard can't shove the whole app up when the create field focuses.
  useEffect(() => {
    if (!creating || !isMobile) return

    const scrollY = window.scrollY
    const { documentElement: html, body } = document
    const prev = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyWidth: body.style.width,
      bodyLeft: body.style.left,
    }

    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.left = '0'
    body.style.width = '100%'

    const syncOverlay = () => {
      const overlay = createOverlayRef.current
      const vv = window.visualViewport
      if (!overlay || !vv) return
      overlay.style.top = `${vv.offsetTop}px`
      overlay.style.left = `${vv.offsetLeft}px`
      overlay.style.width = `${vv.width}px`
      overlay.style.height = `${vv.height}px`
    }

    const pinScroll = () => {
      if (window.scrollY !== 0) window.scrollTo(0, 0)
    }

    syncOverlay()
    const vv = window.visualViewport
    vv?.addEventListener('resize', syncOverlay)
    vv?.addEventListener('scroll', syncOverlay)
    window.addEventListener('scroll', pinScroll, { passive: true })

    const focusId = window.setTimeout(() => {
      createInputRef.current?.focus({ preventScroll: true })
      syncOverlay()
      pinScroll()
    }, 50)

    return () => {
      window.clearTimeout(focusId)
      vv?.removeEventListener('resize', syncOverlay)
      vv?.removeEventListener('scroll', syncOverlay)
      window.removeEventListener('scroll', pinScroll)
      html.style.overflow = prev.htmlOverflow
      body.style.overflow = prev.bodyOverflow
      body.style.position = prev.bodyPosition
      body.style.top = prev.bodyTop
      body.style.left = prev.bodyLeft
      body.style.width = prev.bodyWidth
      window.scrollTo(0, scrollY)
    }
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
    <div
      className={`folder-tabs-wrap${fadeLeft ? ' has-fade-left' : ''}${fadeRight ? ' has-fade-right' : ''}`}
    >
    <nav ref={tabsRef} className="folder-tabs" aria-label="Categories">
      <Link
        to="/"
        className={`folder-tab folder-tab--home${!categoryId ? ' is-active' : ''}`}
      >
        Home
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
          className="folder-tab folder-tab--form"
          onSubmit={submit}
        >
          <span className="folder-tab__sizer" aria-hidden>
            {name || 'name…'}
          </span>
          <input
            ref={createInputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="name…"
            onBlur={() => {
              if (!name.trim()) cancelCreate()
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault()
                cancelCreate()
              }
            }}
            spellCheck={false}
            aria-label="New category name"
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

      {creating &&
        isMobile &&
        createPortal(
          <div
            ref={createOverlayRef}
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
    </div>
  )
}
