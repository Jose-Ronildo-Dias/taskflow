import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { TextField } from '@/components/ui/field'
import { applyApiErrors } from '@/hooks/useFormErrors'
import { useAuth } from '@/lib/auth'
import { loginSchema, type LoginValues } from '@/lib/schemas'
import { AuthLayout } from './auth-layout'

export function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [show, setShow] = useState(false)
  const [formError, setFormError] = useState('')
  const from = (location.state as { from?: string } | null)?.from ?? '/app/dashboard'

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } })

  if (user) return <Navigate to="/app/dashboard" replace />

  const onSubmit = handleSubmit(async (values) => {
    setFormError('')
    try {
      await login(values.email, values.password)
      navigate(from, { replace: true })
    } catch (e) {
      setFormError(applyApiErrors(e, setError, ['email', 'password']))
    }
  })

  return (
    <AuthLayout
      title="Entrar"
      subtitle="Acesse suas tarefas."
      footer={
        <>
          Ainda não tem conta?{' '}
          <Link to="/register" className="font-medium text-primary underline">
            Criar conta
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
        <TextField label="E-mail" type="email" autoComplete="email" inputMode="email" error={errors.email?.message} {...register('email')} />
        <TextField
          label="Senha"
          type={show ? 'text' : 'password'}
          autoComplete="current-password"
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
        <div className="text-right text-sm">
          <Link to="/forgot-password" className="text-primary underline">
            Esqueci minha senha
          </Link>
        </div>
        <Button type="submit" size="lg" loading={isSubmitting}>
          Entrar
        </Button>
      </form>
    </AuthLayout>
  )
}
