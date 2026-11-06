# Deploy no Render

O `render.yaml` na raiz descreve três recursos na mesma região (`virginia`; a região não pode ser alterada depois):

| Recurso | Tipo | Função |
|---|---|---|
| `taskflow-db` | PostgreSQL gerenciado | Dados e sessões |
| `taskflow-api` | Web Service Docker (`backend/`) | Spring Boot; roda as migrations Flyway ao iniciar |
| `taskflow-web` | Web Service Docker (`frontend/`) | Nginx: SPA + proxy de `/api/` |

> **Estado**: o `render.yaml` é YAML válido e segue a especificação do Blueprint, mas **nunca foi aplicado** a uma conta Render. Não há deploy executado. Revise a pré-visualização do Blueprint antes de confirmar.

## Custos e planos (conferir em <https://render.com/pricing>)

O arquivo usa planos pagos (`0.1c-256mb` no banco, `0.5c-512mb` nos serviços). Motivo: segundo a documentação do plano gratuito do Render (<https://render.com/docs/free>), serviços gratuitos hibernam após 15 min sem tráfego (cerca de 1 min para voltar), têm 750 horas/mês por workspace, **bloqueiam saída nas portas 25, 465 e 587** (SMTP) e **não recebem tráfego da rede privada**; o PostgreSQL gratuito é limitado a um por workspace, 1 GB, **expira 30 dias após a criação**, não tem backups. A documentação também afirma que instâncias gratuitas não devem ser usadas em produção.

Para um teste descartável, troque os três `plan` por `free` e aceite essas limitações. Em produção, valide quanta memória o backend usa: o JVM é limitado a 70 % da RAM do plano (`JAVA_OPTS`).

## Passo a passo

1. Suba o repositório para o GitHub (sem `.env`; o `.gitignore` já o exclui).
2. No Render: **New → Blueprint**, conecte o repositório e escolha `render.yaml`.
3. Preencha os valores pedidos (`sync: false`):
   - `taskflow-api`: `APP_PUBLIC_URL` e `CORS_ALLOWED_ORIGINS` = URL pública do frontend, **a mesma, sem barra final** (ex.: `https://taskflow-web.onrender.com`); `MAIL_*` (pode deixar em branco por ora).
   - `taskflow-web`: `BACKEND_URL` = URL pública do backend (ex.: `https://taskflow-api.onrender.com`).
4. O Render só informa a URL final depois de criar o serviço (se o nome já estiver em uso, acrescenta um sufixo). Se a URL for diferente da que você informou, corrija as variáveis no painel (**Environment**) e reimplante.
5. Aguarde o health check de cada serviço (`/actuator/health` e `/healthz`).
6. Acesse a URL do `taskflow-web`, cadastre-se e teste o fluxo.

`DATABASE_URL` é injetada pelo Render a partir do banco (`fromDatabase`). Como o Render a entrega no formato `postgresql://...`, o entrypoint do backend a converte em propriedades JDBC. Backend e banco usam a mesma região, então a conexão é interna.

## Variáveis em produção

| Variável | Serviço | Valor |
|---|---|---|
| `DATABASE_URL` | api | automática (banco) |
| `COOKIE_SECURE` | api | `true` (já no Blueprint) |
| `SWAGGER_ENABLED` | api | `false` (já no Blueprint) |
| `MAIL_LOG_LINKS` | api | `false` (nunca `true` em produção) |
| `APP_PUBLIC_URL`, `CORS_ALLOWED_ORIGINS` | api | URL do frontend |
| `MAIL_ENABLED`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM` | api | ver abaixo |
| `BACKEND_URL` | web | URL do backend |
| `PORT` | ambos | definida pelo Render |

Nenhum segredo é fixo no código ou no bundle do frontend.

## E-mail de recuperação de senha

O backend envia por **SMTP** (Spring Mail). Para ativar: `MAIL_ENABLED=true` e preencher host, porta, usuário, senha e remetente (`MAIL_FROM`, em domínio autorizado pelo provedor). Com `MAIL_ENABLED=false` nada é enviado e o log registra o aviso.

Atenção: no plano gratuito do Render as portas 25/465/587 são bloqueadas. Use um plano pago ou um provedor SMTP que aceite outra porta (muitos aceitam 2525) e configure `MAIL_PORT`. Não há integração por API HTTP de e-mail.

## Migrações, logs e diagnóstico

- As migrations (Flyway) rodam sozinhas no início do backend; falhas aparecem nos logs do serviço no painel.
- `GET /actuator/health` é o health check (único endpoint do actuator exposto). O indicador de e-mail está desativado (`management.health.mail.enabled=false`) para que um SMTP indisponível ou bloqueado não derrube o health check; o do banco permanece.
- Em caso de 502 no frontend logo após o deploy, o backend ainda está iniciando (a JVM pode levar mais de um minuto em instâncias pequenas).
- Reiniciar o backend não derruba sessões (ficam no PostgreSQL), mas zera os contadores de rate limit (memória).

## HTTPS e domínio próprio

O Render termina o TLS e redireciona HTTP para HTTPS. Para usar domínio próprio, adicione-o ao `taskflow-web` (**Settings → Custom Domains**) e atualize `APP_PUBLIC_URL` e `CORS_ALLOWED_ORIGINS` para o novo endereço. O backend continua em `onrender.com`; o navegador só enxerga o domínio do frontend.

## Backup

O banco precisa de rotina própria de backup conforme o plano contratado (o gratuito não oferece). Planeje isso antes de armazenar dados reais.

## Execução local equivalente

`docker compose up --build` reproduz a mesma topologia (Nginx → backend → PostgreSQL); veja o [README](../README.md).
