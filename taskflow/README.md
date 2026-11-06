# TaskFlow

O TaskFlow é uma aplicação web que desenvolvi para organizar tarefas e compromissos do dia a dia. A ideia é ter um lugar onde cada usuário possa gerenciar suas atividades, acompanhar prazos e visualizar o andamento de tudo em um único painel.

Cada usuário possui sua própria conta e seus dados ficam separados dos demais. É possível organizar tarefas por categoria, prioridade, status e data de vencimento.

## Funcionalidades

- **Cadastro e autenticação:** criação de conta, login e logout com controle de sessão. Também possui recuperação de senha por token de uso único.
- **Gerenciamento de tarefas:** criar, editar, visualizar, concluir, reabrir e excluir tarefas.
- **Pesquisa e filtros:** buscar tarefas por nome e filtrar por status, prioridade, categoria e prazo.
- **Categorias:** cada usuário pode criar e gerenciar suas próprias categorias.
- **Dashboard:** painel com resumo das tarefas pendentes, em andamento, concluídas, atrasadas e próximas do vencimento (48 horas).
- **Perfil:** alteração de nome e senha, configurações de tema claro e escuro e opção de excluir a conta.
- **Organização:** ordenação e paginação das tarefas para facilitar o gerenciamento.
- **Privacidade:** cada usuário acessa somente suas próprias informações.

## Alguns detalhes técnicos

Durante o desenvolvimento, também trabalhei em alguns pontos relacionados à segurança, organização e integridade dos dados:

- Autenticação baseada em sessões, utilizando cookies `HttpOnly`, sem armazenar tokens de autenticação no `localStorage`.
- Proteção contra CSRF utilizando os cookies `XSRF-TOKEN` e `X-XSRF-TOKEN`.
- Controle de acesso e isolamento dos dados entre usuários, tanto no backend quanto no banco de dados.
- Utilização do Flyway para controlar as alterações na estrutura do banco de dados.
- Validações no banco para manter os dados consistentes.
- Recuperação de senha com armazenamento apenas do hash SHA-256 do token.
- Limitação de requisições e proteção contra tentativas excessivas de login.
- Testes de integração utilizando PostgreSQL real através do Testcontainers.
- Configuração de produção com Nginx, Docker e containers sem execução como root.

## Tecnologias utilizadas

| Camada | Tecnologias |
|---|---|
| Backend | Java 21, Spring Boot 3.5.6, Spring Web MVC, Spring Security, Spring Data JPA, Bean Validation, Spring Session JDBC, Flyway, springdoc-openapi 2.8.9 |
| Banco de dados | PostgreSQL |
| Testes backend | JUnit 5, Mockito, Spring Boot Test, Spring Security Test, Testcontainers |
| Frontend | React 19, TypeScript, Vite, React Router, Tailwind CSS 4, Radix UI, React Hook Form, Zod, TanStack Query, Lucide e Sonner |
| Testes frontend | Vitest e React Testing Library |
| Infraestrutura | Docker, Docker Compose, Nginx e Render |

## Arquitetura

O projeto foi desenvolvido utilizando uma arquitetura cliente-servidor, com frontend e backend separados.

O frontend é responsável pela interface e interação com o usuário. O backend concentra as regras de negócio, autenticação, validações e comunicação com o banco de dados.

Em produção, o Nginx serve os arquivos do frontend e encaminha as requisições da API para o Spring Boot.

```text
Navegador
    |
    v
  Nginx
    |
    |---- Arquivos estáticos (React)
    |
    |---- /api/
              |
              v
        Spring Boot
              |
              v
          PostgreSQL
```

