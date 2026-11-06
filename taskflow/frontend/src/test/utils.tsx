import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { vi } from 'vitest'
import { App } from '@/App'
import { AuthProvider } from '@/lib/auth'
import { ThemeProvider } from '@/lib/theme'
import type { Category, DashboardSummary, Task, User } from '@/lib/types'

export interface FakeRequest {
  method: string
  path: string
  search: URLSearchParams
  body: any
}
export interface FakeResponse {
  status?: number
  body?: unknown
  headers?: Record<string, string>
}
export type Handler = (req: FakeRequest) => FakeResponse | undefined | Promise<FakeResponse | undefined>

export interface MockApi {
  fetch: ReturnType<typeof vi.fn>
  calls: FakeRequest[]
  find: (method: string, path: string) => FakeRequest[]
}

/** Substitui o fetch global por uma API falsa. Rotas não tratadas respondem 404 para evidenciar lacunas. */
export function mockApi(handler: Handler): MockApi {
  const calls: FakeRequest[] = []
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), 'http://localhost')
    const req: FakeRequest = {
      method: (init?.method ?? 'GET').toUpperCase(),
      path: url.pathname.replace('/api/v1', ''),
      search: url.searchParams,
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    }
    calls.push(req)
    if (req.path === '/auth/csrf') return new Response(null, { status: 204 })
    const res = (await handler(req)) ?? { status: 404, body: { message: `Sem handler para ${req.method} ${req.path}` } }
    const status = res.status ?? 200
    if (status === 204 || res.body === undefined) return new Response(null, { status, headers: res.headers })
    return new Response(JSON.stringify(res.body), {
      status,
      headers: { 'Content-Type': 'application/json', ...res.headers },
    })
  })
  vi.stubGlobal('fetch', fetchMock)
  return {
    fetch: fetchMock,
    calls,
    find: (method, path) => calls.filter((c) => c.method === method && c.path === path),
  }
}

export function renderApp(route = '/') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 0 } } })
  return render(
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </ThemeProvider>,
  )
}

export const user: User = {
  id: 'u1',
  name: 'Maria Souza',
  email: 'maria@example.com',
  role: 'USER',
  createdAt: '2026-01-10T12:00:00Z',
}

export function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 't1',
    title: 'Revisar contrato',
    description: null,
    status: 'TODO',
    priority: 'MEDIUM',
    dueAt: null,
    completedAt: null,
    createdAt: '2026-10-01T12:00:00Z',
    updatedAt: '2026-10-01T12:00:00Z',
    overdue: false,
    category: null,
    ...overrides,
  }
}

export function makePage(content: Task[], extra: Partial<{ page: number; totalPages: number; totalElements: number }> = {}) {
  return {
    content,
    page: extra.page ?? 0,
    size: 10,
    totalElements: extra.totalElements ?? content.length,
    totalPages: extra.totalPages ?? 1,
  }
}

export const emptySummary: DashboardSummary = {
  total: 0,
  todo: 0,
  inProgress: 0,
  done: 0,
  overdue: 0,
  dueSoon: 0,
  priorityTasks: [],
  deadlineTasks: [],
}

export const sampleCategory: Category = {
  id: 'c1',
  name: 'Trabalho',
  color: '#0d6b7c',
  taskCount: 2,
  createdAt: '2026-10-01T12:00:00Z',
  updatedAt: '2026-10-01T12:00:00Z',
}
