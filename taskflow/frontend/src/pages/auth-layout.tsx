import type { ReactNode } from 'react'
import { Logo } from '@/components/logo'

export function FlowArt() {
  return (
    <svg viewBox="0 0 400 220" className="w-full" aria-hidden>
      <path
        className="tf-draw"
        pathLength={1}
        d="M10 170 C 70 170, 70 60, 130 60 S 200 160, 260 130 S 330 40, 390 50"
        fill="none"
        stroke="var(--primary-ink)"
        strokeWidth="5"
        strokeLinecap="round"
        opacity="0.9"
      />
      {[
        [10, 170],
        [130, 60],
        [260, 130],
      ].map(([cx, cy]) => (
        <circle key={`${cx}`} cx={cx} cy={cy} r="9" fill="var(--primary)" stroke="var(--primary-ink)" strokeWidth="4" />
      ))}
      <circle cx="390" cy="50" r="11" fill="var(--accent)" />
    </svg>
  )
}

export function AuthLayout({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]">
      <div className="flex min-h-dvh flex-col px-5 py-6 sm:px-10 lg:min-h-0">
        <Logo />
        <main id="conteudo" className="mx-auto my-auto w-full max-w-md py-10">
          <h1 className="text-3xl font-bold">{title}</h1>
          {subtitle && <p className="mt-2 text-muted">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-sm text-muted">{footer}</div>}
        </main>
      </div>
      <aside className="hidden flex-col justify-end bg-primary p-10 text-primary-ink lg:flex" aria-hidden>
        <FlowArt />
        <p className="mt-6 font-display text-2xl leading-snug font-semibold">
          Do &ldquo;a fazer&rdquo; ao &ldquo;concluído&rdquo;, sem perder nenhuma etapa.
        </p>
      </aside>
    </div>
  )
}