Mais detalhes sobre a arquitetura estão disponíveis em [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Estrutura do projeto

```text
taskflow/
├── backend/
│   ├── src/main/java/br/com/jrdtech/taskflow/
│   │   ├── auth/
│   │   ├── user/
│   │   ├── task/
│   │   ├── category/
│   │   ├── dashboard/
│   │   ├── config/
│   │   └── common/
│   ├── src/main/resources/db/migration/
│   ├── Dockerfile
│   └── docker-entrypoint.sh
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── hooks/
│   │   └── test/
│   ├── nginx/
│   └── Dockerfile
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── DEPLOY.md
│   └── SECURITY.md
│
├── compose.yaml
├── render.yaml
└── .env.example
```

## Como executar o projeto

### Pré-requisitos

Para executar a aplicação utilizando Docker:

- Docker instalado.
- Docker Compose v2.

Para executar sem Docker:

- JDK 21.
- Maven 3.9 ou superior.
- Node.js 22 ou superior.
- PostgreSQL 15 ou superior.

### Executando com Docker

1. Clone o repositório:

```bash
git clone URL_DO_REPOSITORIO
cd taskflow
```

2. Crie o arquivo `.env`:

```bash
cp .env.example .env
```

No Windows (CMD):

```cmd
copy .env.example .env
```

3. Abra o arquivo `.env` e configure as variáveis necessárias, principalmente `DB_PASSWORD`.

4. Execute a aplicação:

```bash
docker compose up --build
```

Após a inicialização, os endereços serão:

| Serviço | Endereço |
|---|---|
| Aplicação | http://localhost:8080 |
| Backend direto | http://127.0.0.1:8081 |
| Swagger UI | http://127.0.0.1:8081/swagger-ui.html |

O Swagger precisa estar habilitado com `SWAGGER_ENABLED=true`.

Os dados do PostgreSQL ficam armazenados no volume `taskflow-db`.

Para parar os containers:

```bash
docker compose down
```

Para parar e também remover os dados do banco:

```bash
docker compose down -v
```

**Importante:** caso altere a porta do frontend através de `FRONTEND_PORT`, confira também a configuração de `APP_PUBLIC_URL`. O Docker Compose exige que `DB_PASSWORD` esteja configurada.

### Executando sem Docker

Caso prefira executar cada parte separadamente:

**1. Banco de dados**

Crie o banco PostgreSQL:

```bash
createdb taskflow
```

**2. Backend**

Entre na pasta:

```bash
cd backend
```

Configure as variáveis de ambiente:

```bash
export DB_PASSWORD='sua-senha'
export SPRING_PROFILES_ACTIVE=dev
```

No Windows PowerShell, utilize:

```powershell
$env:DB_PASSWORD="sua-senha"
$env:SPRING_PROFILES_ACTIVE="dev"
```

Inicie o backend:

```bash
mvn spring-boot:run
```

No perfil de desenvolvimento, o Swagger fica habilitado e o link de redefinição de senha pode ser consultado nos logs.

**3. Frontend**

Em outro terminal:

```bash
cd frontend
npm ci
npm run dev
```

O frontend ficará disponível em:

```text
http://localhost:5173
```

Por padrão, as requisições da API são encaminhadas para `http://localhost:8080`.

Caso utilize outro endereço para o backend:

```bash
VITE_DEV_BACKEND_URL=http://host:porta npm run dev
```

## Variáveis de ambiente

As principais configurações do backend ficam no `application.yml`.

| Variável | Padrão | Descrição |
|---|---|---|
| `DB_HOST` | localhost | Endereço do PostgreSQL |
| `DB_PORT` | 5432 | Porta do banco |
| `DB_NAME` | taskflow | Nome do banco |
| `DB_USER` | taskflow | Usuário do banco |
| `DB_PASSWORD` | Obrigatória | Senha do banco |
| `DATABASE_URL` | — | Alternativa para configurar a conexão |
| `PORT` | 8080 | Porta do backend |
| `APP_PUBLIC_URL` | http://localhost:5173 | Endereço público do frontend |
| `CORS_ALLOWED_ORIGINS` | vazio | Origens permitidas para acesso à API |
| `COOKIE_SECURE` | false | Deve ser true em produção com HTTPS |
| `SESSION_TIMEOUT` | 7d | Tempo de validade da sessão |
| `BCRYPT_STRENGTH` | 12 | Custo do hash de senha |
| `RATE_LIMIT_ENABLED` | true | Ativa o limite de requisições |
| `SWAGGER_ENABLED` | false | Habilita a documentação Swagger |
| `MAIL_ENABLED` | desativado | Habilita o envio de e-mails |
| `MAIL_HOST` | — | Servidor SMTP |
| `MAIL_PORT` | — | Porta SMTP |
| `MAIL_USERNAME` | — | Usuário SMTP |
| `MAIL_PASSWORD` | — | Senha SMTP |
| `MAIL_FROM` | — | Endereço remetente |
| `MAIL_SMTP_AUTH` | — | Autenticação SMTP |
| `MAIL_STARTTLS` | — | Configuração STARTTLS |
| `MAIL_LOG_LINKS` | false | Exibe links de recuperação nos logs (somente desenvolvimento) |

No container do frontend também existem as variáveis:

- `BACKEND_URL`: endereço do backend. Padrão: `http://backend:8080`.
- `PORT`: porta do Nginx. Padrão: `8080`.

A lista completa está disponível no arquivo `.env.example`.

## Banco de dados e migrations

Utilizei o Flyway para controlar as alterações na estrutura do banco de dados.

As migrations são executadas automaticamente quando o backend inicia.

Atualmente, o projeto possui migrations de V1 até V5, responsáveis pela criação das tabelas de usuários, categorias, tarefas, tokens de recuperação de senha e sessões.

O Hibernate utiliza `ddl-auto: validate`, ou seja, verifica se a estrutura do banco está correta, sem fazer alterações automaticamente.

## Testes

Também implementei testes para verificar o funcionamento das principais funcionalidades do sistema.

**Backend:**

```bash
cd backend
mvn test
```

Os testes de integração utilizam o Testcontainers para iniciar um PostgreSQL 16 real. Por isso, é necessário estar com o Docker em execução.

Atualmente são 68 testes, cobrindo:

- Cadastro e autenticação.
- Isolamento entre usuários.
- Controle de acesso.
- Filtros e paginação.
- Dashboard.
- Gerenciamento de categorias.
- Recuperação de senha.
- Expiração de tokens.

**Frontend:**

```bash
cd frontend
npm test
npm run typecheck
npm run build
```

O frontend possui 36 testes, incluindo cadastro, login, proteção de rotas, formulários, filtros, tratamento de erros da API e confirmação de exclusão.

## API

A API utiliza o prefixo:

```text
/api/v1
```

Principais endpoints:

| Recurso | Endpoints |
|---|---|
| Autenticação | `/auth/csrf`, `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/me`, `/auth/forgot-password`, `/auth/reset-password` |
| Usuário | `/users/me`, `/users/me/password` |
| Tarefas | `/tasks`, `/tasks/{id}`, `/tasks/{id}/status` |
| Categorias | `/categories`, `/categories/{id}` |
| Dashboard | `/dashboard/summary`, `/dashboard/recent-tasks` |

A documentação completa das rotas e regras da API está em [docs/API.md](docs/API.md).

A documentação interativa também pode ser acessada pelo Swagger:

```text
/swagger-ui.html
```

É necessário habilitar `SWAGGER_ENABLED=true`.

## Deploy e produção

O projeto possui configuração para deploy no Render através do arquivo `render.yaml`.

Também foram preparados arquivos e configurações para execução em produção utilizando Docker e Nginx.

Os detalhes de implantação estão em [docs/DEPLOY.md](docs/DEPLOY.md).

As configurações e cuidados relacionados à segurança estão documentados em [docs/SECURITY.md](docs/SECURITY.md).

## Solução de problemas

Alguns problemas que podem aparecer durante a execução:

**Docker solicita DB_PASSWORD**

Verifique se o arquivo `.env` foi criado a partir do `.env.example` e se a senha do banco foi preenchida.

**Login funciona, mas a sessão não permanece**

Em ambiente local sem HTTPS, mantenha `COOKIE_SECURE=false`. Quando essa opção está ativada sem HTTPS, o navegador pode descartar o cookie de sessão.

**Erro 403 ao criar, editar ou excluir informações**

Pode ser um problema relacionado ao token CSRF. Recarregue a página para renovar o cookie `XSRF-TOKEN`. O frontend já possui uma tentativa automática de renovação.

**Erro Invalid CORS request**

Confira se `CORS_ALLOWED_ORIGINS` contém exatamente a origem utilizada no navegador, incluindo protocolo, endereço e porta.

**Backend não inicia por erro do Flyway ou Hibernate**

Pode existir alguma diferença entre a estrutura do banco e as migrations. Verifique o histórico de migrations ou utilize um banco vazio para uma nova instalação.

**Testes do backend não iniciam**

Verifique se o Docker está em execução, pois o Testcontainers precisa dele para criar o PostgreSQL utilizado nos testes.

**E-mail de recuperação não chega**

Confira se `MAIL_ENABLED=true` e se as configurações SMTP estão corretas. Em desenvolvimento, também é possível utilizar `MAIL_LOG_LINKS=true` para consultar o link nos logs.

## Limitações conhecidas

Alguns pontos ainda possuem limitações na implementação atual:

- O controle de limite de requisições e tentativas de login funciona em memória. Os contadores são reiniciados quando a aplicação é reiniciada e são independentes por instância.
- Dependendo da configuração do proxy no Render, diferentes usuários podem compartilhar o mesmo IP identificado pelo backend.
- Ainda não existe funcionalidade para alterar o e-mail da conta.
- Não existe confirmação de e-mail durante o cadastro.
- O envio de e-mails utiliza somente SMTP.
- Não existem endpoints administrativos, e o papel `ADMIN` está presente apenas no modelo.
- A exclusão da conta é definitiva, sem período de recuperação.

Mais informações sobre as limitações de segurança estão em [docs/SECURITY.md](docs/SECURITY.md).

## Verificação do projeto

Antes de finalizar esta versão, realizei testes e verificações para conferir o funcionamento da aplicação.

| Verificação | Resultado |
|---|---|
| Backend (`mvn test`) | 68 testes, sem falhas ou erros. BUILD SUCCESS. |
| Frontend (`npm run typecheck`) | Executado sem erros. |
| Frontend (`npm test`) | 36 testes executados. |
| Frontend (`npm run build`) | Executado sem erros. |
| Docker Compose | Aplicação executada, com cadastro, login e telas funcionando. |
| Cookie CSRF | Conferido utilizando curl. |
| Configuração do Render | Arquivo YAML validado, mas deploy ainda não realizado. |
| Nginx | Configuração validada durante a execução com Docker Compose. |
| Dependências do frontend | `npm audit` executado sem vulnerabilidades. |
| Dependências do backend | Análise ainda não executada. |

Os testes do backend foram executados em 06/11/2026, utilizando Windows, Docker Desktop, Testcontainers e PostgreSQL 16.

As verificações que ainda não foram realizadas estão descritas em [docs/DEPLOY.md](docs/DEPLOY.md) e [docs/SECURITY.md](docs/SECURITY.md).

## Autor

Desenvolvido por **José Ronildo Dias**, da **JRD Tech**.

Este projeto faz parte dos meus estudos e da minha evolução como desenvolvedor, colocando em prática conhecimentos de Java, Spring Boot, React, TypeScript, PostgreSQL e Docker.

Sugestões, melhorias e contribuições são bem-vindas através das Issues do repositório.

## Licença

Este projeto está disponível sob a licença MIT. Consulte o arquivo [LICENSE](LICENSE) para mais informações.