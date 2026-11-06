import { zodResolver } from '@hookform/resolvers/zod'
import { FolderPlus, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { TextField } from '@/components/ui/field'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, ErrorState } from '@/components/ui/states'
import { useCategories, useDeleteCategory, useSaveCategory } from '@/hooks/queries'
import { applyApiErrors } from '@/hooks/useFormErrors'
import { ApiError } from '@/lib/api'
import { categorySchema, type CategoryValues } from '@/lib/schemas'
import type { Category } from '@/lib/types'

const DEFAULT_COLOR = '#0d6b7c'

function CategoryForm({ category, onDone }: { category?: Category; onDone: () => void }) {
  const save = useSaveCategory()
  const [formError, setFormError] = useState('')
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: category?.name ?? '', color: category?.color ?? DEFAULT_COLOR },
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError('')
    try {
      await save.mutateAsync({ ...(category ? { id: category.id } : {}), name: values.name.trim(), color: values.color })
      toast.success(category ? 'Categoria atualizada.' : 'Categoria criada.')
      reset({ name: '', color: DEFAULT_COLOR })
      onDone()
    } catch (e) {
      const message = applyApiErrors(e, setError, ['name', 'color'])
      if (e instanceof ApiError && e.status === 409) setError('name', { type: 'server', message: e.message })
      else setFormError(message)
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-wrap items-start gap-3">
      <TextField
        label="Nome da categoria"
        maxLength={80}
        className="min-w-48 flex-1"
        error={errors.name?.message}
        {...register('name')}
      />
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`color-${category?.id ?? 'new'}`} className="text-sm font-medium">
          Cor
        </label>
        <input
          id={`color-${category?.id ?? 'new'}`}
          type="color"
          className="h-10 w-14 cursor-pointer rounded-lg border border-line bg-surface p-1"
          {...register('color')}
        />
      </div>
      <div className="mt-[1.65rem] flex gap-2">
        <Button type="submit" loading={isSubmitting} className="h-10">
          {category ? 'Salvar' : 'Criar categoria'}
        </Button>
        {category && (
          <Button variant="secondary" className="h-10" onClick={onDone}>
            Cancelar
          </Button>
        )}
      </div>
      {formError && (
        <p role="alert" className="w-full text-sm text-danger">
          {formError}
        </p>
      )}
    </form>
  )
}

export function CategoriesPage() {
  const categories = useCategories()
  const remove = useDeleteCategory()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<Category | null>(null)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Categorias</h1>
        <p className="mt-1 text-muted">Agrupe suas tarefas por projeto, cliente ou assunto.</p>
      </div>

      <section aria-labelledby="nova-cat" className="rounded-xl border border-line bg-surface p-4 sm:p-5">
        <h2 id="nova-cat" className="mb-3 text-lg font-semibold">
          Nova categoria
        </h2>
        <CategoryForm onDone={() => undefined} />
      </section>

      {categories.isPending ? (
        <div className="space-y-3" aria-busy="true" aria-label="Carregando categorias">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : categories.isError ? (
        <ErrorState error={categories.error} onRetry={() => void categories.refetch()} />
      ) : categories.data.length === 0 ? (
        <EmptyState icon={<FolderPlus className="h-8 w-8" aria-hidden />} title="Nenhuma categoria ainda">
          Crie a primeira categoria no formulário acima e depois associe-a às suas tarefas.
        </EmptyState>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {categories.data.map((c) => (
            <li key={c.id} className="py-3">
              {editingId === c.id ? (
                <CategoryForm category={c} onDone={() => setEditingId(null)} />
              ) : (
                <div className="flex items-center gap-3">
                  <span
                    className="h-4 w-4 shrink-0 rounded-full border border-line"
                    style={{ backgroundColor: c.color ?? 'transparent' }}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{c.name}</p>
                    <Link to={`/app/tasks?categoryId=${c.id}`} className="text-sm text-muted hover:text-ink hover:underline">
                      {c.taskCount} {c.taskCount === 1 ? 'tarefa' : 'tarefas'}
                    </Link>
                  </div>
                  <Button variant="ghost" size="icon" aria-label={`Editar categoria ${c.name}`} onClick={() => setEditingId(c.id)}>
                    <Pencil className="h-4 w-4" aria-hidden />
                  </Button>
                  <Button variant="danger-ghost" size="icon" aria-label={`Excluir categoria ${c.name}`} onClick={() => setToDelete(c)}>
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Excluir categoria?"
        description={
          toDelete && (
            <>
              A categoria <strong className="text-ink">{toDelete.name}</strong> será excluída.{' '}
              {toDelete.taskCount > 0
                ? `As ${toDelete.taskCount} tarefas associadas não serão excluídas: elas ficarão sem categoria.`
                : 'Nenhuma tarefa está associada a ela.'}
            </>
          )
        }
        confirmLabel="Excluir categoria"
        loading={remove.isPending}
        onConfirm={() =>
          toDelete &&
          remove.mutate(toDelete.id, {
            onSuccess: () => {
              toast.success('Categoria excluída.')
              setToDelete(null)
            },
            onError: (e) => {
              setToDelete(null)
              toast.error(e instanceof ApiError ? e.message : 'Não foi possível excluir a categoria.')
            },
          })
        }
      />
    </div>
  )
}
