import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <main id="conteudo" className="mx-auto flex min-h-dvh max-w-md flex-col items-start justify-center gap-4 px-5">
      <h1 className="text-4xl font-bold">Página não encontrada</h1>
      <p className="text-muted">O endereço não existe ou foi movido.</p>
      <Button asChild>
        <Link to="/">Voltar ao início</Link>
      </Button>
    </main>
  )
}
