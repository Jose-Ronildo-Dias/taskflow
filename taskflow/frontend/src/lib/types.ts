export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export interface User {
  id: string
  name: string
  email: string
  role: 'USER' | 'ADMIN'
  createdAt: string
}

export interface CategorySummary {
  id: string
  name: string
  color: string | null
}

export interface Category extends CategorySummary {
  taskCount: number
  createdAt: string
  updatedAt: string
}

export interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  dueAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
  overdue: boolean
  category: CategorySummary | null
}

export interface Page<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface DashboardSummary {
  total: number
  todo: number
  inProgress: number
  done: number
  overdue: number
  dueSoon: number
  priorityTasks: Task[]
  deadlineTasks: Task[]
}

export interface TaskPayload {
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  categoryId: string | null
  dueAt: string | null
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  confirmPassword: string
  acceptTerms: boolean
}

export type TaskSort = 'createdAt' | 'dueAt' | 'priority' | 'title'
export type DueFilter = 'all' | 'overdue' | 'today' | 'week' | 'none'

export interface TaskQuery {
  q: string
  status: TaskStatus | ''
  priority: TaskPriority | ''
  categoryId: string
  due: DueFilter
  sort: TaskSort
  direction: 'asc' | 'desc'
  page: number
}
