import { Monitor, Moon, Sun } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { TextField } from '@/components/ui/field'
import { ApiError } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { deleteAccountSchema } from '@/lib/schemas'
import { userApi } from '@/lib/services'
import { useTheme, type ThemePreference } from '@/lib/theme'
import { cn } from '@/lib/utils'

const themes: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Escuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: Monitor },
]

export function SettingsPage() {
  const { preference, setPreference } = useTheme()
  const { logout, clearSession } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  const onLogout = async () => {
    try {
      await logout()
    } catch {
      toast.error('Não foi possível encerrar a sessão no servidor. Sua sessão local foi limpa.')
    }
    navigate('/login', { replace: true })
  }

  const onDelete = async () => {
    const parsed = deleteAccountSchema.safeParse({ password })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Informe sua senha.')
      return
    }
    setError('')
    setDeleting(true)
    try {
      await userApi.deleteAccount(parsed.data.password)
      clearSession()
      toast.success('Sua conta foi excluída.')
      navigate('/', { replace: true })
    } catch (e) {
      setError(e instanceof ApiError ? (e.fieldErrors[0]?.message ?? e.message) : 'Não foi possível excluir a conta.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-bold">Ajustes</h1>

      <section aria-labelledby="tema">
        <h2 id="tema" className="text-xl font-semibold">
          Aparência
        </h2>
        <div role="radiogroup" aria-labelledby="tema" className="mt-4 flex flex-wrap gap-2">
          {themes.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={preference === value}
              onClick={() => setPreference(value)}
              className={cn(
                'inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors',
                preference === value ? 'border-primary bg-primary-soft text-primary' : 'border-line bg-surface hover:bg-surface-2',
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-sm text-muted">A escolha fica salva neste navegador.</p>
      </section>

      <section aria-labelledby="sessao" className="border-t border-line pt-8">
        <h2 id="sessao" className="text-xl font-semibold">
          Sessão
        </h2>
        <Button variant="secondary" className="mt-4" onClick={onLogout}>
          Sair da conta
        </Button>
      </section>

      <section aria-labelledby="perigo" className="border-t border-line pt-8">
        <h2 id="perigo" className="text-xl font-semibold text-danger">
          Excluir conta
        </h2>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Remove definitivamente seu cadastro, todas as suas tarefas e categorias. Essa ação não pode ser desfeita.
        </p>
        <Button variant="danger" className="mt-4" onClick={() => setOpen(true)}>
          Excluir minha conta
        </Button>
      </section>

      <ConfirmDialog
        open={open}
        onOpenChange={(value) => {
          setOpen(value)
          if (!value) {
            setPassword('')
            setError('')
          }
        }}
        title="Excluir sua conta?"
        description="Digite sua senha para confirmar. Todos os seus dados serão apagados de forma definitiva."
        confirmLabel="Excluir conta definitivamente"
        loading={deleting}
        onConfirm={onDelete}
      >
        <TextField
          label="Senha"
          type="password"
          autoComplete="current-password"
          className="mt-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={error}
        />
      </ConfirmDialog>
    </div>
  )
}
