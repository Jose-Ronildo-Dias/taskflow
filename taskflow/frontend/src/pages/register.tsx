import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { CheckField, TextField } from '@/components/ui/field'
import { applyApiErrors } from '@/hooks/useFormErrors'
import { useAuth } from '@/lib/auth'
import { registerSchema, type RegisterValues } from '@/lib/schemas'
import { AuthLayout } from './auth-layout'

export function RegisterPage() {
  const { user, register: registerUser } = useAuth()
  const navigate = useNavigate()
  const [show, setShow] = useState(false)
  const [formError, setFormError] = useState('')

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '', acceptTerms: false },
  })

  if (user) return <Navigate to="/app/dashboard" replace />

  const onSubmit = handleSubmit(async (values) => {
    setFormError('')
    try {
      await registerUser(values)
      navigate('/app/dashboard', { replace: true })
    } catch (e) {
      setFormError(applyApiErrors(e, setError, ['name', 'email', 'password', 'confirmPassword', 'acceptTerms']))
    }
  })

  return (
    <AuthLayout
      title="Criar conta"
      subtitle="Leva menos de um minuto."
      footer={
        <>
          Já tem conta?{' '}
          <Link to="/login" className="font-medium text-primary underline">
            Entrar
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {formError && (
          <p role="alert" className="rounded-lg border border-danger/40 bg-danger-soft px-3 py-2 text-sm text-danger">
            {formError}
          </p>
        )}
        <TextField label="Nome completo" autoComplete="name" error={errors.name?.message} {...register('name')} />
        <TextField label="E-mail" type="email" autoComplete="email" inputMode="email" error={errors.email?.message} {...register('email')} />
        <TextField
          label="Senha"
          type={show ? 'text' : 'password'}
          autoComplete="new-password"
          hint="Mínimo de 8 caracteres, com ao menos uma letra e um número."
          error={errors.password?.message}
          trailing={
            <Button
              variant="ghost"
              size="icon"
              aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
              aria-pressed={show}
              onClick={() => setShow((v) => !v)}
            >
              {show ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
            </Button>
          }
          {...register('password')}
        />
        <TextField
          label="Confirmar senha"
          type={show ? 'text' : 'password'}
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <CheckField
          error={errors.acceptTerms?.message}
          label={
            <>
              Li e aceito os{' '}
              <Link to="/terms" target="_blank" className="text-primary underline">
                termos de uso
              </Link>{' '}
              e a{' '}
              <Link to="/privacy" target="_blank" className="text-primary underline">
                política de privacidade
              </Link>
              .
            </>
          }
          {...register('acceptTerms')}
        />
        <Button type="submit" size="lg" loading={isSubmitting}>
          Criar conta
        </Button>
      </form>
    </AuthLayout>
  )
}
