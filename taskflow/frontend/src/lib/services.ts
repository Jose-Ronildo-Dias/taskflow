import { request } from './api'
import type {
  Category,
  DashboardSummary,
  Page,
  RegisterPayload,
  Task,
  TaskPayload,
  TaskQuery,
  TaskStatus,
  User,
} from './types'
import { dueFilterToParams } from './format'

export const authApi = {
  me: () => request<User>('/auth/me', { skipUnauthorizedHandler: true }),
  login: (body: { email: string; password: string }) =>
    request<User>('/auth/login', { method: 'POST', body, skipUnauthorizedHandler: true }),
  register: (body: RegisterPayload) =>
    request<User>('/auth/register', { method: 'POST', body, skipUnauthorizedHandler: true }),
  logout: () => request<void>('/auth/logout', { method: 'POST', skipUnauthorizedHandler: true }),
  forgotPassword: (email: string) =>
    request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: { email },
      skipUnauthorizedHandler: true,
    }),
  resetPassword: (token: string, newPassword: string) =>
    request<void>('/auth/reset-password', {
      method: 'POST',
      body: { token, newPassword },
      skipUnauthorizedHandler: true,
    }),
}

export const userApi = {
  updateName: (name: string) => request<User>('/users/me', { method: 'PATCH', body: { name } }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<void>('/users/me/password', { method: 'PATCH', body: { currentPassword, newPassword } }),
  deleteAccount: (password: string) => request<void>('/users/me', { method: 'DELETE', body: { password } }),
}

export const taskApi = {
  list: (query: TaskQuery, size = 10) => {
    const params: Record<string, string | number | boolean | undefined> = {
      q: query.q.trim() || undefined,
      status: query.status || undefined,
      priority: query.priority || undefined,
      sort: query.sort,
      direction: query.direction,
      page: query.page,
      size,
      ...dueFilterToParams(query.due),
    }
    if (query.categoryId === 'none') params.withoutCategory = true
    else if (query.categoryId) params.categoryId = query.categoryId
    return request<Page<Task>>('/tasks', { params })
  },
  get: (id: string) => request<Task>(`/tasks/${id}`),
  create: (body: TaskPayload) => request<Task>('/tasks', { method: 'POST', body }),
  update: (id: string, body: TaskPayload) => request<Task>(`/tasks/${id}`, { method: 'PUT', body }),
  setStatus: (id: string, status: TaskStatus) =>
    request<Task>(`/tasks/${id}/status`, { method: 'PATCH', body: { status } }),
  remove: (id: string) => request<void>(`/tasks/${id}`, { method: 'DELETE' }),
}

export const categoryApi = {
  list: () => request<Category[]>('/categories'),
  create: (body: { name: string; color: string | null }) => request<Category>('/categories', { method: 'POST', body }),
  update: (id: string, body: { name: string; color: string | null }) =>
    request<Category>(`/categories/${id}`, { method: 'PUT', body }),
  remove: (id: string) => request<void>(`/categories/${id}`, { method: 'DELETE' }),
}

export const dashboardApi = {
  summary: () => request<DashboardSummary>('/dashboard/summary'),
  recent: () => request<Task[]>('/dashboard/recent-tasks'),
}
