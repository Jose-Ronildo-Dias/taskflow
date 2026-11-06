import { Flag, Tag } from 'lucide-react'
import { PRIORITY_LABEL, STATUS_LABEL, STATUS_ORDER } from '@/lib/format'
import type { CategorySummary, TaskPriority, TaskStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

/** A trilha de três etapas é a assinatura visual do produto: mostra onde a tarefa está no fluxo. */
export function StatusTrack({ status, className }: { status: TaskStatus; className?: string }) {
  const index = STATUS_ORDER.indexOf(status)
  return (
    <span className={cn('inline-flex items-center gap-2 text-xs font-medium text-muted', className)}>
      <svg width="46" height="12" viewBox="0 0 46 12" aria-hidden>
        <line x1="6" y1="6" x2="40" y2="6" stroke="var(--line)" strokeWidth="2" />
        <line x1="6" y1="6" x2={6 + index * 17} y2="6" stroke="var(--primary)" strokeWidth="2" />
        {STATUS_ORDER.map((s, i) => (
          <circle
            key={s}
            cx={6 + i * 17}
            cy="6"
            r={i === index ? 5 : 3.5}
            fill={i <= index ? 'var(--primary)' : 'var(--surface)'}
            stroke={i <= index ? 'var(--primary)' : 'var(--line)'}
            strokeWidth="2"
          />
        ))}
      </svg>
      <span className={cn(status === 'DONE' && 'text-success')}>{STATUS_LABEL[status]}</span>
    </span>
  )
}

const priorityStyle: Record<TaskPriority, string> = {
  LOW: 'text-muted',
  MEDIUM: 'text-primary',
  HIGH: 'text-[#9a5f0c] dark:text-accent',
  URGENT: 'text-danger',
}

export function PriorityMark({ priority, className }: { priority: TaskPriority; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium', priorityStyle[priority], className)}>
      <Flag className="h-3.5 w-3.5" aria-hidden fill={priority === 'URGENT' || priority === 'HIGH' ? 'currentColor' : 'none'} />
      <span className="sr-only">Prioridade </span>
      {PRIORITY_LABEL[priority]}
    </span>
  )
}

export function CategoryChip({ category, className }: { category: CategorySummary; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium text-muted', className)}>
      {category.color ? (
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: category.color }} aria-hidden />
      ) : (
        <Tag className="h-3.5 w-3.5" aria-hidden />
      )}
      <span className="sr-only">Categoria </span>
      {category.name}
    </span>
  )
}
