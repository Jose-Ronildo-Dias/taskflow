import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { emptySummary, mockApi, renderApp, user } from './utils'

beforeEach(() => {
  document.cookie = 'XSRF-TOKEN=tok; path=/'
})
afterEach(() => vi.unstubAllGlobals())

const unauthenticated = { status: 401, body: { message: 'Autenticação necessária.' } }

describe('proteção de rotas', () => {
  it('redireciona visitante sem sessão para o login e não carrega dados privados', async () => {
    const api = mockApi((req) => (req.path === '/auth/me' ? unauthenticated : undefined))
    renderApp('/app/tasks')
    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
    expect(api.find('GET', '/tasks')).toHaveLength(0)
  })

  it('mostra erro de conexão com opção de tentar de novo quando o servidor está indisponível', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    renderApp('/app/dashboard')
    expect(await screen.findByText(/sem conexão com o servidor/i, undefined, { timeout: 5000 })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeInTheDocument()
  })

  it('redireciona usuário já autenticado do login para o painel', async () => {
    mockApi((req) => {
      if (req.path === '/auth/me') return { body: user }
      if (req.path === '/dashboard/summary') return { body: emptySummary }
      return undefined
    })
    renderApp('/login')
    expect(await screen.findByRole('heading', { name: /olá, maria/i })).toBeInTheDocument()
  })
})

describe('login', () => {
  it('valida campos antes de enviar', async () => {
    const api = mockApi((req) => (req.path === '/auth/me' ? unauthenticated : undefined))
    renderApp('/login')
    await userEvent.click(await screen.findByRole('button', { name: 'Entrar' }))
    expect(await screen.findByText('Informe seu e-mail.')).toBeInTheDocument()
    expect(screen.getByText('Informe sua senha.')).toBeInTheDocument()
    expect(api.find('POST', '/auth/login')).toHaveLength(0)
  })

  it('autentica no backend e abre o painel', async () => {
    let logged = false
    const api = mockApi((req) => {
      if (req.path === '/auth/me') return logged ? { body: user } : unauthenticated
      if (req.method === 'POST' && req.path === '/auth/login') {
        logged = true
        return { body: user }
      }
      if (req.path === '/dashboard/summary') return { body: emptySummary }
      return undefined
    })
    renderApp('/login')
    await userEvent.type(await screen.findByLabelText('E-mail'), 'maria@example.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'senha1234')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByRole('heading', { name: /olá, maria/i })).toBeInTheDocument()
    expect(api.find('POST', '/auth/login')[0]?.body).toEqual({ email: 'maria@example.com', password: 'senha1234' })
  })

  it('exibe a mensagem genérica do servidor para credenciais inválidas', async () => {
    mockApi((req) => {
      if (req.path === '/auth/me') return unauthenticated
      if (req.path === '/auth/login') return { status: 401, body: { message: 'E-mail ou senha inválidos.' } }
      return undefined
    })
    renderApp('/login')
    await userEvent.type(await screen.findByLabelText('E-mail'), 'maria@example.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'errada123')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha inválidos.')
    expect(screen.getByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
  })

  it('alterna a visibilidade da senha', async () => {
    mockApi((req) => (req.path === '/auth/me' ? unauthenticated : undefined))
    renderApp('/login')
    const input = await screen.findByLabelText('Senha')
    expect(input).toHaveAttribute('type', 'password')
    await userEvent.click(screen.getByRole('button', { name: 'Mostrar senha' }))
    expect(input).toHaveAttribute('type', 'text')
  })
})

describe('cadastro', () => {
  it('bloqueia o envio com dados inválidos e não chama o backend', async () => {
    const api = mockApi((req) => (req.path === '/auth/me' ? unauthenticated : undefined))
    renderApp('/register')
    await userEvent.type(await screen.findByLabelText('Nome completo'), 'Maria')
    await userEvent.type(screen.getByLabelText('E-mail'), 'email-invalido')
    await userEvent.type(screen.getByLabelText('Senha'), 'curta')
    await userEvent.type(screen.getByLabelText('Confirmar senha'), 'diferente')
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))
    expect(await screen.findByText('Informe um e-mail válido.')).toBeInTheDocument()
    expect(screen.getByText('A senha deve ter no mínimo 8 caracteres.')).toBeInTheDocument()
    expect(screen.getByText('A confirmação não confere com a senha.')).toBeInTheDocument()
    expect(screen.getByText(/aceitar os termos/i)).toBeInTheDocument()
    expect(api.find('POST', '/auth/register')).toHaveLength(0)
  })

  it('só conclui o cadastro após a resposta do backend e mostra e-mail duplicado', async () => {
    mockApi((req) => {
      if (req.path === '/auth/me') return unauthenticated
      if (req.path === '/auth/register') return { status: 409, body: { message: 'Já existe uma conta cadastrada com este e-mail.' } }
      return undefined
    })
    renderApp('/register')
    await userEvent.type(await screen.findByLabelText('Nome completo'), 'Maria Souza')
    await userEvent.type(screen.getByLabelText('E-mail'), 'maria@example.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'senha1234')
    await userEvent.type(screen.getByLabelText('Confirmar senha'), 'senha1234')
    await userEvent.click(screen.getByRole('checkbox'))
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Já existe uma conta cadastrada com este e-mail.')
    expect(screen.getByRole('heading', { name: 'Criar conta' })).toBeInTheDocument()
  })

  it('cria a conta, inicia a sessão e vai para o painel', async () => {
    let logged = false
    const api = mockApi((req) => {
      if (req.path === '/auth/me') return logged ? { body: user } : unauthenticated
      if (req.path === '/auth/register') {
        logged = true
        return { status: 201, body: user }
      }
      if (req.path === '/dashboard/summary') return { body: emptySummary }
      return undefined
    })
    renderApp('/register')
    await userEvent.type(await screen.findByLabelText('Nome completo'), 'Maria Souza')
    await userEvent.type(screen.getByLabelText('E-mail'), 'maria@example.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'senha1234')
    await userEvent.type(screen.getByLabelText('Confirmar senha'), 'senha1234')
    await userEvent.click(screen.getByRole('checkbox'))
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))
    expect(await screen.findByRole('heading', { name: /olá, maria/i })).toBeInTheDocument()
    expect(api.find('POST', '/auth/register')[0]?.body).toMatchObject({ acceptTerms: true, confirmPassword: 'senha1234' })
  })
})

describe('logout', () => {
  it('encerra a sessão no servidor e volta para o login', async () => {
    let logged = true
    const api = mockApi((req) => {
      if (req.path === '/auth/me') return logged ? { body: user } : unauthenticated
      if (req.path === '/auth/logout') {
        logged = false
        return { status: 204 }
      }
      if (req.path === '/dashboard/summary') return { body: emptySummary }
      return undefined
    })
    renderApp('/app/dashboard')
    await screen.findByRole('heading', { name: /olá, maria/i })
    const [logoutButton] = screen.getAllByRole('button', { name: /^sair$/i })
    await userEvent.click(logoutButton!)
    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
    expect(api.find('POST', '/auth/logout')).toHaveLength(1)
    await waitFor(() => expect(screen.queryByText('Maria Souza')).not.toBeInTheDocument())
  })
})
