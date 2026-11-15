import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
} from 'react'
import { CATEGORY_COLORS } from '../colors'
import { useApp } from '../context/AppContext'
import { NewTaskRow } from './NewTaskRow'
import { TaskRow } from './TaskRow'

type Props = {
  categoryId?: string | null
  title?: string
  onRequestDelete?: () => void
}

type DropTarget = { id: string; edge: 'before' | 'after' }

export function TodoColumn({
  categoryId = null,
  title = 'Tasks',
  onRequestDelete,
}: Props) {
  const {
    tasks,
    categories,
    addTask,
    updateTaskText,
    deleteTask,
    toggleStar,
    completeTask,
    returnToList,
    toggleRecurring,
    setDueDate,
    setCategory,
    setTaskNote,
    renameCategory,
    setCategoryColor,
    reorderTasks,
  } = useApp()

  const category = categoryId
    ? categories.find((c) => c.id === categoryId)
    : undefined

  const [dropActive, setDropActive] = useState(false)
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null)
  const [touchDraggingId, setTouchDraggingId] = useState<string | null>(null)
  const draggingId = useRef<string | null>(null)
  const dropTargetRef = useRef<DropTarget | null>(null)
  const blockRef = useRef<HTMLDivElement>(null)

  dropTargetRef.current = dropTarget

  const open = useMemo(() => {
    return tasks.filter((t) => {
      if (t.status !== 'open' || t.onDay) return false
      if (categoryId) return t.categoryId === categoryId
      return true
    })
  }, [tasks, categoryId])

  const starred = open
    .filter((t) => t.starred)
    .sort((a, b) => a.order - b.order || a.createdAt - b.createdAt)

  const rest = open
    .filter((t) => !t.starred)
    .sort((a, b) => a.order - b.order || a.createdAt - b.createdAt)

  const onTitleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      ;(e.target as HTMLInputElement).blur()
    }
  }

  const onColumnDragOver = (e: DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (!draggingId.current) setDropActive(true)
  }

  const onColumnDrop = (e: DragEvent) => {
    e.preventDefault()
    setDropActive(false)
    setDropTarget(null)
    const id =
      e.dataTransfer.getData('text/duit-task') ||
      e.dataTransfer.getData('text/plain')
    draggingId.current = null
    if (!id) return
    const task = tasks.find((t) => t.id === id)
    if (task && (task.onDay || task.status === 'done')) returnToList(id)
  }

  const edgeFromPoint = (
    el: HTMLElement,
    clientY: number,
  ): 'before' | 'after' => {
    const rect = el.getBoundingClientRect()
    return clientY < rect.top + rect.height / 2 ? 'before' : 'after'
  }

  const edgeFromEvent = (e: DragEvent): 'before' | 'after' => {
    return edgeFromPoint(e.currentTarget as HTMLElement, e.clientY)
  }

  const onRowDragOver = (e: DragEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    setDropActive(false)
    if (draggingId.current === id) {
      setDropTarget(null)
      return
    }
    const edge = edgeFromEvent(e)
    setDropTarget((cur) =>
      cur?.id === id && cur.edge === edge ? cur : { id, edge },
    )
  }

  const onRowDrop = (e: DragEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    const fromId =
      e.dataTransfer.getData('text/duit-task') ||
      draggingId.current ||
      e.dataTransfer.getData('text/plain')
    const edge = dropTarget?.id === id ? dropTarget.edge : edgeFromEvent(e)
    setDropTarget(null)
    setDropActive(false)
    draggingId.current = null
    if (!fromId || fromId === id) return
    reorderTasks(fromId, id, edge, categoryId)
  }

  const clearDrag = () => {
    draggingId.current = null
    setTouchDraggingId(null)
    setDropTarget(null)
    setDropActive(false)
  }

  const updateTouchDropTarget = (clientX: number, clientY: number) => {
    const fromId = draggingId.current
    if (!fromId) return
    const stack = document.elementsFromPoint(clientX, clientY)
    const row = stack.find(
      (n) =>
        n instanceof HTMLElement &&
        n.dataset.taskId &&
        n.dataset.taskId !== fromId,
    ) as HTMLElement | undefined
    if (!row?.dataset.taskId) {
      setDropTarget(null)
      return
    }
    const id = row.dataset.taskId
    const edge = edgeFromPoint(row, clientY)
    setDropTarget((cur) =>
      cur?.id === id && cur.edge === edge ? cur : { id, edge },
    )

    // Keep the list scrolling under a finger near the edges.
    const scroller = blockRef.current
    if (scroller) {
      const rect = scroller.getBoundingClientRect()
      const edgePx = 48
      if (clientY < rect.top + edgePx) scroller.scrollTop -= 14
      else if (clientY > rect.bottom - edgePx) scroller.scrollTop += 14
    }
  }

  const beginTouchDrag = (id: string) => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
    draggingId.current = id
    setTouchDraggingId(id)
    setDropActive(false)
    setDropTarget(null)
    try {
      navigator.vibrate?.(12)
    } catch {
      /* ignore */
    }
  }

  const endTouchDrag = () => {
    const fromId = draggingId.current
    const target = dropTargetRef.current
    if (fromId && target && target.id !== fromId) {
      reorderTasks(fromId, target.id, target.edge, categoryId)
    }
    clearDrag()
  }

  // While a touch-drag is active, track the finger globally (non-passive so
  // we can prevent scroll) and commit on lift/cancel.
  useEffect(() => {
    if (!touchDraggingId) return

    const onMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return
      e.preventDefault()
      const t = e.touches[0]
      updateTouchDropTarget(t.clientX, t.clientY)
    }
    const onEnd = () => endTouchDrag()

    document.addEventListener('touchmove', onMove, { passive: false })
    document.addEventListener('touchend', onEnd)
    document.addEventListener('touchcancel', onEnd)
    document.body.classList.add('is-task-reordering')
    return () => {
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend', onEnd)
      document.removeEventListener('touchcancel', onEnd)
      document.body.classList.remove('is-task-reordering')
    }
    // Intentionally only rebind when drag identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [touchDraggingId, categoryId])

  const taskHandlers = (taskId: string) => ({
    onTextChange: (text: string) => updateTaskText(taskId, text),
    onDelete: () => deleteTask(taskId),
    onToggleStar: () => toggleStar(taskId),
    onComplete: () => completeTask(taskId),
    onToggleRecurring: () => toggleRecurring(taskId),
    onSetDue: (iso: string | null) => setDueDate(taskId, iso),
    onSetCategory: (catId: string | null) => setCategory(taskId, catId),
    onSetNote: (note: { body: string } | null) => setTaskNote(taskId, note),
    dropEdge:
      dropTarget?.id === taskId ? dropTarget.edge : (null as 'before' | 'after' | null),
    touchDragging: touchDraggingId === taskId,
    onRowDragOver: (e: DragEvent) => onRowDragOver(e, taskId),
    onRowDragLeave: () =>
      setDropTarget((cur) => (cur?.id === taskId ? null : cur)),
    onRowDrop: (e: DragEvent) => onRowDrop(e, taskId),
    onRowDragEnd: clearDrag,
    onTouchDragStart: () => beginTouchDrag(taskId),
  })

  return (
    <section
      className={`todo-column${dropActive ? ' is-drop' : ''}${touchDraggingId ? ' is-touch-reordering' : ''}`}
      onDragOver={onColumnDragOver}
      onDragLeave={() => setDropActive(false)}
      onDrop={onColumnDrop}
    >
      <header className="pane-header">
        {categoryId && category ? (
          <div className="pane-header__edit">
            <input
              className="pane-header__title"
              value={category.name}
              size={Math.max(category.name.length, 1)}
              onChange={(e) => renameCategory(categoryId, e.target.value)}
              onBlur={() => {
                if (!category.name.trim()) {
                  renameCategory(categoryId, 'untitled')
                }
              }}
              onKeyDown={onTitleKey}
              aria-label="Category name"
              spellCheck={false}
            />
            <div className="pane-header__tools">
              <div className="color-dots" role="group" aria-label="Category color">
                {CATEGORY_COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`color-dot${category.colorId === c.id ? ' is-active' : ''}`}
                    style={{ background: c.folder }}
                    aria-label={`Color ${c.id}`}
                    title={c.id}
                    onClick={() => setCategoryColor(category.id, c.id)}
                  />
                ))}
              </div>
              {onRequestDelete && (
                <button
                  type="button"
                  className="pane-header__delete"
                  aria-label="Delete category"
                  title="Delete category"
                  onClick={onRequestDelete}
                >
                  ×
                </button>
              )}
            </div>
          </div>
        ) : (
          <h2>{title}</h2>
        )}
      </header>

      <div className="todo-block" ref={blockRef}>
        <NewTaskRow
          onSubmit={(text) => addTask(text, categoryId)}
          placeholder={categoryId ? 'add to this category…' : 'new task…'}
        />

        {starred.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            categories={categories}
            showCategoryTag={!categoryId}
            onDragTrack={() => {
              draggingId.current = task.id
            }}
            {...taskHandlers(task.id)}
          />
        ))}

        {rest.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            categories={categories}
            showCategoryTag={!categoryId}
            onDragTrack={() => {
              draggingId.current = task.id
            }}
            {...taskHandlers(task.id)}
          />
        ))}
      </div>
    </section>
  )
}
