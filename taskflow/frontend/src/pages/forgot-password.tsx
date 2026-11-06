import { zodResolver } from '@hookform/resolvers/zod'
import { MailCheck } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { TextField } from '@/components/ui/field'
import { applyApiErrors } from '@/hooks/useFormErrors'
import { authApi } from '@/lib/services'
import { forgotPasswordSchema, type ForgotPasswordValues } from '@/lib/schemas'
import { AuthLayout } from './auth-layout'

export function ForgotPasswordPage() {
  const [sentMessage, setSentMessage] = useState('')
  const [formError, setFormError] = useState('')
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: '' } })

  const onSubmit = handleSubmit(async ({ email }) => {
    setFormError('')
    try {
      const response = await authApi.forgotPassword(email)
      setSentMessage(response.message)
    } catch (e) {
      setFormError(applyApiErrors(e, setError, ['email']))
    }
  })

  return (
    <AuthLayout
      title="Recuperar senha"
      subtitle="Informe o e-mail da sua conta para receber o link de redefinição."
      footer={
        <Link to="/login" className="font-medium text-primary underline">
          Voltar para o login
        </Link>
      }
    >
      {sentMessage ? (
        <div role="status" className="flex items-start gap-3 rounded-lg border border-line bg-surface p-4">
          <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
          <p className="text-sm">{sentMessage} O link vale por 1 hora e só pode ser usado uma vez.</p>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          {formError && (
            <p role="alert" className="rounded-lg border border-danger/40 bg-danger-soft px-3 py-2 text-sm text-danger">
              {formError}
            </p>
          )}
          <TextField label="E-mail" type="email" autoComplete="email" inputMode="email" error={errors.email?.message} {...register('email')} />
          <Button type="submit" size="lg" loading={isSubmitting}>
            Enviar link de redefinição
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}
