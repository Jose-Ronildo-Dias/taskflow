import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { SelectField, TextAreaField, TextField } from '@/components/ui/field'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/ui/states'
import { useCategories, useCreateTask, useTask, useUpdateTask } from '@/hooks/queries'
import { applyApiErrors } from '@/hooks/useFormErrors'
import { ApiError } from '@/lib/api'
import { isoToLocalInput, localInputToIso, PRIORITY_LABEL, PRIORITY_ORDER, STATUS_LABEL, STATUS_ORDER } from '@/lib/format'
import { taskSchema, type TaskValues } from '@/lib/schemas'
import type { Task, TaskPayload } from '@/lib/types'

const emptyValues: TaskValues = { title: '', description: '', status: 'TODO', priority: 'MEDIUM', categoryId: '', dueAt: '' }

function toValues(task: Task): TaskValues {
  return {
    title: task.title,
    description: task.description ?? '',
    status: task.status,
    priority: task.priority,
    categoryId: task.category?.id ?? '',
    dueAt: isoToLocalInput(task.dueAt),
  }
}

function toPayload(values: TaskValues): TaskPayload {
  return {
    title: values.title.trim(),
    description: values.description.trim() || null,
    status: values.status,
    priority: values.priority,
    categoryId: values.categoryId || null,
    dueAt: localInputToIso(values.dueAt),
  }
}

function TaskFormBody({ task }: { task?: Task }) {
  const navigate = useNavigate()
  const categories = useCategories()
  const create = useCreateTask()
  const update = useUpdateTask(task?.id ?? '')
  const [formError, setFormError] = useState('')

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TaskValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: task ? toValues(task) : emptyValues,
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError('')
    const payload = toPayload(values)
    try {
      const saved = task ? await update.mutateAsync(payload) : await create.mutateAsync(payload)
      toast.success(task ? 'Tarefa atualizada.' : 'Tarefa criada.')
      navigate(`/app/tasks/${saved.id}`, { replace: true })
    } catch (e) {
      const message = applyApiErrors(e, setError, ['title', 'description', 'status', 'priority', 'categoryId', 'dueAt'])
      if (e instanceof ApiError && e.status === 404 && payload.categoryId) {
        setError('categoryId', { type: 'server', message: 'Esta categoria não existe mais. Escolha outra.' })
        void categories.refetch()
        return
      }
      setFormError(message)
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {formError && (
        <p role="alert" className="rounded-lg border border-danger/40 bg-danger-soft px-3 py-2 text-sm text-danger">
          {formError}
        </p>
      )}
      <TextField label="Título" maxLength={200} autoFocus={!task} error={errors.title?.message} {...register('title')} />
      <TextAreaField
        label="Descrição (opcional)"
        error={errors.description?.message}
        {...register('description')}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField label="Status" error={errors.status?.message} {...register('status')}>
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </SelectField>
        <SelectField label="Prioridade" error={errors.priority?.message} {...register('priority')}>
          {PRIORITY_ORDER.map((p) => (
            <option key={p} value={p}>
              {PRIORITY_LABEL[p]}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Categoria"
          error={errors.categoryId?.message}
          hint={categories.isError ? 'Não foi possível carregar suas categorias.' : undefined}
          {...register('categoryId')}
        >
          <option value="">Sem categoria</option>
          {categories.data?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </SelectField>
        <TextField
          label="Vencimento (opcional)"
          type="datetime-local"
          hint="No seu horário local."
          error={errors.dueAt?.message}
          {...register('dueAt')}
        />
      </div>
      <div className="flex flex-wrap gap-3 pt-2">
        <Button type="submit" size="lg" loading={isSubmitting}>
          {task ? 'Salvar alterações' : 'Criar tarefa'}
        </Button>
        <Button asChild variant="secondary" size="lg">
          <Link to={task ? `/app/tasks/${task.id}` : '/app/tasks'}>Cancelar</Link>
        </Button>
      </div>
    </form>
  )
}

export function TaskFormPage() {
  const { id } = useParams()
  const editing = Boolean(id)
  const task = useTask(id)

  useEffect(() => {
    document.title = editing ? 'Editar tarefa · TaskFlow' : 'Nova tarefa · TaskFlow'
    return () => {
      document.title = 'TaskFlow'
    }
  }, [editing])

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link to={id ? `/app/tasks/${id}` : '/app/tasks'} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Voltar
      </Link>
      <h1 className="text-3xl font-bold">{editing ? 'Editar tarefa' : 'Nova tarefa'}</h1>
      {!editing ? (
        <TaskFormBody />
      ) : task.isPending ? (
        <div className="space-y-4" aria-busy="true" aria-label="Carregando tarefa">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : task.isError ? (
        <TaskNotFound error={task.error} onRetry={() => void task.refetch()} />
      ) : (
        <TaskFormBody task={task.data} />
      )}
    </div>
  )
}

export function TaskNotFound({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  if (error instanceof ApiError && error.status === 404) {
    return (
      <div role="alert" className="space-y-3 rounded-xl border border-line p-6">
        <h2 className="text-lg font-semibold">Tarefa não encontrada</h2>
        <p className="text-sm text-muted">Ela pode ter sido excluída ou não existir na sua conta.</p>
        <Button asChild variant="secondary">
          <Link to="/app/tasks">Ver todas as tarefas</Link>
        </Button>
      </div>
    )
  }
  return <ErrorState error={error} onRetry={onRetry} />
}
