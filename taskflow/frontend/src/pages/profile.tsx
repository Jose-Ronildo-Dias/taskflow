import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { TextField } from '@/components/ui/field'
import { applyApiErrors } from '@/hooks/useFormErrors'
import { useAuth } from '@/lib/auth'
import { formatDate } from '@/lib/format'
import { changePasswordSchema, profileSchema, type ChangePasswordValues, type ProfileValues } from '@/lib/schemas'
import { userApi } from '@/lib/services'

function NameForm() {
  const { user, setUser } = useAuth()
  const [formError, setFormError] = useState('')
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileValues>({ resolver: zodResolver(profileSchema), defaultValues: { name: user?.name ?? '' } })

  const onSubmit = handleSubmit(async ({ name }) => {
    setFormError('')
    try {
      setUser(await userApi.updateName(name.trim()))
      toast.success('Nome atualizado.')
    } catch (e) {
      setFormError(applyApiErrors(e, setError, ['name']))
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="flex max-w-md flex-col gap-4">
      {formError && (
        <p role="alert" className="text-sm text-danger">
          {formError}
        </p>
      )}
      <TextField label="Nome" autoComplete="name" error={errors.name?.message} {...register('name')} />
      <TextField
        label="E-mail"
        value={user?.email ?? ''}
        readOnly
        hint="O e-mail não pode ser alterado por aqui."
      />
      <div>
        <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
          Salvar nome
        </Button>
      </div>
    </form>
  )
}

function PasswordForm() {
  const [formError, setFormError] = useState('')
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  const onSubmit = handleSubmit(async ({ currentPassword, newPassword }) => {
    setFormError('')
    try {
      await userApi.changePassword(currentPassword, newPassword)
      toast.success('Senha alterada. Seus outros dispositivos foram desconectados.')
      reset()
    } catch (e) {
      setFormError(applyApiErrors(e, setError, ['currentPassword', 'newPassword']))
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="flex max-w-md flex-col gap-4">
      {formError && (
        <p role="alert" className="text-sm text-danger">
          {formError}
        </p>
      )}
      <TextField
        label="Senha atual"
        type="password"
        autoComplete="current-password"
        error={errors.currentPassword?.message}
        {...register('currentPassword')}
      />
      <TextField
        label="Nova senha"
        type="password"
        autoComplete="new-password"
        hint="Mínimo de 8 caracteres, com ao menos uma letra e um número."
        error={errors.newPassword?.message}
        {...register('newPassword')}
      />
      <TextField
        label="Confirmar nova senha"
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />
      <div>
        <Button type="submit" loading={isSubmitting}>
          Alterar senha
        </Button>
      </div>
    </form>
  )
}

export function ProfilePage() {
  const { user } = useAuth()
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold">Perfil</h1>
        <p className="mt-1 text-muted">Conta criada em {formatDate(user?.createdAt)}.</p>
      </div>
      <section aria-labelledby="dados">
        <h2 id="dados" className="mb-4 text-xl font-semibold">
          Seus dados
        </h2>
        <NameForm />
      </section>
      <section aria-labelledby="senha" className="border-t border-line pt-8">
        <h2 id="senha" className="mb-4 text-xl font-semibold">
          Alterar senha
        </h2>
        <PasswordForm />
      </section>
    </div>
  )
}
