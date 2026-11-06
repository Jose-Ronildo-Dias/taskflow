import { lazy } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router'
import { Toaster } from 'sonner'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/ui/states'
import { useAuth } from '@/lib/auth'
import { useTheme } from '@/lib/theme'
import { ForgotPasswordPage } from '@/pages/forgot-password'
import { LandingPage } from '@/pages/landing'
import { PrivacyPage, TermsPage } from '@/pages/legal'
import { LoginPage } from '@/pages/login'
import { NotFoundPage } from '@/pages/not-found'
import { RegisterPage } from '@/pages/register'
import { ResetPasswordPage } from '@/pages/reset-password'

const lazyPage = <K extends string>(load: () => Promise<Record<K, React.ComponentType>>, name: K) =>
  lazy(async () => ({ default: (await load())[name] }))

const CategoriesPage = lazyPage(() => import('@/pages/categories'), 'CategoriesPage')
const DashboardPage = lazyPage(() => import('@/pages/dashboard'), 'DashboardPage')
const ProfilePage = lazyPage(() => import('@/pages/profile'), 'ProfilePage')
const SettingsPage = lazyPage(() => import('@/pages/settings'), 'SettingsPage')
const TaskDetailPage = lazyPage(() => import('@/pages/task-detail'), 'TaskDetailPage')
const TaskFormPage = lazyPage(() => import('@/pages/task-form'), 'TaskFormPage')
const TasksPage = lazyPage(() => import('@/pages/tasks'), 'TasksPage')

export function RequireAuth() {
  const { user, loading, error, retry } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-8" aria-busy="true" aria-label="Carregando">
        <Skeleton className="h-9 w-1/3" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }
  if (error) {
    return (
      <div className="mx-auto max-w-lg p-8">
        <ErrorState error={error} onRetry={retry} />
      </div>
    )
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }
  return <Outlet />
}

export function App() {
  const { preference } = useTheme()
  return (
    <>
      <Button
        asChild
        variant="secondary"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
      >
        <a href="#conteudo">Ir para o conteúdo</a>
      </Button>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/app" element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="tasks/new" element={<TaskFormPage />} />
            <Route path="tasks/:id" element={<TaskDetailPage />} />
            <Route path="tasks/:id/edit" element={<TaskFormPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toaster position="bottom-right" theme={preference} richColors closeButton />
    </>
  )
}
