import { describe, expect, it } from 'vitest'
import { dueFilterToParams, initials, isoToLocalInput, localInputToIso } from '@/lib/format'
import { passwordSchema, registerSchema, taskSchema } from '@/lib/schemas'

describe('formatação de datas', () => {
  it('converte ISO para o input local e de volta sem perder o instante', () => {
    const iso = '2026-10-28T15:30:00.000Z'
    expect(localInputToIso(isoToLocalInput(iso))).toBe(iso)
  })

  it('trata vencimento vazio como ausente', () => {
    expect(isoToLocalInput(null)).toBe('')
    expect(localInputToIso('')).toBeNull()
  })

  it('monta os parâmetros de cada filtro de prazo', () => {
    const now = new Date(2026, 9, 28, 15, 0, 0)
    expect(dueFilterToParams('all', now)).toEqual({})
    expect(dueFilterToParams('overdue', now)).toEqual({ overdue: true })
    expect(dueFilterToParams('none', now)).toEqual({ noDueDate: true })
    const today = dueFilterToParams('today', now)
    expect(today.dueFrom).toBe(new Date(2026, 9, 28).toISOString())
    expect(today.dueTo).toBe(new Date(2026, 9, 29).toISOString())
    expect(dueFilterToParams('week', now).dueTo).toBe(new Date(2026, 10, 5).toISOString())
  })

  it('gera iniciais do nome', () => {
    expect(initials('Maria da Silva Souza')).toBe('MS')
    expect(initials('José')).toBe('J')
  })
})

describe('schemas', () => {
  it('aplica as mesmas regras de senha do backend', () => {
    expect(passwordSchema.safeParse('curta1').success).toBe(false)
    expect(passwordSchema.safeParse('somenteletras').success).toBe(false)
    expect(passwordSchema.safeParse('12345678').success).toBe(false)
    expect(passwordSchema.safeParse('senha1234').success).toBe(true)
    expect(passwordSchema.safeParse('é'.repeat(37) + '1').success).toBe(false)
  })

  it('exige confirmação igual e aceite dos termos no cadastro', () => {
    const base = { name: 'Maria', email: 'maria@example.com', password: 'senha1234', confirmPassword: 'senha1234', acceptTerms: true }
    expect(registerSchema.safeParse(base).success).toBe(true)
    const mismatch = registerSchema.safeParse({ ...base, confirmPassword: 'outra1234' })
    expect(mismatch.success).toBe(false)
    expect(registerSchema.safeParse({ ...base, acceptTerms: false }).success).toBe(false)
    expect(registerSchema.safeParse({ ...base, email: 'invalido' }).success).toBe(false)
  })

  it('valida limites do título da tarefa', () => {
    const base = { title: 'ok', description: '', status: 'TODO', priority: 'LOW', categoryId: '', dueAt: '' }
    expect(taskSchema.safeParse(base).success).toBe(true)
    expect(taskSchema.safeParse({ ...base, title: '   ' }).success).toBe(false)
    expect(taskSchema.safeParse({ ...base, title: 'a'.repeat(151) }).success).toBe(false)
    expect(taskSchema.safeParse({ ...base, status: 'INVALID' }).success).toBe(false)
  })
})
