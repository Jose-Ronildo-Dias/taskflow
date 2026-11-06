import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { ApiError, setUnauthorizedListener } from './api'
import { authApi } from './services'
import type { RegisterPayload, User } from './types'

interface AuthContextValue {
  user: User | null
  loading: boolean
  /** Falha ao consultar a sessão por motivo diferente de "não autenticado" (rede, servidor). */
  error: ApiError | null
  login: (email: string, password: string) => Promise<User>
  register: (payload: RegisterPayload) => Promise<User>
  logout: () => Promise<void>
  setUser: (user: User) => void
  clearSession: () => void
  retry: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)
const ME_KEY = ['auth', 'me'] as const

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()

  const meQuery = useQuery<User | null, ApiError>({
    queryKey: ME_KEY,
    queryFn: async () => {
      try {
        return await authApi.me()
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) return null
        throw e
      }
    },
    retry: (count, e) => !(e instanceof ApiError && e.status !== 0 && e.status < 500) && count < 1,
    staleTime: Infinity,
  })

  const clearSession = useCallback(() => {
    queryClient.setQueryData(ME_KEY, null)
    queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== 'auth' })
  }, [queryClient])

  useEffect(() => {
    setUnauthorizedListener(clearSession)
    return () => setUnauthorizedListener(null)
  }, [clearSession])

  const login = useCallback(
    async (email: string, password: string) => {
      const user = await authApi.login({ email, password })
      queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== 'auth' })
      queryClient.setQueryData(ME_KEY, user)
      return user
    },
    [queryClient],
  )

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const user = await authApi.register(payload)
      queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== 'auth' })
      queryClient.setQueryData(ME_KEY, user)
      return user
    },
    [queryClient],
  )

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      clearSession()
    }
  }, [clearSession])

  const setUser = useCallback((user: User) => queryClient.setQueryData(ME_KEY, user), [queryClient])
  const retry = useCallback(() => void meQuery.refetch(), [meQuery])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: meQuery.data ?? null,
      loading: meQuery.isPending,
      error: meQuery.isError ? meQuery.error : null,
      login,
      register,
      logout,
      setUser,
      clearSession,
      retry,
    }),
    [meQuery.data, meQuery.isPending, meQuery.isError, meQuery.error, login, register, logout, setUser, clearSession, retry],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
