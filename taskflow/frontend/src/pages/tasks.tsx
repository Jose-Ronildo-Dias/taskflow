import { ChevronLeft, ChevronRight, ListPlus, Plus, Search, SearchX, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { TaskItem, TaskListSkeleton } from '@/components/task-item'
import { Button } from '@/components/ui/button'
import { SelectField, TextField } from '@/components/ui/field'
import { EmptyState, ErrorState } from '@/components/ui/states'
import { PAGE_SIZE, useCategories, useTasks } from '@/hooks/queries'
import {
  DUE_FILTER_LABEL,
  PRIORITY_LABEL,
  PRIORITY_ORDER,
  STATUS_LABEL,
  STATUS_ORDER,
} from '@/lib/format'
import type { DueFilter, TaskPriority, TaskQuery, TaskSort, TaskStatus } from '@/lib/types'

const SORTS: { value: TaskSort; label: string }[] = [
  { value: 'createdAt', label: 'Data de criação' },
  { value: 'dueAt', label: 'Prazo' },
  { value: 'priority', label: 'Prioridade' },
  { value: 'title', label: 'Título' },
]

export function parseQuery(params: URLSearchParams): TaskQuery {
  const status = params.get('status')
  const priority = params.get('priority')
  const due = params.get('due')
  const sort = params.get('sort')
  const direction = params.get('direction')
  const page = Number(params.get('page') ?? '0')
  const resolvedSort: TaskSort = SORTS.some((s) => s.value === sort) ? (sort as TaskSort) : 'createdAt'
  return {
    q: params.get('q') ?? '',
    status: STATUS_ORDER.includes(status as TaskStatus) ? (status as TaskStatus) : '',
    priority: PRIORITY_ORDER.includes(priority as TaskPriority) ? (priority as TaskPriority) : '',
    categoryId: params.get('categoryId') ?? '',
    due: (['overdue', 'today', 'week', 'none'] as const).includes(due as never) ? (due as DueFilter) : 'all',
    sort: resolvedSort,
    direction:
      direction === 'asc' || direction === 'desc'
        ? direction
        : resolvedSort === 'dueAt' || resolvedSort === 'title'
          ? 'asc'
          : 'desc',
    page: Number.isInteger(page) && page > 0 ? page : 0,
  }
}

export function TasksPage() {
  const [params, setParams] = useSearchParams()
  const query = useMemo(() => parseQuery(params), [params])
  const tasks = useTasks(query)
  const categories = useCategories()
  const [search, setSearch] = useState(query.q)

  useEffect(() => setSearch(query.q), [query.q])

  const update = (changes: Record<string, string | null>, resetPage = true) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const [key, value] of Object.entries(changes)) {
          if (value === null || value === '' || value === 'all') next.delete(key)
          else next.set(key, value)
        }
        if (resetPage) next.delete('page')
        return next
      },
      { replace: true },
    )
  }

  useEffect(() => {
    if (search === query.q) return
    const timer = setTimeout(() => update({ q: search.trim() }), 350)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const hasFilters = Boolean(
    query.q || query.status || query.priority || query.categoryId || query.due !== 'all',
  )
  const clear = () => {
    setSearch('')
    setParams(
      (prev) => {
        const next = new URLSearchParams()
        for (const key of ['sort', 'direction']) {
          const v = prev.get(key)
          if (v) next.set(key, v)
        }
        return next
      },
      { replace: true },
    )
  }

  const data = tasks.data
  const total = data?.totalElements ?? 0
  const from = data && total > 0 ? data.page * PAGE_SIZE + 1 : 0
  const to = data ? Math.min((data.page + 1) * PAGE_SIZE, total) : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-bold">Tarefas</h1>
        <Button asChild>
          <Link to="/app/tasks/new">
            <Plus className="h-4 w-4" aria-hidden />
            Nova tarefa
          </Link>
        </Button>
      </div>

      <form role="search" aria-label="Filtrar tarefas" onSubmit={(e) => e.preventDefault()} className="space-y-3">
        <TextField
          label="Buscar por título ou descrição"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leading={<Search className="h-4 w-4" aria-hidden />}
          placeholder="Buscar tarefas"
        />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <SelectField label="Status" value={query.status} onChange={(e) => update({ status: e.target.value })}>
            <option value="">Todos</option>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </SelectField>
          <SelectField label="Prioridade" value={query.priority} onChange={(e) => update({ priority: e.target.value })}>
            <option value="">Todas</option>
            {PRIORITY_ORDER.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABEL[p]}
              </option>
            ))}
          </SelectField>
          <SelectField label="Categoria" value={query.categoryId} onChange={(e) => update({ categoryId: e.target.value })}>
            <option value="">Todas</option>
            <option value="none">Sem categoria</option>
            {categories.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </SelectField>
          <SelectField label="Prazo" value={query.due} onChange={(e) => update({ due: e.target.value })}>
            {(Object.keys(DUE_FILTER_LABEL) as DueFilter[]).map((d) => (
              <option key={d} value={d}>
                {DUE_FILTER_LABEL[d]}
              </option>
            ))}
          </SelectField>
          <div className="col-span-2 grid grid-cols-[1fr_auto] gap-2 lg:col-span-1">
            <SelectField
              label="Ordenar por"
              value={query.sort}
              onChange={(e) => update({ sort: e.target.value, direction: null })}
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </SelectField>
            <Button
              variant="secondary"
              className="mt-[1.65rem] h-10"
              aria-label={`Ordem ${query.direction === 'asc' ? 'crescente' : 'decrescente'}. Alternar`}
              onClick={() => update({ direction: query.direction === 'asc' ? 'desc' : 'asc' })}
            >
              {query.direction === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
        </div>
      </form>

      <div className="flex min-h-8 items-center justify-between gap-3" aria-live="polite">
        <p className="text-sm text-muted">
          {tasks.isPending
            ? 'Carregando…'
            : data
              ? total === 0
                ? 'Nenhum resultado'
                : `Mostrando ${from}–${to} de ${total} ${total === 1 ? 'tarefa' : 'tarefas'}`
              : ''}
        </p>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clear}>
            <X className="h-4 w-4" aria-hidden />
            Limpar filtros
          </Button>
        )}
      </div>

      {tasks.isPending ? (
        <TaskListSkeleton rows={5} />
      ) : tasks.isError ? (
        <ErrorState error={tasks.error} onRetry={() => void tasks.refetch()} />
      ) : tasks.data.content.length === 0 ? (
        hasFilters ? (
          <EmptyState
            icon={<SearchX className="h-8 w-8" aria-hidden />}
            title="Nenhuma tarefa encontrada"
            action={
              <Button variant="secondary" onClick={clear}>
                Limpar filtros
              </Button>
            }
          >
            Nenhuma tarefa corresponde aos filtros aplicados. Ajuste a busca ou limpe os filtros.
          </EmptyState>
        ) : (
          <EmptyState
            icon={<ListPlus className="h-8 w-8" aria-hidden />}
            title="Nenhuma tarefa por aqui"
            action={
              <Button asChild>
                <Link to="/app/tasks/new">Criar tarefa</Link>
              </Button>
            }
          >
            Crie sua primeira tarefa para começar a organizar o dia.
          </EmptyState>
        )
      ) : (
        <>
          <ul className={tasks.isPlaceholderData ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
            {tasks.data.content.map((t) => (
              <TaskItem key={t.id} task={t} />
            ))}
          </ul>
          {tasks.data.totalPages > 1 && (
            <nav aria-label="Paginação" className="flex items-center justify-between pt-2">
              <Button
                variant="secondary"
                disabled={tasks.data.page === 0}
                onClick={() => update({ page: String(tasks.data.page - 1) }, false)}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
                Anterior
              </Button>
              <span className="text-sm text-muted">
                Página {tasks.data.page + 1} de {tasks.data.totalPages}
              </span>
              <Button
                variant="secondary"
                disabled={tasks.data.page + 1 >= tasks.data.totalPages}
                onClick={() => update({ page: String(tasks.data.page + 1) }, false)}
              >
                Próxima
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Button>
            </nav>
          )}
        </>
      )}
    </div>
  )
}
