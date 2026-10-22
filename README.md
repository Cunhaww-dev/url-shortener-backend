# Encurtador de Links API

API para encurtar links e acompanhar cliques, feita com NestJS, PostgreSQL e Redis.

> 🚧 **Em desenvolvimento.** O núcleo (criar link, redirecionar e contar cliques) já funciona. Veja o [roadmap](#roadmap) para o que vem a seguir.

## Stack

NestJS 12 · TypeScript · PostgreSQL 18 + TypeORM (migrations) · Redis (ioredis) · `@nestjs/schedule` · Docker Compose

## Endpoints

| Método | Rota | O que faz |
| --- | --- | --- |
| POST | `/links` | Recebe `{ "url": "https://..." }` e devolve um código curto |
| GET | `/:code` | Redireciona (302) para o link original e conta o clique |
| GET | `/links/:code/stats` | Total de cliques e data de criação |

### Exemplo

```bash
curl -X POST localhost:3333/links -H "Content-Type: application/json" -d '{"url":"https://github.com"}'
# {"code":"bW16VSQ","shortUrl":"http://localhost:3333/bW16VSQ"}

curl -i localhost:3333/bW16VSQ
# HTTP/1.1 302 Found
# Location: https://github.com

curl localhost:3333/links/bW16VSQ/stats
# {"code":"bW16VSQ","url":"https://github.com","clicks":4,"createdAt":"..."}
```

## Como rodar

Pré-requisitos: Node.js 20.19+ e Docker.

```bash
cp .env.example .env     # preencha usuário, senha e nome do banco
docker compose up -d     # sobe Postgres e Redis
npm install
npm run start:dev        # aplica as migrations e sobe a API
```

A porta vem da variável `PORT` do `.env` (padrão `3000`). O `BASE_URL` precisa usar a mesma porta, porque é ele que monta o `shortUrl` devolvido pela API.

### Variáveis de ambiente

| Variável | Para quê |
| --- | --- |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Credenciais usadas pelo container do Postgres |
| `DATABASE_URL` | Conexão da API com o Postgres |
| `REDIS_URL` | Conexão da API com o Redis |
| `PORT` | Porta em que a API escuta |
| `BASE_URL` | Endereço público usado para montar o link curto |

## Como funciona

```
POST /links ──► LinksController ──► LinksService ──► Postgres (salva code + url)

GET /:code  ──► LinksService ──► Redis (cache da URL) ──► se não achar, Postgres
                     │
                     └──► Redis INCR clicks:<code>

a cada minuto: ClicksSyncService ──► SCAN clicks:* ──► GETDEL ──► soma no Postgres
```

## Decisões

- **Cache no Redis:** o redirect é a rota mais acessada. A URL fica 1 hora em memória, então a maioria dos redirects não consulta o banco.
- **Cliques contados no Redis:** cada clique é um `INCR` no Redis, e um job agendado (`@Cron`, a cada minuto) soma os totais no Postgres. Isso evita um `UPDATE` por clique, que viraria gargalo num link muito acessado. O custo: se o Redis cair, perde-se no máximo 1 minuto de cliques.
- **`SCAN` + `GETDEL` no job:** o `SCAN` percorre as chaves aos poucos, sem travar o Redis (o `KEYS` trava). O `GETDEL` lê e apaga o contador numa operação só, então nenhum clique que chegue no meio se perde.
- **Stats sempre atualizado:** o `/stats` soma o total do banco com os cliques que ainda estão no Redis esperando o job.
- **Código com `randomBytes` em base64url:** 7 caracteres seguros para URL, sem biblioteca extra. Se o código já existir (erro `23505` do Postgres), gera outro e tenta de novo, até 3 vezes.
- **Validação com DTO:** o `ValidationPipe` + `class-validator` rejeitam com 400 qualquer `url` que não seja um link válido com `http://` ou `https://`.
- **Migrations em vez de `synchronize`:** cada mudança no banco é um arquivo versionado no Git, e a API aplica as pendentes ao subir.
- **Portas só em `127.0.0.1`:** Postgres e Redis não ficam acessíveis por outros aparelhos da rede.

## Roadmap

- [x] Setup com Postgres e Redis no Docker Compose
- [x] Tabela `link` com migrations (TypeORM)
- [x] Endpoints de criar, redirecionar e estatísticas, com cache no Redis
- [x] Contador de cliques no Redis com sincronização agendada
- [ ] Swagger em `/docs`
- [ ] Health check em `/health` (API, banco e Redis)
- [ ] Rate limit na criação de links (10 por minuto por IP)
- [ ] Testes unitários (Vitest) e ponta a ponta (Supertest)
- [ ] Dockerfile multi-stage e CI no GitHub Actions
- [ ] Deploy em VPS com Nginx e HTTPS

### Ideias para depois

- Analytics por clique (data, origem, navegador)
- Alias personalizado (`409` se já existir)
- QR code por link
- Expiração de links (`410` depois da data)
- Fila (BullMQ) no lugar do job por minuto
