# Arquitetura

## Visão geral

```
Navegador ─HTTPS─► Nginx (taskflow-web) ──/api/──► Spring Boot (taskflow-api) ──JDBC──► PostgreSQL
                     │ arquivos estáticos do SPA          │ sessões (spring_session), dados, Flyway
```

- **Mesma origem**: o SPA chama caminhos relativos (`/api/v1/...`). O Nginx encaminha `/api/` ao backend, então os cookies de sessão e CSRF são de primeira parte, com `SameSite=Lax`, sem depender de CORS "de verdade". O Spring ainda precisa listar a origem do frontend em `CORS_ALLOWED_ORIGINS`, porque o Nginx troca o cabeçalho `Host` e o Spring passaria a tratar a requisição como cross-origin.
- **Monólito simples** no backend, organizado por funcionalidade: `auth`, `user`, `task`, `category`, `dashboard`, com `config` (segurança, CORS, filtros, OpenAPI) e `common` (erros, validação, rate limiter).
- **Estado no banco**: dados de negócio e sessões HTTP (Spring Session JDBC). Reiniciar o backend não derruba sessões.

## Decisões

| Decisão | Motivo |
|---|---|
| Sessão em cookie `HttpOnly` + CSRF por cookie duplicado (`XSRF-TOKEN` / `X-XSRF-TOKEN`) | Nenhum token em `localStorage`; revogação imediata (logout, troca/reset de senha invalidam sessões) |
| Spring Session JDBC | Sessões persistem entre reinícios e múltiplas instâncias, sem Redis |
| UUID como chave primária | Não expõe identificadores sequenciais (a autorização continua sendo a defesa real) |
| Filtros de listagem via JPA Specifications | Consultas parametrizadas, combináveis e restritas ao `user_id` |
| Instantes em `TIMESTAMPTZ`/UTC; exibição em horário local no frontend | Evita ambiguidade de fuso |
| Nginx com `proxy_pass` por variável + `resolver` | O backend é re-resolvido a cada 30 s; recriar o container não deixa o proxy com IP antigo |
| Entrypoint converte `DATABASE_URL` | O Render entrega URL `postgresql://`, o Spring precisa de JDBC |

## Modelo de dados

- `users(id, name, email UNIQUE em minúsculas, password_hash, role, enabled, created_at, updated_at)`
- `categories(id, user_id → users ON DELETE CASCADE, name, color #RRGGBB, ...)`; nome único por usuário sem diferenciar maiúsculas (`lower(name)`); `UNIQUE (id, user_id)`.
- `tasks(id, user_id → users ON DELETE CASCADE, category_id, title ≤150, description ≤2000, status, priority, due_at, completed_at, created_at, updated_at)`.
  - `FOREIGN KEY (category_id, user_id) → categories(id, user_id) ON DELETE SET NULL (category_id)`: o banco impede associar categoria de outro usuário e, ao excluir a categoria, só zera `category_id`.
  - `CHECK ((status = 'DONE') = (completed_at IS NOT NULL))`: conclusão e data de conclusão sempre coerentes.
- `password_reset_tokens(id, user_id, token_hash SHA-256 UNIQUE, expires_at, used_at, created_at)`.
- `spring_session`, `spring_session_attributes`: sessões.

Índices em `tasks`: `(user_id, status)`, `(user_id, due_at)`, `(user_id, created_at DESC)`, `(category_id)`.

## Regras de negócio

- **Status**: `TODO`, `IN_PROGRESS`, `DONE`. **Prioridade**: `LOW`, `MEDIUM`, `HIGH`, `URGENT`.
- Concluir registra `completedAt`; reabrir limpa. `updatedAt` é mantido automaticamente.
- **Atrasada**: status diferente de `DONE` e `dueAt` anterior ao instante atual. **Vencimento próximo**: não concluída com `dueAt` entre agora e 48 h. Tarefas concluídas nunca entram nesses recortes; atrasadas e vencimento próximo se sobrepõem aos status (não somam ao total).
- **Excluir categoria**: as tarefas permanecem, sem categoria.
- **Excluir conta**: exige a senha; remove definitivamente tarefas, categorias e tokens (cascata no banco) e encerra as sessões.
- **Trocar senha**: exige a senha atual, exige senha diferente e encerra as outras sessões. **Recuperar senha**: token aleatório, só o hash é salvo, validade de 1 hora, uso único, encerra todas as sessões; a resposta é a mesma exista ou não o e-mail.
- **Senha**: 8 a 72 bytes, ao menos uma letra e um número.

## Frontend

SPA com React Router; rotas privadas sob `/app` protegidas por `RequireAuth`, páginas carregadas sob demanda. Toda a comunicação passa por `src/lib/api.ts` (CSRF automático, tratamento de 401/403/429 e falhas de rede), dados remotos por TanStack Query (`hooks/queries.ts`), validação com Zod e React Hook Form (`lib/schemas.ts`). Tema claro/escuro persistido, aplicado antes da hidratação por `public/theme-init.js` (arquivo externo, compatível com a CSP).

Rotas: `/`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/terms`, `/privacy`, `/app/dashboard`, `/app/tasks`, `/app/tasks/new`, `/app/tasks/:id`, `/app/tasks/:id/edit`, `/app/categories`, `/app/profile`, `/app/settings`.

## Versões

Registradas em `backend/pom.xml` (Spring Boot 3.5.6, Java 21, springdoc 2.8.9) e `frontend/package.json`. Imagens base: `maven:3.9-eclipse-temurin-21`, `eclipse-temurin:21-jre-alpine`, `node:22-alpine`, `nginxinc/nginx-unprivileged:1.28-alpine`, `postgres:16-alpine`.
