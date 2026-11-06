import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { emptySummary, makePage, makeTask, mockApi, renderApp, sampleCategory, user, type Handler } from './utils'

beforeEach(() => {
  document.cookie = 'XSRF-TOKEN=tok; path=/'
})
afterEach(() => vi.unstubAllGlobals())

const authed = (handler: Handler): Handler => (req) => {
  if (req.path === '/auth/me') return { body: user }
  if (req.path === '/categories' && req.method === 'GET') return { body: [sampleCategory] }
  if (req.path === '/dashboard/summary') return { body: emptySummary }
  return handler(req)
}

describe('listagem de tarefas', () => {
  it('mostra skeleton durante o carregamento e depois as tarefas e a contagem', async () => {
    let release: () => void = () => undefined
    const gate = new Promise<void>((resolve) => (release = resolve))
    mockApi(
      authed(async (req) => {
        if (req.path === '/tasks') {
          await gate
          return { body: makePage([makeTask(), makeTask({ id: 't2', title: 'Pagar boleto' })]) }
        }
        return undefined
      }),
    )
    renderApp('/app/tasks')
    expect(await screen.findByLabelText('Carregando tarefas')).toHaveAttribute('aria-busy', 'true')
    release()
    expect(await screen.findByText('Revisar contrato')).toBeInTheDocument()
    expect(screen.getByText('Pagar boleto')).toBeInTheDocument()
    expect(screen.getByText('Mostrando 1–2 de 2 tarefas')).toBeInTheDocument()
  })

  it('envia os filtros ao backend e permite limpá-los', async () => {
    const api = mockApi(authed((req) => (req.path === '/tasks' ? { body: makePage([makeTask()]) } : undefined)))
    renderApp('/app/tasks')
    await screen.findByText('Revisar contrato')

    await userEvent.selectOptions(screen.getByLabelText('Status'), 'IN_PROGRESS')
    await userEvent.selectOptions(screen.getByLabelText('Prioridade'), 'URGENT')
    await userEvent.selectOptions(await screen.findByRole('combobox', { name: 'Categoria' }), 'c1')
    await userEvent.selectOptions(screen.getByLabelText('Prazo'), 'overdue')

    await waitFor(() => {
      const last = api.find('GET', '/tasks').at(-1)!
      expect(last.search.get('status')).toBe('IN_PROGRESS')
      expect(last.search.get('priority')).toBe('URGENT')
      expect(last.search.get('categoryId')).toBe('c1')
      expect(last.search.get('overdue')).toBe('true')
    })

    await userEvent.click(screen.getByRole('button', { name: /limpar filtros/i }))
    await waitFor(() => {
      const last = api.find('GET', '/tasks').at(-1)!
      expect(last.search.get('status')).toBeNull()
      expect(last.search.get('overdue')).toBeNull()
    })
  })

  it('aplica a busca textual com debounce e inicia os filtros a partir da URL', async () => {
    const api = mockApi(authed((req) => (req.path === '/tasks' ? { body: makePage([]) } : undefined)))
    renderApp('/app/tasks?status=DONE')
    await screen.findByText(/nenhuma tarefa encontrada/i)
    expect(api.find('GET', '/tasks')[0]?.search.get('status')).toBe('DONE')
    await userEvent.type(screen.getByLabelText('Buscar por título ou descrição'), 'contrato')
    await waitFor(() => expect(api.find('GET', '/tasks').at(-1)!.search.get('q')).toBe('contrato'))
  })

  it('mostra estado vazio com orientação quando não há tarefas', async () => {
    mockApi(authed((req) => (req.path === '/tasks' ? { body: makePage([]) } : undefined)))
    renderApp('/app/tasks')
    expect(await screen.findByText('Nenhuma tarefa por aqui')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Criar tarefa' })).toHaveAttribute('href', '/app/tasks/new')
  })

  it('apresenta falha da API e recupera ao tentar novamente', async () => {
    let fail = true
    mockApi(
      authed((req) => {
        if (req.path !== '/tasks') return undefined
        return fail ? { status: 500, body: { message: 'Ocorreu um erro inesperado. Tente novamente em instantes.' } } : { body: makePage([makeTask()]) }
      }),
    )
    renderApp('/app/tasks')
    expect(await screen.findByRole('alert')).toHaveTextContent('Ocorreu um erro inesperado')
    fail = false
    await userEvent.click(screen.getByRole('button', { name: /tentar novamente/i }))
    expect(await screen.findByText('Revisar contrato')).toBeInTheDocument()
  })

  it('conclui uma tarefa pelo servidor e atualiza a lista com o estado confirmado', async () => {
    let task = makeTask()
    const api = mockApi(
      authed((req) => {
        if (req.path === '/tasks' && req.method === 'GET') return { body: makePage([task]) }
        if (req.path === '/tasks/t1/status') {
          task = makeTask({ status: 'DONE', completedAt: '2026-10-28T10:00:00Z' })
          return { body: task }
        }
        return undefined
      }),
    )
    renderApp('/app/tasks')
    await userEvent.click(await screen.findByRole('button', { name: 'Concluir tarefa: Revisar contrato' }))
    expect(await screen.findByRole('button', { name: 'Reabrir tarefa: Revisar contrato' })).toBeInTheDocument()
    expect(api.find('PATCH', '/tasks/t1/status')[0]?.body).toEqual({ status: 'DONE' })
  })
})

describe('exclusão', () => {
  it('só exclui após confirmação e não exclui ao cancelar', async () => {
    let tasks = [makeTask()]
    const api = mockApi(
      authed((req) => {
        if (req.path === '/tasks' && req.method === 'GET') return { body: makePage(tasks) }
        if (req.method === 'DELETE' && req.path === '/tasks/t1') {
          tasks = []
          return { status: 204 }
        }
        return undefined
      }),
    )
    renderApp('/app/tasks')
    await userEvent.click(await screen.findByRole('button', { name: 'Excluir tarefa: Revisar contrato' }))

    const dialog = await screen.findByRole('alertdialog')
    expect(within(dialog).getByText(/excluída de forma definitiva/i)).toBeInTheDocument()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(api.find('DELETE', '/tasks/t1')).toHaveLength(0)

    await userEvent.click(screen.getByRole('button', { name: 'Excluir tarefa: Revisar contrato' }))
    await userEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Excluir tarefa' }))
    expect(await screen.findByText('Nenhuma tarefa por aqui')).toBeInTheDocument()
    expect(api.find('DELETE', '/tasks/t1')).toHaveLength(1)
  })
})

describe('criação e edição', () => {
  it('valida o título e só então envia a tarefa com data em UTC', async () => {
    const api = mockApi(
      authed((req) => {
        if (req.method === 'POST' && req.path === '/tasks') return { status: 201, body: makeTask({ id: 'novo', title: 'Nova coisa' }) }
        if (req.path === '/tasks/novo') return { body: makeTask({ id: 'novo', title: 'Nova coisa' }) }
        return undefined
      }),
    )
    renderApp('/app/tasks/new')
    await userEvent.click(await screen.findByRole('button', { name: 'Criar tarefa' }))
    expect(await screen.findByText('Informe o título da tarefa.')).toBeInTheDocument()
    expect(api.find('POST', '/tasks')).toHaveLength(0)

    await userEvent.type(screen.getByLabelText('Título'), 'Nova coisa')
    await userEvent.selectOptions(screen.getByLabelText('Prioridade'), 'HIGH')
    await userEvent.type(screen.getByLabelText('Vencimento (opcional)'), '2026-12-01T09:30')
    await userEvent.click(screen.getByRole('button', { name: 'Criar tarefa' }))

    expect(await screen.findByRole('heading', { name: 'Nova coisa' })).toBeInTheDocument()
    const body = api.find('POST', '/tasks')[0]!.body
    expect(body).toMatchObject({ title: 'Nova coisa', priority: 'HIGH', status: 'TODO', description: null, categoryId: null })
    expect(body.dueAt).toBe(new Date(2026, 11, 1, 9, 30).toISOString())
  })

  it('mostra erros de campo vindos do servidor', async () => {
    mockApi(
      authed((req) =>
        req.method === 'POST' && req.path === '/tasks'
          ? { status: 400, body: { message: 'Dados inválidos.', fieldErrors: [{ field: 'title', message: 'Título já usado no servidor.' }] } }
          : undefined,
      ),
    )
    renderApp('/app/tasks/new')
    await userEvent.type(await screen.findByLabelText('Título'), 'Algo')
    await userEvent.click(screen.getByRole('button', { name: 'Criar tarefa' }))
    expect(await screen.findByText('Título já usado no servidor.')).toBeInTheDocument()
  })

  it('carrega os dados da tarefa na edição e envia PUT', async () => {
    const existing = makeTask({ id: 't9', title: 'Antigo', priority: 'LOW', description: 'Detalhe' })
    const api = mockApi(
      authed((req) => {
        if (req.path === '/tasks/t9' && req.method === 'GET') return { body: existing }
        if (req.path === '/tasks/t9' && req.method === 'PUT') return { body: { ...existing, title: 'Atualizado' } }
        return undefined
      }),
    )
    renderApp('/app/tasks/t9/edit')
    const title = await screen.findByLabelText('Título')
    expect(title).toHaveValue('Antigo')
    expect(screen.getByLabelText('Descrição (opcional)')).toHaveValue('Detalhe')
    expect(screen.getByLabelText('Prioridade')).toHaveValue('LOW')
    await userEvent.clear(title)
    await userEvent.type(title, 'Atualizado')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))
    await waitFor(() => expect(api.find('PUT', '/tasks/t9')).toHaveLength(1))
    expect(api.find('PUT', '/tasks/t9')[0]!.body).toMatchObject({ title: 'Atualizado', description: 'Detalhe', priority: 'LOW' })
  })

  it('informa quando a tarefa não existe ou pertence a outro usuário (404)', async () => {
    mockApi(authed((req) => (req.path === '/tasks/outro' ? { status: 404, body: { message: 'Tarefa não encontrada.' } } : undefined)))
    renderApp('/app/tasks/outro')
    expect(await screen.findByText('Tarefa não encontrada')).toBeInTheDocument()
  })
})
