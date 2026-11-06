import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { TextField } from '@/components/ui/field'
import { applyApiErrors } from '@/hooks/useFormErrors'
import { ApiError } from '@/lib/api'
import { resetPasswordSchema, type ResetPasswordValues } from '@/lib/schemas'
import { authApi } from '@/lib/services'
import { AuthLayout } from './auth-layout'

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [done, setDone] = useState(false)
  const [formError, setFormError] = useState('')
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  const onSubmit = handleSubmit(async ({ password }) => {
    setFormError('')
    try {
      await authApi.resetPassword(token, password)
      setDone(true)
    } catch (e) {
      setFormError(e instanceof ApiError ? (e.fieldErrors[0]?.message ?? e.message) : applyApiErrors(e, setError, []))
    }
  })

  if (!token) {
    return (
      <AuthLayout title="Link inválido" subtitle="O link de recuperação está incompleto. Solicite um novo.">
        <Button asChild size="lg" className="w-full">
          <Link to="/forgot-password">Solicitar novo link</Link>
        </Button>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Definir nova senha" subtitle="Escolha uma senha que você ainda não usa em outros lugares.">
      {done ? (
        <div className="flex flex-col gap-4">
          <div role="status" className="flex items-start gap-3 rounded-lg border border-line bg-surface p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden />
            <p className="text-sm">Senha redefinida. Todas as sessões anteriores foram encerradas.</p>
          </div>
          <Button asChild size="lg">
            <Link to="/login">Ir para o login</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          {formError && (
            <p role="alert" className="rounded-lg border border-danger/40 bg-danger-soft px-3 py-2 text-sm text-danger">
              {formError}{' '}
              <Link to="/forgot-password" className="underline">
                Solicitar novo link
              </Link>
            </p>
          )}
          <TextField
            label="Nova senha"
            type="password"
            autoComplete="new-password"
            hint="Mínimo de 8 caracteres, com ao menos uma letra e um número."
            error={errors.password?.message}
            {...register('password')}
          />
          <TextField
            label="Confirmar nova senha"
            type="password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
          <Button type="submit" size="lg" loading={isSubmitting}>
            Redefinir senha
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}
