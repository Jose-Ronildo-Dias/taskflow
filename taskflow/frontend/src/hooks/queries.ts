import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { categoryApi, dashboardApi, taskApi } from '@/lib/services'
import type { TaskPayload, TaskQuery, TaskStatus } from '@/lib/types'

export const PAGE_SIZE = 10

export const keys = {
  tasks: ['tasks'] as const,
  taskList: (q: TaskQuery) => ['tasks', 'list', q] as const,
  task: (id: string) => ['tasks', 'detail', id] as const,
  categories: ['categories'] as const,
  dashboard: ['dashboard'] as const,
}

export function useTasks(query: TaskQuery) {
  return useQuery({
    queryKey: keys.taskList(query),
    queryFn: () => taskApi.list(query, PAGE_SIZE),
    placeholderData: keepPreviousData,
  })
}

export function useTask(id: string | undefined) {
  return useQuery({
    queryKey: keys.task(id ?? ''),
    queryFn: () => taskApi.get(id as string),
    enabled: Boolean(id),
    retry: (count, error) => (error as { status?: number }).status !== 404 && count < 1,
  })
}

export function useCategories() {
  return useQuery({ queryKey: keys.categories, queryFn: categoryApi.list })
}

export function useDashboard() {
  return useQuery({
    queryKey: [...keys.dashboard, 'summary'],
    queryFn: dashboardApi.summary,
  })
}

export function useRecentTasks() {
  return useQuery({
    queryKey: [...keys.dashboard, 'recent'],
    queryFn: dashboardApi.recent,
  })
}

function useInvalidateAll() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: keys.tasks }),
      queryClient.invalidateQueries({ queryKey: keys.dashboard }),
      queryClient.invalidateQueries({ queryKey: keys.categories }),
    ])
}

export function useCreateTask() {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: (payload: TaskPayload) => taskApi.create(payload),
    onSuccess: invalidate,
  })
}

export function useUpdateTask(id: string) {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: (payload: TaskPayload) => taskApi.update(id, payload),
    onSuccess: invalidate,
  })
}

export function useSetTaskStatus() {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) => taskApi.setStatus(id, status),
    onSuccess: invalidate,
  })
}

export function useDeleteTask() {
  const invalidate = useInvalidateAll()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => taskApi.remove(id),
    onSuccess: async (_data, id) => {
      queryClient.removeQueries({ queryKey: keys.task(id) })
      await invalidate()
    },
  })
}

export function useSaveCategory() {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: ({ id, name, color }: { id?: string; name: string; color: string | null }) =>
      id ? categoryApi.update(id, { name, color }) : categoryApi.create({ name, color }),
    onSuccess: invalidate,
  })
}

export function useDeleteCategory() {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: (id: string) => categoryApi.remove(id),
    onSuccess: invalidate,
  })
}
