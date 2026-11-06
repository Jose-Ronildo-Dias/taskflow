import { AlertTriangle, WifiOff } from 'lucide-react'
import type { ReactNode } from 'react'
import { ApiError } from '@/lib/api'
import { Button } from './button'

export function EmptyState({ icon, title, children, action }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-line p-8 sm:items-center sm:text-center">
      {icon && <div className="text-primary">{icon}</div>}
      <h3 className="text-lg font-semibold">{title}</h3>
      {children && <p className="max-w-md text-sm text-muted">{children}</p>}
      {action}
    </div>
  )
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const apiError = error instanceof ApiError ? error : null
  const offline = apiError?.isNetwork
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border border-danger/40 bg-danger-soft p-6">
      <div className="flex items-center gap-2 font-semibold text-danger">
        {offline ? <WifiOff className="h-5 w-5" aria-hidden /> : <AlertTriangle className="h-5 w-5" aria-hidden />}
        {offline ? 'Sem conexão com o servidor' : 'Não foi possível carregar'}
      </div>
      <p className="text-sm">{apiError?.message ?? 'Ocorreu um erro inesperado. Tente novamente em instantes.'}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Tentar novamente
        </Button>
      )}
    </div>
  )
}
