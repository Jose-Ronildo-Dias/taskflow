import { ListPlus, Plus } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { TaskItem, TaskListSkeleton } from '@/components/task-item'
import { Button } from '@/components/ui/button'
import { EmptyState, ErrorState } from '@/components/ui/states'
import { Skeleton } from '@/components/ui/skeleton'
import { useDashboard, useRecentTasks } from '@/hooks/queries'
import { useAuth } from '@/lib/auth'
import type { DashboardSummary, Task } from '@/lib/types'

function Stat({ label, value, to, tone }: { label: string; value: number; to: string; tone?: 'danger' | 'accent' }) {
  return (
    <Link to={to} className="group block rounded-lg px-1 py-2 hover:bg-surface-2">
      <span
        className={
          'block font-display text-3xl font-bold tabular-nums ' +
          (tone === 'danger' && value > 0 ? 'text-danger' : tone === 'accent' && value > 0 ? 'text-[#9a5f0c] dark:text-accent' : '')
        }
      >
        {value}
      </span>
      <span className="text-sm text-muted group-hover:text-ink">{label}</span>
    </Link>
  )
}

function Progress({ summary }: { summary: DashboardSummary }) {
  const { total, done, inProgress } = summary
  const donePct = total === 0 ? 0 : Math.round((done / total) * 100)
  const progressPct = total === 0 ? 0 : Math.round((inProgress / total) * 100)
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-xl font-semibold">Progresso geral</h2>
        <p className="text-sm text-muted">
          <span className="font-semibold text-ink">{donePct}%</span> concluído
        </p>
      </div>
      <div
        role="progressbar"
        aria-label="Tarefas concluídas"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={donePct}
        className="mt-3 flex h-3 overflow-hidden rounded-full bg-surface-2"
      >
        <div className="bg-success" style={{ width: `${donePct}%` }} />
        <div className="bg-primary/60" style={{ width: `${progressPct}%` }} />
      </div>
      <p className="mt-2 text-xs text-muted">
        Concluídas em verde, em andamento em azul. Tarefas concluídas nunca contam como pendentes ou atrasadas.
      </p>
    </div>
  )
}

function Section({ title, hint, tasks, empty }: { title: string; hint?: string; tasks: Task[]; empty: string }) {
  return (
    <section aria-labelledby={`sec-${title}`}>
      <h2 id={`sec-${title}`} className="text-xl font-semibold">
        {title}
      </h2>
      {hint && <p className="text-sm text-muted">{hint}</p>}
      {tasks.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{empty}</p>
      ) : (
        <ul className="mt-2">
          {tasks.map((t) => (
            <TaskItem key={t.id} task={t} compact />
          ))}
        </ul>
      )}
    </section>
  )
}

function Block({ children }: { children: ReactNode }) {
  return <div className="space-y-10">{children}</div>
}

export function DashboardPage() {
  const { user } = useAuth()
  const summary = useDashboard()
  const recent = useRecentTasks()
  const firstName = user?.name.split(' ')[0]

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Olá, {firstName}</h1>
          <p className="mt-1 text-muted">Veja como estão suas tarefas hoje.</p>
        </div>
        <Button asChild>
          <Link to="/app/tasks/new">
            <Plus className="h-4 w-4" aria-hidden />
            Nova tarefa
          </Link>
        </Button>
      </div>

      {summary.isPending ? (
        <div className="space-y-6" aria-busy="true" aria-label="Carregando painel">
          <Skeleton className="h-24 w-full" />
          <TaskListSkeleton />
        </div>
      ) : summary.isError ? (
        <ErrorState error={summary.error} onRetry={() => void summary.refetch()} />
      ) : summary.data.total === 0 ? (
        <EmptyState
          icon={<ListPlus className="h-8 w-8" aria-hidden />}
          title="Você ainda não tem tarefas"
          action={
            <Button asChild>
              <Link to="/app/tasks/new">Criar primeira tarefa</Link>
            </Button>
          }
        >
          Crie uma tarefa para começar. Os indicadores do painel aparecem aqui assim que você tiver dados.
        </EmptyState>
      ) : (
        <Block>
          <Progress summary={summary.data} />
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 border-y border-line py-4 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Total" value={summary.data.total} to="/app/tasks" />
            <Stat label="A fazer" value={summary.data.todo} to="/app/tasks?status=TODO" />
            <Stat label="Em andamento" value={summary.data.inProgress} to="/app/tasks?status=IN_PROGRESS" />
            <Stat label="Concluídas" value={summary.data.done} to="/app/tasks?status=DONE" />
            <Stat label="Atrasadas" value={summary.data.overdue} to="/app/tasks?due=overdue" tone="danger" />
            <Stat label="Vencem em 48 h" value={summary.data.dueSoon} to="/app/tasks?due=week&sort=dueAt" tone="accent" />
          </dl>
          <Section
            title="Prioritárias"
            hint="Tarefas abertas com prioridade alta ou urgente."
            tasks={summary.data.priorityTasks}
            empty="Nenhuma tarefa aberta com prioridade alta ou urgente."
          />
          <Section
            title="Prazos mais próximos"
            hint="Tarefas abertas ordenadas pelo vencimento."
            tasks={summary.data.deadlineTasks}
            empty="Nenhuma tarefa aberta com prazo definido."
          />
        </Block>
      )}

      {!summary.isError && (summary.data?.total ?? 0) > 0 && (
        <section aria-labelledby="sec-recentes">
          <h2 id="sec-recentes" className="text-xl font-semibold">
            Criadas recentemente
          </h2>
          {recent.isPending ? (
            <TaskListSkeleton rows={3} />
          ) : recent.isError ? (
            <div className="mt-3">
              <ErrorState error={recent.error} onRetry={() => void recent.refetch()} />
            </div>
          ) : (
            <ul className="mt-2">
              {recent.data.map((t) => (
                <TaskItem key={t.id} task={t} compact />
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}
