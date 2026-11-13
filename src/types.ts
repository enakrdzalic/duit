export type Task = {
  id: string
  text: string
  starred: boolean
  recurring: boolean
  dueDate: string | null
  categoryId: string | null
  status: 'open' | 'done'
  /** Day bucket in the days panel (independent of checked state). */
  onDay: string | null
  completedOn: string | null
  createdAt: number
  order: number
}

export type Category = {
  id: string
  name: string
  colorId: string
}

export type AppState = {
  tasks: Task[]
  categories: Category[]
}

export type HashCommand = 'repeat' | 'due' | 'category' | 'priority' | 'delete'
