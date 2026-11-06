# Segurança

## Autenticação e sessão

- Autenticação real no backend (Spring Security). Senhas com BCrypt (custo 12 por padrão); o hash nunca é retornado pela API.
- Política de senha: 8 a 72 bytes (limite do BCrypt), com letra e número. Validada no frontend e no backend.
- Sessão em cookie `TASKFLOW_SESSION`: `HttpOnly`, `SameSite=Lax`, `Secure` quando `COOKIE_SECURE=true`. Nenhum token em `localStorage`. A sessão fica no PostgreSQL (Spring Session JDBC) e expira em `SESSION_TIMEOUT` (7 dias por padrão).
- O identificador da sessão é trocado no login (proteção contra session fixation).
- Logout, troca de senha, redefinição de senha e exclusão de conta revogam sessões no banco (troca de senha mantém só a atual).
- Login com mensagem genérica ("E-mail ou senha inválidos."). Bloqueio do par IP + e-mail após 5 falhas em 15 minutos.

## CSRF e CORS

- CSRF por cookie duplicado: `XSRF-TOKEN` (legível pelo JavaScript, `Secure` conforme configuração, `SameSite=Lax`) enviado de volta em `X-XSRF-TOKEN` em toda escrita. Falha responde `403` com mensagem genérica.
- CORS restrito a `CORS_ALLOWED_ORIGINS` (vazio por padrão = nenhuma origem), com credenciais, métodos e cabeçalhos explícitos, somente em `/api/**`.

## Autorização e isolamento de dados

- Toda leitura, alteração e exclusão de tarefas e categorias filtra por `id` **e** `user_id` do usuário da sessão; recurso de outro usuário responde `404` (não confirma a existência).
- O proprietário nunca vem do corpo da requisição; o papel não é alterável por endpoint algum; o cadastro sempre cria `USER`.
- Defesa em profundidade no banco: `FOREIGN KEY (category_id, user_id)` impede associar categoria de outro usuário; `CHECK` mantém `status`/`completed_at` coerentes; `ON DELETE CASCADE` na exclusão de conta.
- Rotas fora de `/api/**` e não listadas são negadas por padrão (`denyAll`).

## Recuperação de senha

- Token aleatório de uso único, validade de 1 hora; **só o hash SHA-256 é armazenado**; novo pedido invalida os anteriores.
- `forgot-password` responde igual exista ou não a conta. A redefinição consome o token de forma atômica e encerra todas as sessões.
- Tokens expirados são removidos diariamente (03:30).
- Sem provedor SMTP configurado nada é enviado. `MAIL_LOG_LINKS` imprime o link no log e **só deve ser usado em desenvolvimento**.

## Proteções de borda

- Cabeçalhos do backend: `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, HSTS, `Permissions-Policy`, além dos padrões do Spring (`X-Content-Type-Options`, `Cache-Control` em respostas dinâmicas).
- Cabeçalhos do Nginx nas páginas e assets: CSP restritiva (`default-src 'self'`, sem scripts inline; `style-src` permite `'unsafe-inline'` por causa de estilos injetados por bibliotecas de UI), `frame-ancestors 'none'`, `nosniff`, HSTS, `Referrer-Policy`, `Permissions-Policy`.
- Limites: corpo máximo de 64 KB (backend e Nginx); paginação máxima de 100; rate limit nos POST públicos (login 30/5 min, cadastro 10/h, forgot 5/h, reset 10/h).
- Erros sem stack trace, mensagens de exceção ou detalhes de SQL (`server.error.*` desligados e tratamento global).
- Consultas via JPA/Specifications (parametrizadas). Swagger desligado por padrão.
- Containers sem root (`app` no backend; usuário 101 no Nginx). Imagem final do backend só com JRE.
- Segredos somente por variáveis de ambiente; `.env` ignorado pelo Git; `.env.example` sem valores sensíveis; o Compose exige `DB_PASSWORD` explícita.

## Limitações e riscos conhecidos

1. **Rate limit e bloqueio de login em memória.** Valem por instância e reiniciam com ela; com várias instâncias o limite efetivo multiplica. Para escala horizontal, mover o contador para o banco ou um cache compartilhado.
2. **IP do cliente atrás do proxy.** Os filtros usam `request.getRemoteAddr()`. Com `forward-headers-strategy: native`, o Tomcat só confia em `X-Forwarded-For` vindo de proxies internos. No Docker Compose o Nginx está em rede privada, então o IP real é usado. No Render, o Nginx acessa o backend pela URL pública: o backend pode enxergar o IP de saída do Nginx, e todos os usuários passam a dividir o mesmo contador (30 logins/5 min e 5 falhas/15 min por e-mail no total). Isso reduz a disponibilidade sob uso intenso, não o isolamento. Mitigação futura: colocar frontend e backend em rede privada (planos pagos) ou um mecanismo explícito de IP confiável. Não alterado agora por não poder compilar nem testar o backend neste ambiente.
3. **Enumeração de e-mail no cadastro.** O cadastro responde `409` para e-mail já registrado (necessário para a regra de duplicidade). O fluxo de recuperação não revela existência.
4. **Canal de tempo no `forgot-password`.** A resposta é idêntica, mas o caminho de uma conta existente faz escritas no banco e a de uma inexistente não; um atacante com medições precisas poderia inferir a existência. Risco baixo, mitigado pelo limite de 5 pedidos/hora por IP.
5. **Sem verificação de e-mail** no cadastro e sem 2FA.
6. **CSP com `'unsafe-inline'` em estilos.**
7. **Exclusão de conta definitiva**, sem período de recuperação nem anonimização (os dados são apagados).
8. **Dependências**: `npm audit --omit=dev` no frontend não encontrou vulnerabilidades (05/11/2026). No backend não foi possível rodar análise de dependências (sem acesso ao Maven Central); execute `mvn dependency-check:check` ou equivalente antes do deploy.
9. **Backups e rotação de segredos** dependem do ambiente de produção.

## Verificação

Os testes de isolamento e autorização do backend (acesso a tarefa e categoria de outro usuário, associação de categoria alheia, endpoints sem sessão, token de reset expirado e reutilizado) existem na suíte, mas **não puderam ser executados** neste ambiente (sem Maven Central e sem Docker). Rode `cd backend && mvn test` antes de confiar nesta documentação para auditoria.
