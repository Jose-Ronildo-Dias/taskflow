import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { ApiError } from '@/lib/api'

/**
 * Aplica os erros de campo devolvidos pelo backend ao formulário. Retorna a mensagem geral
 * quando o erro não pertence a nenhum campo conhecido.
 */
export function applyApiErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  knownFields: readonly string[],
): string {
  if (!(error instanceof ApiError)) return 'Ocorreu um erro inesperado. Tente novamente em instantes.'
  let matched = false
  for (const violation of error.fieldErrors) {
    if (knownFields.includes(violation.field)) {
      setError(violation.field as Path<T>, { type: 'server', message: violation.message })
      matched = true
    }
  }
  if (error.status === 429 && error.retryAfter) {
    const minutes = Math.ceil(error.retryAfter / 60)
    return `${error.message} Tente novamente em cerca de ${minutes} minuto${minutes > 1 ? 's' : ''}.`
  }
  return matched ? '' : error.message
}
