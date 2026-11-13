import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { nextColorId } from '../colors'
import { toISODate, uid } from '../dates'
import { loadState, saveState } from '../storage'
import type { AppState, Category, Task } from '../types'

type AppContextValue = {
  tasks: Task[]
  categories: Category[]
  addTask: (text: string, categoryId?: string | null) => void
  updateTaskText: (id: string, text: string) => void
  deleteTask: (id: string) => void
  toggleStar: (id: string) => void
  setStarred: (id: string, starred: boolean) => void
  toggleRecurring: (id: string) => void
  setDueDate: (id: string, dueDate: string | null) => void
  setCategory: (id: string, categoryId: string | null) => void
  completeTask: (id: string, completedOn?: string) => void
  uncompleteTask: (id: string) => void
  /** Place a task on a day without checking it (or move between days). */
  moveToDay: (id: string, day: string) => void
  /** Return a day-placed task to the open todo list. */
  returnToList: (id: string) => void
  addCategory: (name: string) => Category
  renameCategory: (id: string, name: string) => void
  setCategoryColor: (id: string, colorId: string) => void
  deleteCategory: (id: string) => void
  reorderCategories: (fromId: string, toId: string) => void
  /** Reorder open todos; dropping near a priority/rest item adopts that section. */
  reorderTasks: (
    fromId: string,
    toId: string,
    placement?: 'before' | 'after',
    scopeCategoryId?: string | null,
  ) => void
  getCategory: (id: string) => Category | undefined
}

const AppContext = createContext<AppContextValue | null>(null)

