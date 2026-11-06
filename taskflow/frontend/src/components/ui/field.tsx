import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const controlBase =
  'w-full rounded-lg border bg-surface px-3 text-sm text-ink placeholder:text-muted/80 transition-colors disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-primary'

interface FieldShellProps {
  label: string
  error?: string | undefined
  hint?: string
  hideLabel?: boolean
  children: (props: { id: string; describedBy: string | undefined; invalid: boolean }) => ReactNode
  className?: string
}

export function FieldShell({ label, error, hint, hideLabel, children, className }: FieldShellProps) {
  const id = useId()
  const messageId = `${id}-msg`
  const hasMessage = Boolean(error || hint)
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className={cn('text-sm font-medium', hideLabel && 'sr-only')}>
        {label}
      </label>
      {children({ id, describedBy: hasMessage ? messageId : undefined, invalid: Boolean(error) })}
      {error ? (
        <p id={messageId} role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className="text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string
  error?: string | undefined
  hint?: string
  trailing?: ReactNode
  leading?: ReactNode
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, hint, trailing, leading, className, ...props }, ref) => (
    <FieldShell label={label} error={error} {...(hint ? { hint } : {})} className={className}>
      {({ id, describedBy, invalid }) => (
        <div className="relative">
          {leading && <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">{leading}</div>}
          <input
            ref={ref}
            id={id}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            className={cn(controlBase, 'h-10', invalid ? 'border-danger' : 'border-line', trailing ? 'pr-10' : '', leading ? 'pl-9' : '')}
            {...props}
          />
          {trailing && <div className="absolute inset-y-0 right-1 flex items-center">{trailing}</div>}
        </div>
      )}
    </FieldShell>
  ),
)
TextField.displayName = 'TextField'

interface TextAreaFieldProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label: string
  error?: string | undefined
  hint?: string
}

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  ({ label, error, hint, className, ...props }, ref) => (
    <FieldShell label={label} error={error} {...(hint ? { hint } : {})} className={className}>
      {({ id, describedBy, invalid }) => (
        <textarea
          ref={ref}
          id={id}
          rows={4}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={cn(controlBase, 'py-2 resize-y', invalid ? 'border-danger' : 'border-line')}
          {...props}
        />
      )}
    </FieldShell>
  ),
)
TextAreaField.displayName = 'TextAreaField'

interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  label: string
  error?: string | undefined
  hint?: string
  hideLabel?: boolean
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, error, hint, hideLabel, className, children, ...props }, ref) => (
    <FieldShell label={label} error={error} {...(hint ? { hint } : {})} {...(hideLabel ? { hideLabel } : {})} className={className}>
      {({ id, describedBy, invalid }) => (
        <select
          ref={ref}
          id={id}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={cn(controlBase, 'h-10 cursor-pointer', invalid ? 'border-danger' : 'border-line')}
          {...props}
        >
          {children}
        </select>
      )}
    </FieldShell>
  ),
)
SelectField.displayName = 'SelectField'

interface CheckFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'type'> {
  label: ReactNode
  error?: string | undefined
}

export const CheckField = forwardRef<HTMLInputElement, CheckFieldProps>(({ label, error, className, ...props }, ref) => {
  const id = useId()
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-start gap-2.5">
        <input
          ref={ref}
          id={id}
          type="checkbox"
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? `${id}-msg` : undefined}
          className="mt-0.5 h-4 w-4 cursor-pointer accent-[var(--primary)]"
          {...props}
        />
        <label htmlFor={id} className="text-sm leading-snug">
          {label}
        </label>
      </div>
      {error && (
        <p id={`${id}-msg`} role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
})
CheckField.displayName = 'CheckField'
