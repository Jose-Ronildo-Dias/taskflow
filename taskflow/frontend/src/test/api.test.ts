import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, request, setUnauthorizedListener } from '@/lib/api'
import { mockApi } from './utils'

beforeEach(() => {
  document.cookie = 'XSRF-TOKEN=token-123; path=/'
})
afterEach(() => {
  vi.unstubAllGlobals()
  setUnauthorizedListener(null)
})

describe('cliente HTTP', () => {
  it('envia o token CSRF do cookie em requisições de escrita, mas não em leituras', async () => {
    const api = mockApi(() => ({ body: {} }))
    await request('/tasks')
    await request('/tasks', { method: 'POST', body: { title: 'x' } })
    const [get, post] = api.fetch.mock.calls.filter(([url]) => String(url).includes('/tasks'))
    expect((get![1] as RequestInit).headers).not.toHaveProperty('X-XSRF-TOKEN')
    expect((post![1] as RequestInit).headers).toHaveProperty('X-XSRF-TOKEN', 'token-123')
    expect((post![1] as RequestInit).credentials).toBe('include')
  })

  it('busca o cookie CSRF antes de escrever quando ele não existe', async () => {
    document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
    const api = mockApi(() => ({ status: 204 }))
    await request('/tasks/1', { method: 'DELETE' })
    expect(api.calls[0]?.path).toBe('/auth/csrf')
  })

  it('converte a resposta de erro do backend em ApiError com erros de campo', async () => {
    mockApi(() => ({
      status: 400,
      body: { message: 'Dados inválidos.', fieldErrors: [{ field: 'title', message: 'Informe o título.' }] },
    }))
    const error = (await request('/tasks', { method: 'POST', body: {} }).catch((e: unknown) => e)) as ApiError
    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(400)
    expect(error.fieldErrors).toEqual([{ field: 'title', message: 'Informe o título.' }])
  })

  it('trata falha de rede com mensagem compreensível, sem esconder o erro', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    const error = (await request('/tasks').catch((e: unknown) => e)) as ApiError
    expect(error).toBeInstanceOf(ApiError)
    expect(error.isNetwork).toBe(true)
    expect(error.message).toMatch(/conectar ao servidor/i)
  })

  it('expõe Retry-After no 429', async () => {
    mockApi(() => ({ status: 429, headers: { 'Retry-After': '120' }, body: { message: 'Muitas requisições.' } }))
    const error = (await request('/auth/login', { method: 'POST', body: {} }).catch((e: unknown) => e)) as ApiError
    expect(error.status).toBe(429)
    expect(error.retryAfter).toBe(120)
  })

  it('notifica sessão expirada em 401, exceto quando solicitado', async () => {
    const listener = vi.fn()
    setUnauthorizedListener(listener)
    mockApi(() => ({ status: 401, body: { message: 'Autenticação necessária.' } }))
    await request('/tasks').catch(() => undefined)
    expect(listener).toHaveBeenCalledTimes(1)
    await request('/auth/me', { skipUnauthorizedHandler: true }).catch(() => undefined)
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('repete uma vez uma escrita recusada com 403 após renovar o token CSRF', async () => {
    let attempts = 0
    const api = mockApi((req) => {
      if (req.path !== '/tasks') return undefined
      attempts += 1
      return attempts === 1 ? { status: 403, body: { message: 'Requisição recusada.' } } : { status: 201, body: { id: 'n' } }
    })
    const result = await request<{ id: string }>('/tasks', { method: 'POST', body: {} })
    expect(result.id).toBe('n')
    expect(api.find('POST', '/tasks')).toHaveLength(2)
    expect(api.find('GET', '/auth/csrf')).toHaveLength(1)
  })
})