function nextOpenOrder(tasks: Task[]): number {
  const open = tasks.filter((t) => t.status === 'open' && !t.onDay && !t.starred)
  if (open.length === 0) return 0
  return Math.min(...open.map((t) => t.order)) - 1
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState())

  useEffect(() => {
    saveState(state)
  }, [state])

  const addTask = useCallback((text: string, categoryId: string | null = null) => {
    const trimmed = text.trim()
    if (!trimmed) return
    setState((prev) => {
      const task: Task = {
        id: uid(),
        text: trimmed,
        starred: false,
        recurring: false,
        dueDate: null,
        categoryId,
        status: 'open',
        onDay: null,
        completedOn: null,
        createdAt: Date.now(),
        order: nextOpenOrder(prev.tasks),
      }
      return { ...prev, tasks: [task, ...prev.tasks] }
    })
  }, [])

  const updateTaskText = useCallback((id: string, text: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === id ? { ...t, text } : t)),
    }))
  }, [])

  const deleteTask = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== id),
    }))
  }, [])

  const toggleStar = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === id ? { ...t, starred: !t.starred } : t,
      ),
    }))
  }, [])

  const setStarred = useCallback((id: string, starred: boolean) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.id !== id) return t
        if (starred && (t.status === 'done' || t.onDay)) {
          return {
            ...t,
            starred: true,
            status: 'open' as const,
            onDay: null,
            completedOn: null,
            order: nextOpenOrder(prev.tasks),
          }
        }
        return { ...t, starred }
      }),
    }))
  }, [])

  const toggleRecurring = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === id ? { ...t, recurring: !t.recurring } : t,
      ),
    }))
  }, [])

  const setDueDate = useCallback((id: string, dueDate: string | null) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === id ? { ...t, dueDate } : t)),
    }))
  }, [])

  const setCategory = useCallback((id: string, categoryId: string | null) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === id ? { ...t, categoryId } : t)),
    }))
  }, [])

  const completeTask = useCallback((id: string, completedOn?: string) => {
    setState((prev) => {
      const task = prev.tasks.find((t) => t.id === id)
      if (!task) return prev

      const day = completedOn ?? task.onDay ?? toISODate()

      // Already done → just move between days
      if (task.status === 'done') {
        return {
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === id ? { ...t, onDay: day, completedOn: day } : t,
          ),
        }
      }

      const done: Task = {
        ...task,
        status: 'done',
        onDay: day,
        completedOn: day,
        starred: false,
      }

      let tasks = prev.tasks.map((t) => (t.id === id ? done : t))

      if (task.recurring) {
        const clone: Task = {
          id: uid(),
          text: task.text,
          starred: false,
          recurring: true,
          dueDate: task.dueDate,
          categoryId: task.categoryId,
          status: 'open',
          onDay: null,
          completedOn: null,
          createdAt: Date.now(),
          order: nextOpenOrder(tasks),
        }
        tasks = [clone, ...tasks]
      }

      return { ...prev, tasks }
    })
  }, [])

  const uncompleteTask = useCallback((id: string) => {
    setState((prev) => {
      const task = prev.tasks.find((t) => t.id === id)
      if (!task || task.status !== 'done') return prev
      // Stay on the day bucket — only clear the check.
      return {
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === id
            ? {
                ...t,
                status: 'open' as const,
                completedOn: null,
                onDay: t.onDay ?? t.completedOn,
              }
            : t,
        ),
      }
    })
  }, [])

  const moveToDay = useCallback((id: string, day: string) => {
    const today = toISODate()
    const pastDay = day < today
    setState((prev) => {
      const task = prev.tasks.find((t) => t.id === id)
      if (!task) return prev

      // Past days = already done; today/future stay unchecked until checked.
      if (pastDay && task.status === 'open') {
        const done: Task = {
          ...task,
          onDay: day,
          status: 'done',
          completedOn: day,
          starred: false,
        }
        let tasks = prev.tasks.map((t) => (t.id === id ? done : t))
        if (task.recurring) {
          const clone: Task = {
            id: uid(),
            text: task.text,
            starred: false,
            recurring: true,
            dueDate: task.dueDate,
            categoryId: task.categoryId,
            status: 'open',
            onDay: null,
            completedOn: null,
            createdAt: Date.now(),
            order: nextOpenOrder(tasks),
          }
          tasks = [clone, ...tasks]
        }
        return { ...prev, tasks }
      }

      return {
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === id
            ? {
                ...t,
                onDay: day,
                completedOn: t.status === 'done' ? day : t.completedOn,
                starred: false,
              }
            : t,
        ),
      }
    })
  }, [])

  const returnToList = useCallback((id: string) => {
    setState((prev) => {
      const task = prev.tasks.find((t) => t.id === id)
      if (!task) return prev
      return {
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === id
            ? {
                ...t,
                status: 'open' as const,
                onDay: null,
                completedOn: null,
                order: nextOpenOrder(prev.tasks),
              }
            : t,
        ),
      }
    })
  }, [])

  const addCategory = useCallback((name: string): Category => {
    const trimmed = name.trim()
    let created: Category = {
      id: uid(),
      name: trimmed || 'untitled',
      colorId: 'sky',
    }
    setState((prev) => {
      created = {
        ...created,
        colorId: nextColorId(prev.categories.map((c) => c.colorId)),
      }
      return {
        ...prev,
        categories: [...prev.categories, created],
      }
    })
    return created
  }, [])

  const renameCategory = useCallback((id: string, name: string) => {
    setState((prev) => ({
      ...prev,
      categories: prev.categories.map((c) =>
        c.id === id ? { ...c, name } : c,
      ),
    }))
  }, [])

  const setCategoryColor = useCallback((id: string, colorId: string) => {
    setState((prev) => ({
      ...prev,
      categories: prev.categories.map((c) =>
        c.id === id ? { ...c, colorId } : c,
      ),
    }))
  }, [])

  const deleteCategory = useCallback((id: string) => {
    setState((prev) => ({
      categories: prev.categories.filter((c) => c.id !== id),
      tasks: prev.tasks.map((t) =>
        t.categoryId === id ? { ...t, categoryId: null } : t,
      ),
    }))
  }, [])

  const reorderCategories = useCallback((fromId: string, toId: string) => {
    if (fromId === toId) return
    setState((prev) => {
      const fromIndex = prev.categories.findIndex((c) => c.id === fromId)
      const toIndex = prev.categories.findIndex((c) => c.id === toId)
      if (fromIndex < 0 || toIndex < 0) return prev
      const next = [...prev.categories]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return { ...prev, categories: next }
    })
  }, [])

  const reorderTasks = useCallback(
    (
      fromId: string,
      toId: string,
      placement: 'before' | 'after' = 'before',
      scopeCategoryId: string | null = null,
    ) => {
      setState((prev) => {
        const rawFrom = prev.tasks.find((t) => t.id === fromId)
        const to = prev.tasks.find((t) => t.id === toId)
        if (!rawFrom || !to) return prev
        if (to.status !== 'open' || to.onDay) return prev

        // Dragging from days (or a checked day item) returns it to the open list.
        const from: Task =
          rawFrom.onDay || rawFrom.status === 'done'
            ? {
                ...rawFrom,
                status: 'open',
                onDay: null,
                completedOn: null,
              }
            : rawFrom

        if (from.status !== 'open' || from.onDay) return prev

        const targetStarred = to.starred
        const inScope = (t: Task) => {
          if (t.id === fromId) return false
          if (t.status !== 'open' || t.onDay) return false
          if (t.starred !== targetStarred) return false
          if (scopeCategoryId) return t.categoryId === scopeCategoryId
          return true
        }

        const currentList = prev.tasks
          .filter(
            (t) =>
              t.status === 'open' &&
              !t.onDay &&
              t.starred === targetStarred &&
              (!scopeCategoryId || t.categoryId === scopeCategoryId),
          )
          .sort((a, b) => a.order - b.order || a.createdAt - b.createdAt)

        const fromIndex = currentList.findIndex((t) => t.id === fromId)
        const toIndexInCurrent = currentList.findIndex((t) => t.id === toId)
        if (toIndexInCurrent < 0) return prev

        // Where `from` would land in the current list (before removal).
        let insertAtInCurrent =
          placement === 'after' ? toIndexInCurrent + 1 : toIndexInCurrent
        if (fromIndex >= 0 && fromIndex < insertAtInCurrent) {
          insertAtInCurrent -= 1
        }
        if (
          fromIndex >= 0 &&
          from.starred === targetStarred &&
          insertAtInCurrent === fromIndex
        ) {
          return prev
        }

        const list = prev.tasks
          .filter(inScope)
          .sort((a, b) => a.order - b.order || a.createdAt - b.createdAt)

        const toIndex = list.findIndex((t) => t.id === toId)
        if (toIndex < 0) return prev

        const insertAt = placement === 'after' ? toIndex + 1 : toIndex

        const nextList = [...list]
        nextList.splice(insertAt, 0, { ...from, starred: targetStarred })
        const orderById = new Map(nextList.map((t, i) => [t.id, i]))

        return {
          ...prev,
          tasks: prev.tasks.map((t) => {
            if (t.id === fromId) {
              return {
                ...from,
                starred: targetStarred,
                order: orderById.get(fromId) ?? from.order,
              }
            }
            const order = orderById.get(t.id)
            return order === undefined ? t : { ...t, order }
          }),
        }
      })
    },
    [],
  )

  const getCategory = useCallback(
    (id: string) => state.categories.find((c) => c.id === id),
    [state.categories],
  )

  const value = useMemo<AppContextValue>(
    () => ({
      tasks: state.tasks,
      categories: state.categories,
      addTask,
      updateTaskText,
      deleteTask,
      toggleStar,
      setStarred,
      toggleRecurring,
      setDueDate,
      setCategory,
      completeTask,
      uncompleteTask,
      moveToDay,
      returnToList,
      addCategory,
      renameCategory,
      setCategoryColor,
      deleteCategory,
      reorderCategories,
      reorderTasks,
      getCategory,
    }),
    [
      state.tasks,
      state.categories,
      addTask,
      updateTaskText,
      deleteTask,
      toggleStar,
      setStarred,
      toggleRecurring,
      setDueDate,
      setCategory,
      completeTask,
      uncompleteTask,
      moveToDay,
      returnToList,
      addCategory,
      renameCategory,
      setCategoryColor,
      deleteCategory,
      reorderCategories,
      reorderTasks,
      getCategory,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
