# API REST

Base: `/api/v1`. JSON em UTF-8. Documentação interativa em `/swagger-ui.html` (e `/v3/api-docs`) quando `SWAGGER_ENABLED=true`.

## Autenticação e CSRF

- Sessão em cookie `TASKFLOW_SESSION` (`HttpOnly`, `SameSite=Lax`, `Secure` quando `COOKIE_SECURE=true`).
- Requisições que alteram estado (`POST`, `PUT`, `PATCH`, `DELETE`) exigem o cabeçalho `X-XSRF-TOKEN` com o valor do cookie `XSRF-TOKEN`. Obtenha o cookie com `GET /auth/csrf`.
- Sem sessão válida, rotas privadas respondem `401`.

```bash
curl -c jar -b jar http://localhost:8081/api/v1/auth/csrf
TOKEN=$(awk '$6=="XSRF-TOKEN"{print $7}' jar)
curl -c jar -b jar -H "X-XSRF-TOKEN: $TOKEN" -H 'Content-Type: application/json' \
  -d '{"email":"voce@exemplo.com","password":"Senha1234"}' http://localhost:8081/api/v1/auth/login
```

## Erros

Formato único (`ApiError`) com mensagem em pt-BR e, em validações, `fieldErrors: [{field, message}]`. Sem stack traces nem detalhes internos.

| Código | Uso |
|---|---|
| 400 | Validação, parâmetros inválidos |
| 401 | Sem sessão / credenciais inválidas (mensagem genérica) |
| 403 | CSRF ausente ou inválido |
| 404 | Recurso inexistente **ou de outro usuário** |
| 409 | Conflito (e-mail ou nome de categoria duplicado) |
| 413 | Corpo acima de 64 KB |
| 429 | Limite de requisições / tentativas de login (`Retry-After`) |
| 500 | Falha inesperada |

## Autenticação

| Método e rota | Descrição |
|---|---|
| `GET /auth/csrf` | Emite o cookie `XSRF-TOKEN`. `204` |
| `POST /auth/register` | `name` (2–120), `email` (≤254), `password`, `confirmPassword`, `acceptTerms=true`. Cria a conta `USER` e abre a sessão. `201` |
| `POST /auth/login` | `email`, `password`. `200` com o usuário; `401` genérico |
| `POST /auth/logout` | Invalida a sessão. `204` |
| `GET /auth/me` | Usuário autenticado |
| `POST /auth/forgot-password` | `email`. `202` com a mesma mensagem exista ou não a conta |
| `POST /auth/reset-password` | `token`, `newPassword`. Token de uso único, validade 1 h. `204`; encerra todas as sessões do usuário |

Limites por IP (POST): login 30/5 min, cadastro 10/h, forgot-password 5/h, reset-password 10/h. Bloqueio adicional após 5 falhas de login em 15 min para o par IP + e-mail.

## Usuário

| Rota | Descrição |
|---|---|
| `GET /users/me` | Dados da conta (sem hash de senha) |
| `PATCH /users/me` | `name` |
| `PATCH /users/me/password` | `currentPassword`, `newPassword`; encerra as outras sessões |
| `DELETE /users/me` | Corpo `{ "password": "..." }`; exclusão definitiva |

Papel e e-mail não são alteráveis por estas rotas.

## Tarefas

| Rota | Descrição |
|---|---|
| `GET /tasks` | Lista paginada (abaixo) |
| `GET /tasks/{id}` | Detalhe (404 se não for do usuário) |
| `POST /tasks` | `title` (≤150), `description` (≤2000), `status`, `priority`, `categoryId?`, `dueAt?` (ISO-8601 UTC). `201` |
| `PUT /tasks/{id}` | Substitui os campos editáveis |
| `PATCH /tasks/{id}/status` | `{ "status": "DONE" }` (conclui/reabre) |
| `DELETE /tasks/{id}` | `204` |

Parâmetros de `GET /tasks`: `q` (título/descrição), `status`, `priority`, `categoryId`, `withoutCategory`, `overdue`, `noDueDate`, `dueFrom`, `dueTo`, `page` (≥0, padrão 0), `size` (1–100, padrão 20), `sort` (`createdAt` padrão, `dueAt`, `priority`, `title`), `direction` (`asc`|`desc`).

A resposta inclui `overdue` calculado no servidor e `category` resumida. O proprietário vem sempre da sessão; `userId` no corpo é ignorado. Categoria de outro usuário resulta em 404.

## Categorias

`GET /categories` (com `taskCount`), `GET /categories/{id}`, `POST /categories`, `PUT /categories/{id}`, `DELETE /categories/{id}`. Corpo: `name` (≤60, único por usuário sem diferenciar maiúsculas), `color?` (`#RRGGBB`). Excluir mantém as tarefas, sem categoria.

## Dashboard

- `GET /dashboard/summary`: `total`, `todo`, `inProgress`, `done`, `overdue`, `dueSoon`, `priorityTasks` (URGENT/HIGH não concluídas, 5) e `deadlineTasks` (não concluídas com prazo, 5).
- `GET /dashboard/recent-tasks`: 5 tarefas mais recentes.
