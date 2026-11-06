import { CalendarClock, Check, Pencil, Play, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useDeleteTask, useSetTaskStatus } from '@/hooks/queries'
import { ApiError } from '@/lib/api'
import { formatDateTime, relativeDue } from '@/lib/format'
import type { Task, TaskStatus } from '@/lib/types'
import { cn } from '@/lib/utils'
import { CategoryChip, PriorityMark, StatusTrack } from './task-visuals'

export function DueLabel({ task }: { task: Task }) {
  if (!task.dueAt) return null
  const done = task.status === 'DONE'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium',
        task.overdue ? 'text-danger' : done ? 'text-muted' : 'text-ink',
      )}
      title={formatDateTime(task.dueAt)}
    >
      <CalendarClock className="h-3.5 w-3.5" aria-hidden />
      {task.overdue ? 'Atrasada, venceu ' : done ? 'Prazo ' : 'Vence '}
      <time dateTime={task.dueAt}>{relativeDue(task.dueAt)}</time>
    </span>
  )
}

export function useTaskActions() {
  const setStatus = useSetTaskStatus()
  const remove = useDeleteTask()

  const change = (task: Task, status: TaskStatus, successMessage: string) =>
    setStatus.mutate(
      { id: task.id, status },
      {
        onSuccess: () => toast.success(successMessage),
        onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Não foi possível atualizar a tarefa.'),
      },
    )

  return { setStatus, remove, change }
}

export function TaskItem({ task, compact = false }: { task: Task; compact?: boolean }) {
  const { setStatus, remove, change } = useTaskActions()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const done = task.status === 'DONE'
  const busy = setStatus.isPending && setStatus.variables?.id === task.id

  return (
    <li className="flex items-start gap-3 border-b border-line py-3.5 last:border-b-0">
      <button
        type="button"
        onClick={() => change(task, done ? 'TODO' : 'DONE', done ? 'Tarefa reaberta.' : 'Tarefa concluída.')}
        disabled={busy}
        aria-label={done ? `Reabrir tarefa: ${task.title}` : `Concluir tarefa: ${task.title}`}
        className={cn(
          'mt-0.5 flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 transition-colors disabled:opacity-60',
          done ? 'border-success bg-success text-white dark:text-[#06210f]' : 'border-line hover:border-primary',
        )}
      >
        {done && <Check className="h-3.5 w-3.5" aria-hidden strokeWidth={3} />}
      </button>

      <div className="min-w-0 flex-1">
        <Link
          to={`/app/tasks/${task.id}`}
          className={cn('block font-medium break-words hover:underline', done && 'text-muted line-through')}
        >
          {task.title}
        </Link>
        {!compact && task.description && <p className="mt-0.5 line-clamp-1 text-sm text-muted">{task.description}</p>}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
          <StatusTrack status={task.status} />
          <PriorityMark priority={task.priority} />
          {task.category && <CategoryChip category={task.category} />}
          <DueLabel task={task} />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        {task.status === 'TODO' && (
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Iniciar tarefa: ${task.title}`}
            title="Iniciar"
            disabled={busy}
            onClick={() => change(task, 'IN_PROGRESS', 'Tarefa em andamento.')}
          >
            <Play className="h-4 w-4" aria-hidden />
          </Button>
        )}
        <Button variant="ghost" size="icon" asChild>
          <Link to={`/app/tasks/${task.id}/edit`} aria-label={`Editar tarefa: ${task.title}`} title="Editar">
            <Pencil className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
        <Button
          variant="danger-ghost"
          size="icon"
          aria-label={`Excluir tarefa: ${task.title}`}
          title="Excluir"
          onClick={() => setConfirmOpen(true)}
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Excluir tarefa?"
        description={
          <>
            A tarefa <strong className="text-ink">{task.title}</strong> será excluída de forma definitiva.
          </>
        }
        confirmLabel="Excluir tarefa"
        loading={remove.isPending}
        onConfirm={() =>
          remove.mutate(task.id, {
            onSuccess: () => {
              setConfirmOpen(false)
              toast.success('Tarefa excluída.')
            },
            onError: (e) => {
              setConfirmOpen(false)
              toast.error(e instanceof ApiError ? e.message : 'Não foi possível excluir a tarefa.')
            },
          })
        }
      />
    </li>
  )
}

export function TaskListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <ul aria-busy="true" aria-label="Carregando tarefas" className="divide-y divide-line">
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="flex items-start gap-3 py-3.5">
          <div className="tf-skeleton mt-0.5 h-6 w-6 rounded-full" aria-hidden />
          <div className="flex-1 space-y-2">
            <div className="tf-skeleton h-4 w-2/3 rounded" aria-hidden />
            <div className="tf-skeleton h-3 w-1/2 rounded" aria-hidden />
          </div>
        </li>
      ))}
    </ul>
  )
}
