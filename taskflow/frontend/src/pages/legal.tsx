import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Logo } from '@/components/logo'

function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto min-h-dvh max-w-2xl px-5 py-6">
      <Logo />
      <main id="conteudo" className="py-10">
        <h1 className="text-3xl font-bold">{title}</h1>
        <div className="mt-6 space-y-4 leading-relaxed [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
          {children}
        </div>
        <p className="mt-10 text-sm text-muted">
          Este texto é um modelo inicial e deve ser revisado por assessoria jurídica antes do uso comercial.{' '}
          <Link to="/" className="text-primary underline">
            Voltar ao início
          </Link>
        </p>
      </main>
    </div>
  )
}

export function TermsPage() {
  return (
    <LegalPage title="Termos de uso">
      <p>O TaskFlow é um aplicativo para organizar tarefas pessoais. Ao criar uma conta, você concorda com estas regras.</p>
      <h2>Sua conta</h2>
      <ul>
        <li>Você é responsável pelas informações cadastradas e por manter sua senha em segurança.</li>
        <li>Cada conta é de uso pessoal. Não compartilhe suas credenciais.</li>
      </ul>
      <h2>Uso adequado</h2>
      <ul>
        <li>Não use o serviço para atividades ilegais nem tente acessar dados de outras contas.</li>
        <li>Não tente sobrecarregar ou comprometer a segurança da aplicação.</li>
      </ul>
      <h2>Disponibilidade</h2>
      <p>Trabalhamos para manter o serviço disponível, mas ele pode ficar indisponível para manutenção ou por falhas.</p>
      <h2>Encerramento</h2>
      <p>Você pode excluir sua conta a qualquer momento em Ajustes. A exclusão remove definitivamente suas tarefas e categorias.</p>
    </LegalPage>
  )
}

export function PrivacyPage() {
  return (
    <LegalPage title="Política de privacidade">
      <p>Esta política descreve quais dados o TaskFlow guarda e como eles são tratados.</p>
      <h2>Dados que armazenamos</h2>
      <ul>
        <li>Nome e e-mail informados no cadastro.</li>
        <li>Senha, apenas na forma de hash (nunca em texto puro).</li>
        <li>Tarefas e categorias que você cria.</li>
      </ul>
      <h2>Cookies</h2>
      <p>Usamos cookies estritamente necessários: um de sessão (para manter você autenticado) e um de proteção contra requisições forjadas. O tema escolhido fica salvo no seu navegador.</p>
      <h2>Compartilhamento</h2>
      <p>Seus dados não são vendidos nem compartilhados com terceiros para publicidade. E-mails de recuperação de senha são enviados por um provedor de e-mail configurado pelo operador do serviço.</p>
      <h2>Exclusão</h2>
      <p>Ao excluir sua conta, nome, e-mail, tarefas, categorias e tokens são removidos definitivamente do banco de dados.</p>
    </LegalPage>
  )
}
