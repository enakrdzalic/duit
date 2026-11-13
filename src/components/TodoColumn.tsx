import {
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
}

type DropTarget = { id: string; edge: 'before' | 'after' }

export function TodoColumn({ categoryId = null, title = 'todo' }: Props) {
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
    renameCategory,
    setCategoryColor,
    reorderTasks,
  } = useApp()

  const category = categoryId
    ? categories.find((c) => c.id === categoryId)
    : undefined

  const [dropActive, setDropActive] = useState(false)
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null)
  const draggingId = useRef<string | null>(null)

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

  const edgeFromEvent = (e: DragEvent): 'before' | 'after' => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    return e.clientY < rect.top + rect.height / 2 ? 'before' : 'after'
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
    setDropTarget(null)
    setDropActive(false)
  }

  const taskHandlers = (taskId: string) => ({
    onTextChange: (text: string) => updateTaskText(taskId, text),
    onDelete: () => deleteTask(taskId),
    onToggleStar: () => toggleStar(taskId),
    onComplete: () => completeTask(taskId),
    onToggleRecurring: () => toggleRecurring(taskId),
    onSetDue: (iso: string | null) => setDueDate(taskId, iso),
    onSetCategory: (catId: string | null) => setCategory(taskId, catId),
    dropEdge:
      dropTarget?.id === taskId ? dropTarget.edge : (null as 'before' | 'after' | null),
    onRowDragOver: (e: DragEvent) => onRowDragOver(e, taskId),
    onRowDragLeave: () =>
      setDropTarget((cur) => (cur?.id === taskId ? null : cur)),
    onRowDrop: (e: DragEvent) => onRowDrop(e, taskId),
    onRowDragEnd: clearDrag,
  })

  return (
    <section
      className={`todo-column${dropActive ? ' is-drop' : ''}`}
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
          </div>
        ) : (
          <h2>{title}</h2>
        )}
      </header>

      <div className="todo-block">
        <NewTaskRow
          onSubmit={(text) => addTask(text, categoryId)}
          placeholder={categoryId ? 'add to this category…' : 'new todo…'}
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
