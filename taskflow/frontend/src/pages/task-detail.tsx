import { ArrowLeft, Pencil, RotateCcw, Trash2, Check, Play } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { DueLabel, useTaskActions } from '@/components/task-item'
import { CategoryChip, PriorityMark, StatusTrack } from '@/components/task-visuals'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useTask } from '@/hooks/queries'
import { ApiError } from '@/lib/api'
import { formatDateTime } from '@/lib/format'
import { TaskNotFound } from './task-form'

export function TaskDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const task = useTask(id)
  const { setStatus, remove, change } = useTaskActions()
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link to="/app/tasks" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Tarefas
      </Link>

      {task.isPending ? (
        <div className="space-y-4" aria-busy="true" aria-label="Carregando tarefa">
          <Skeleton className="h-9 w-2/3" />
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : task.isError ? (
        <TaskNotFound error={task.error} onRetry={() => void task.refetch()} />
      ) : (
        (() => {
          const t = task.data
          const done = t.status === 'DONE'
          return (
            <article className="space-y-6">
              <header className="space-y-3">
                <h1 className="text-3xl font-bold break-words">{t.title}</h1>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                  <StatusTrack status={t.status} />
                  <PriorityMark priority={t.priority} />
                  {t.category && <CategoryChip category={t.category} />}
                  <DueLabel task={t} />
                </div>
              </header>

              <div className="flex flex-wrap gap-2">
                {done ? (
                  <Button
                    loading={setStatus.isPending}
                    onClick={() => change(t, 'TODO', 'Tarefa reaberta.')}
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden />
                    Reabrir
                  </Button>
                ) : (
                  <>
                    <Button loading={setStatus.isPending} onClick={() => change(t, 'DONE', 'Tarefa concluída.')}>
                      <Check className="h-4 w-4" aria-hidden />
                      Concluir
                    </Button>
                    {t.status === 'TODO' && (
                      <Button variant="secondary" disabled={setStatus.isPending} onClick={() => change(t, 'IN_PROGRESS', 'Tarefa em andamento.')}>
                        <Play className="h-4 w-4" aria-hidden />
                        Iniciar
                      </Button>
                    )}
                  </>
                )}
                <Button asChild variant="secondary">
                  <Link to={`/app/tasks/${t.id}/edit`}>
                    <Pencil className="h-4 w-4" aria-hidden />
                    Editar
                  </Link>
                </Button>
                <Button variant="danger-ghost" onClick={() => setConfirmOpen(true)}>
                  <Trash2 className="h-4 w-4" aria-hidden />
                  Excluir
                </Button>
              </div>

              <section aria-labelledby="descricao">
                <h2 id="descricao" className="text-lg font-semibold">
                  Descrição
                </h2>
                {t.description ? (
                  <p className="mt-2 whitespace-pre-wrap break-words">{t.description}</p>
                ) : (
                  <p className="mt-2 text-sm text-muted">Sem descrição.</p>
                )}
              </section>

              <dl className="grid gap-x-8 gap-y-3 border-t border-line pt-5 text-sm sm:grid-cols-2">
                {[
                  ['Vencimento', formatDateTime(t.dueAt)],
                  ['Concluída em', formatDateTime(t.completedAt)],
                  ['Criada em', formatDateTime(t.createdAt)],
                  ['Atualizada em', formatDateTime(t.updatedAt)],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-muted">{label}</dt>
                    <dd className="font-medium">{value}</dd>
                  </div>
                ))}
              </dl>

              <ConfirmDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                title="Excluir tarefa?"
                description={
                  <>
                    A tarefa <strong className="text-ink">{t.title}</strong> será excluída de forma definitiva.
                  </>
                }
                confirmLabel="Excluir tarefa"
                loading={remove.isPending}
                onConfirm={() =>
                  remove.mutate(t.id, {
                    onSuccess: () => {
                      toast.success('Tarefa excluída.')
                      navigate('/app/tasks', { replace: true })
                    },
                    onError: (e) => {
                      setConfirmOpen(false)
                      toast.error(e instanceof ApiError ? e.message : 'Não foi possível excluir a tarefa.')
                    },
                  })
                }
              />
            </article>
          )
        })()
      )}
    </div>
  )
}
