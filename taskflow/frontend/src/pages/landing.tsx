import { CalendarClock, FolderKanban, Gauge, Search, ShieldCheck, SunMoon } from 'lucide-react'
import { Link } from 'react-router'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'

const features = [
  {
    icon: Gauge,
    title: 'Painel com números reais',
    text: 'Veja quantas tarefas estão a fazer, em andamento, concluídas, atrasadas ou com vencimento nas próximas 48 horas.',
  },
  {
    icon: Search,
    title: 'Busca e filtros de verdade',
    text: 'Pesquise no título e na descrição, filtre por status, prioridade, categoria e prazo, e ordene como preferir.',
  },
  {
    icon: FolderKanban,
    title: 'Categorias suas',
    text: 'Agrupe tarefas por projeto, cliente ou área da vida. Ao excluir uma categoria, as tarefas continuam, só ficam sem categoria.',
  },
  {
    icon: CalendarClock,
    title: 'Prazos com horário',
    text: 'Defina data e hora de vencimento, ou deixe sem prazo. As datas aparecem sempre no seu fuso horário.',
  },
  {
    icon: ShieldCheck,
    title: 'Seus dados são só seus',
    text: 'Cada conta enxerga apenas as próprias tarefas. Senhas ficam protegidas por hash e a sessão usa cookie seguro.',
  },
  {
    icon: SunMoon,
    title: 'Tema claro e escuro',
    text: 'Interface responsiva, navegável por teclado, com o tema que combina com o seu momento.',
  },
]

const preview = [
  { title: 'A fazer', items: ['Revisar proposta do cliente', 'Marcar consulta'] },
  { title: 'Em andamento', items: ['Escrever relatório mensal'] },
  { title: 'Concluída', items: ['Enviar nota fiscal', 'Pagar condomínio'] },
]

export function LandingPage() {
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        <nav aria-label="Principal" className="flex items-center gap-1 sm:gap-2">
          <a href="#funcionalidades" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-muted hover:text-ink sm:block">
            Funcionalidades
          </a>
          <a href="#como-funciona" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-muted hover:text-ink sm:block">
            Como funciona
          </a>
          <Button asChild variant="ghost">
            <Link to="/login">Entrar</Link>
          </Button>
          <Button asChild>
            <Link to="/register">Começar agora</Link>
          </Button>
        </nav>
      </header>

      <main id="conteudo">
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pt-10 pb-20 lg:grid-cols-[1.05fr_1fr] lg:pt-20">
          <div>
            <h1 className="text-4xl leading-[1.05] font-extrabold sm:text-6xl">
              Suas tarefas em fluxo, do primeiro passo à entrega.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted">
              O TaskFlow organiza o que você precisa fazer por status, prioridade, categoria e prazo, e mostra com clareza o
              que está atrasado e o que vence logo.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/register">Começar agora</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link to="/login">Entrar</Link>
              </Button>
            </div>
          </div>

          <figure aria-label="Exemplo ilustrativo do quadro de tarefas" className="relative">
            <svg viewBox="0 0 520 40" className="mb-3 w-full" aria-hidden>
              <path
                className="tf-draw"
                pathLength={1}
                d="M20 20 H260 H500"
                fill="none"
                stroke="var(--primary)"
                strokeWidth="4"
                strokeLinecap="round"
              />
              {[20, 260, 500].map((cx, i) => (
                <circle key={cx} cx={cx} cy="20" r="9" fill={i === 2 ? 'var(--accent)' : 'var(--primary)'} stroke="var(--bg)" strokeWidth="4" />
              ))}
            </svg>
            <div className="grid grid-cols-3 gap-3 rounded-2xl border border-line bg-surface p-3 sm:p-4">
              {preview.map((col) => (
                <div key={col.title} className="min-w-0">
                  <p className="mb-2 font-display text-sm font-semibold">{col.title}</p>
                  <ul className="flex flex-col gap-2">
                    {col.items.map((item) => (
                      <li key={item} className="rounded-lg bg-surface-2 px-2.5 py-2 text-xs leading-snug sm:text-sm">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <figcaption className="mt-2 text-xs text-muted">Exemplo ilustrativo, sem dados reais.</figcaption>
          </figure>
        </section>

        <section id="funcionalidades" className="border-y border-line bg-surface py-20">
          <div className="mx-auto max-w-6xl px-5">
            <h2 className="max-w-2xl text-3xl font-bold sm:text-4xl">Tudo o que a rotina pede, sem o que sobra</h2>
            <dl className="mt-12 grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, text }) => (
                <div key={title}>
                  <dt className="flex items-center gap-2.5 font-display text-lg font-semibold">
                    <Icon className="h-5 w-5 text-primary" aria-hidden />
                    {title}
                  </dt>
                  <dd className="mt-2 text-muted">{text}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section id="como-funciona" className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="max-w-2xl text-3xl font-bold sm:text-4xl">Três passos para pôr o dia em ordem</h2>
          <ol className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              ['Crie', 'Registre a tarefa com título, prioridade e, se quiser, categoria e prazo.'],
              ['Organize', 'Use filtros e ordenação para enxergar o que importa agora.'],
              ['Acompanhe', 'Avance o status e confira no painel o progresso e o que está atrasado.'],
            ].map(([title, text], i) => (
              <li key={title} className="border-t-2 border-primary pt-4">
                <p className="font-display text-sm font-semibold text-primary">Passo {i + 1}</p>
                <h3 className="mt-1 text-xl font-semibold">{title}</h3>
                <p className="mt-2 text-muted">{text}</p>
              </li>
            ))}
          </ol>
          <div className="mt-14">
            <Button asChild size="lg">
              <Link to="/register">Criar minha conta</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} TaskFlow. Desenvolvido pela JRD Tech.</p>
          <nav aria-label="Rodapé" className="flex gap-5">
            <Link to="/terms" className="hover:text-ink">
              Termos de uso
            </Link>
            <Link to="/privacy" className="hover:text-ink">
              Privacidade
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
