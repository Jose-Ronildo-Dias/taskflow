export interface FieldViolation {
  field: string
  message: string
}

export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: FieldViolation[]
  readonly retryAfter: number | null

  constructor(status: number, message: string, fieldErrors: FieldViolation[] = [], retryAfter: number | null = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
    this.retryAfter = retryAfter
  }

  get isNetwork() {
    return this.status === 0
  }
}

const BASE = '/api/v1'
const CSRF_COOKIE = 'XSRF-TOKEN'
const CSRF_HEADER = 'X-XSRF-TOKEN'

type UnauthorizedListener = () => void
let onUnauthorized: UnauthorizedListener | null = null

export function setUnauthorizedListener(listener: UnauthorizedListener | null) {
  onUnauthorized = listener
}

function readCookie(name: string): string | null {
  const match = document.cookie.split('; ').find((row) => row.startsWith(name + '='))
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null
}

async function ensureCsrf(force = false): Promise<string | null> {
  const existing = readCookie(CSRF_COOKIE)
  if (existing && !force) return existing
  await fetch(`${BASE}/auth/csrf`, { credentials: 'include' })
  return readCookie(CSRF_COOKIE)
}

function networkError() {
  return new ApiError(0, 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.')
}

async function toApiError(response: Response): Promise<ApiError> {
  const retryHeader = response.headers.get('Retry-After')
  const retryAfter = retryHeader && !Number.isNaN(Number(retryHeader)) ? Number(retryHeader) : null
  let message = 'Ocorreu um erro inesperado. Tente novamente em instantes.'
  let fieldErrors: FieldViolation[] = []
  try {
    const body = (await response.json()) as { message?: string; fieldErrors?: FieldViolation[] }
    if (body.message) message = body.message
    if (Array.isArray(body.fieldErrors)) fieldErrors = body.fieldErrors
  } catch {
    if (response.status === 502 || response.status === 503 || response.status === 504) {
      message = 'O servidor está indisponível no momento. Tente novamente em instantes.'
    }
  }
  return new ApiError(response.status, message, fieldErrors, retryAfter)
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  params?: Record<string, string | number | boolean | undefined | null>
  /** Quando true, um 401 não dispara o encerramento global da sessão (ex.: tela de login). */
  skipUnauthorizedHandler?: boolean
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? 'GET'
  const url = new URL(BASE + path, window.location.origin)
  for (const [key, value] of Object.entries(options.params ?? {})) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value))
  }

  const send = async (forceCsrf: boolean): Promise<Response> => {
    const headers: Record<string, string> = { Accept: 'application/json' }
    if (options.body !== undefined) headers['Content-Type'] = 'application/json'
    if (method !== 'GET') {
      const token = await ensureCsrf(forceCsrf)
      if (token) headers[CSRF_HEADER] = token
    }
    return fetch(url.pathname + url.search, {
      method,
      headers,
      credentials: 'include',
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    })
  }

  let response: Response
  try {
    response = await send(false)
    if (response.status === 403 && method !== 'GET') {
      response = await send(true)
    }
  } catch {
    throw networkError()
  }

  if (!response.ok) {
    const error = await toApiError(response)
    if (response.status === 401 && !options.skipUnauthorizedHandler) onUnauthorized?.()
    throw error
  }
  if (response.status === 204) return undefined as T
  try {
    return (await response.json()) as T
  } catch {
    return undefined as T
  }
}
