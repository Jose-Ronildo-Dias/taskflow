import { FolderKanban, LayoutDashboard, ListChecks, LogOut, Plus, Settings, UserRound } from 'lucide-react'
import { Suspense } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth'
import { initials } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Logo } from './logo'
import { Button } from './ui/button'
import { Skeleton } from './ui/skeleton'

function PageFallback() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Carregando página">
      <Skeleton className="h-9 w-1/3" />
      <Skeleton className="h-40 w-full" />
    </div>
  )
}

const nav = [
  { to: '/app/dashboard', label: 'Painel', icon: LayoutDashboard },
  { to: '/app/tasks', label: 'Tarefas', icon: ListChecks },
  { to: '/app/categories', label: 'Categorias', icon: FolderKanban },
  { to: '/app/profile', label: 'Perfil', icon: UserRound },
  { to: '/app/settings', label: 'Ajustes', icon: Settings },
]

function NavItems({ vertical }: { vertical: boolean }) {
  return (
    <>
      {nav.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/app/tasks'}
          className={({ isActive }) =>
            cn(
              'flex items-center rounded-lg text-sm font-medium transition-colors',
              vertical ? 'gap-3 px-3 py-2' : 'flex-1 flex-col gap-0.5 py-2 text-[11px]',
              isActive ? 'bg-primary-soft text-primary' : 'text-muted hover:bg-surface-2 hover:text-ink',
            )
          }
        >
          <Icon className={vertical ? 'h-[18px] w-[18px]' : 'h-5 w-5'} aria-hidden />
          {label}
        </NavLink>
      ))}
    </>
  )
}

export function AppShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const onLogout = async () => {
    try {
      await logout()
    } catch {
      toast.error('Não foi possível encerrar a sessão no servidor. Sua sessão local foi limpa.')
    }
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[15rem_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-surface p-4 md:flex">
        <Logo to="/app/dashboard" className="px-2 py-1" />
        <Button asChild className="mt-6">
          <NavLink to="/app/tasks/new">
            <Plus className="h-4 w-4" aria-hidden />
            Nova tarefa
          </NavLink>
        </Button>
        <nav aria-label="Principal" className="mt-6 flex flex-col gap-1">
          <NavItems vertical />
        </nav>
        <div className="mt-auto border-t border-line pt-4">
          <div className="flex items-center gap-3 px-1">
            <span
              aria-hidden
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary"
            >
              {user ? initials(user.name) : '?'}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user?.name}</p>
              <p className="truncate text-xs text-muted">{user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="mt-3 w-full justify-start" onClick={onLogout}>
            <LogOut className="h-4 w-4" aria-hidden />
            Sair
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col pb-20 md:pb-0">
        <header className="flex items-center justify-between border-b border-line bg-surface px-4 py-3 md:hidden">
          <Logo to="/app/dashboard" />
          <div className="flex items-center gap-1">
            <Button asChild size="sm">
              <NavLink to="/app/tasks/new">
                <Plus className="h-4 w-4" aria-hidden />
                Nova
              </NavLink>
            </Button>
            <Button variant="ghost" size="icon" aria-label="Sair" onClick={onLogout}>
              <LogOut className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </header>
        <main id="conteudo" className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 md:px-8 md:py-10">
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-30 flex gap-1 border-t border-line bg-surface px-2 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] md:hidden"
      >
        <NavItems vertical={false} />
      </nav>
    </div>
  )
}
