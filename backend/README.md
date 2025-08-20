# API Users (NestJS)

Mouts Challange: CRUD de usuários (POST, GET, GET por id, PUT, DELETE) e Auth usando TypeORM + Postgres e Redis para cache.

## Sumário
- Visão geral
- Requisitos
- Instalação
- Execução (dev / produção / Docker)
- Variáveis de ambiente
- Endpoints
- Logs (Winston)
- Cache (Redis)
- Testes
- Migrações
- Observações


## Requisitos
- Node.js (v18+ recomendado)
- npm
- Docker (opcional, recomendado para banco e redis)

## Instalação

No PowerShell, na pasta do projeto:

```powershell
npm install
```

## Execução

Modo desenvolvimento (auto-reload):

```powershell
npm run start:dev
```

Build e execução:

```powershell
npm run build
npm start
```

### Docker Compose

!! NECESSÁRIO TER O DOCKER INSTALADO

O repositório inclui um `docker-compose.yml` que sobe o serviço `app` e containers para Postgres e Redis. Para subir:

```powershell
docker compose up -d --build
```

Isso criará as imagens e iniciará os serviços. A API ficará disponível na porta configurada em `.env` (padrão 3000).

Se quiser executar somente os containers de infra (Postgres e Redis) sem o `app`:

```powershell
docker compose up -d postgres redis
```

Ou usar containers individuais:

```powershell
# Postgres
docker run --name nest-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=nest_users_db -p 5432:5432 -d postgres:15

# Redis
docker run --name nest-redis -p 6379:6379 -d redis:7
```

## Endpoints

Base: `/user`

- POST /user
	- Cria um usuário.
	- Body (JSON): { name, email, password, bio? }
	- Validações: `name` (1-100), `email` (válido, único), `password` (6-128), `bio` (opcional).

	Exemplo de resposta (201 Created):

```json
{
	"id": "a1b2c3d4-1111-2222-3333-abcdef012345",
	"name": "Alice",
	"email": "alice@alice.com",
	"bio": "Desenvolvedora",
	"createdAt": "2025-08-19T12:34:56.789Z"
}
```

- GET /user
	- Retorna lista de usuários (sem senhas).
	- Requer token JWT (Bearer) para autenticação.
	- Cache: resultado armazenado no Redis por 60s usando a chave `users:all`.

	Exemplo de resposta (200 OK):

```json
[
	{
		"id": "a1b2c3d4-1111-2222-3333-abcdef012345",
		"name": "Alice",
		"email": "alice@alice.com",
		"bio": "Desenvolvedora",
		"createdAt": "2025-08-19T12:34:56.789Z"
	}
]
```

- GET /user/:id
	- Retorna um usuário específico (sem senha).
	- Requer token JWT.
	- Cache: resultado armazenado no Redis por 60s usando a chave `users:{id}`.

	Exemplo de resposta (200 OK):

```json
{
	"id": "a1b2c3d4-1111-2222-3333-abcdef012345",
	"name": "Alice",
	"email": "alice@alice.com",
	"bio": "Desenvolvedora",
	"createdAt": "2025-08-19T12:34:56.789Z"
}
```

- PUT /user/:id
	- Atualiza os dados do usuário (não altera senha automaticamente; envie senha se quiser alterá-la).
	- Requer token JWT.

	Exemplo de resposta (200 OK):

```json
{
	"id": "a1b2c3d4-1111-2222-3333-abcdef012345",
	"name": "Alice Updated",
	"email": "alice@alice.com",
	"bio": "Nova bio",
	"createdAt": "2025-08-19T12:34:56.789Z"
}
```

- DELETE /user/:id
	- Remove o usuário.
	- Requer token JWT.

	Exemplo de resposta (200 OK):

```json
{ "deleted": true }
```

Autenticação:
- POST /auth/login
	- Recebe { email, password }
	- Retorna { access_token } em caso de sucesso.

	Exemplo de resposta (200 OK):

```json
{ "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
```

## Autenticação (JWT)

Autenticação é feita via JSON Web Tokens (JWT). Fluxo e detalhes:

- Fluxo de login
	1. Cliente faz POST para `/auth/login` com body JSON: { "email": "...", "password": "..." }.
	2. `AuthService.validateUser` busca o usuário por email (`UsersService.findByEmail`) e compara a senha enviada com o hash armazenado usando `bcrypt.compare`.
	3. Se válido, a senha é removida do objeto retornado e `AuthService.login` gera o token JWT.
	4. O token assinado contém o payload `{ username: user.email, sub: user.id }` e é devolvido como `{ access_token: "..." }`.

- Configuração e validade
	- A chave `JWT_SECRET` é lida via `.env`. Não deixe o valor padrão em produção.
	- A validade do token é configurada em `AuthModule` (`signOptions: { expiresIn: '1h' }`) — padrão: 1 hora.
	- Para alterar a validade, ajuste `expiresIn` em `src/auth/auth.module.ts`.

- Protegendo endpoints
	- Endpoints protegidos usam `@UseGuards(AuthGuard('jwt'))` (no controller). O `JwtStrategy` extrai o token do header `Authorization: Bearer <token>` e, se válido, expõe `request.user` com `{ id, email }` (construído a partir do payload).

- Hash de senhas
	- Senhas são armazenadas como hash usando `bcrypt` (salt rounds = 10) na criação do usuário (`UsersService.create`). Nunca armazene senhas em texto claro.

- Exemplo de uso (curl)

1) Login e obtenção do token:

```bash
curl -s -X POST http://localhost:3000/auth/login \
	-H "Content-Type: application/json" \
	-d '{"email":"alice@alice.com","password":"P@ssw0rd"}'

# resposta esperada: { "access_token": "eyJ..." }
```

2) Requisição para endpoint protegido com token:

```bash
TOKEN="eyJ..."
curl -s http://localhost:3000/user -H "Authorization: Bearer $TOKEN"
```

Swagger UI está disponível em `/api` quando a aplicação está rodando.

## Swagger / Autorizar (usar endpoints protegidos)

Para testar endpoints protegidos diretamente pelo Swagger UI (`/api`), siga estes passos:

1. Faça uma requisição POST para `/auth/login` usando o formulário do Swagger ou a aba "Try it" do endpoint `/auth/login`. Envie JSON com `email` e `password`.
	 - Exemplo de body:

```json
{
	"email": "alice@example.com",
	"password": "P@ssw0rd"
}
```

2. Copie o `access_token` retornado pelo login (valor da chave `access_token`).

3. No topo do Swagger UI clique em "Authorize" (botão com ícone de cadeado).

4. Na caixa que abrir cole o token no formato:

```
Bearer <access_token>
```

Por exemplo:

```
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

5. Clique em "Authorize" na janela e depois em "Close". O Swagger enviará automaticamente o header `Authorization: Bearer <token>` nas requisições para endpoints protegidos.

6. Agora você pode usar os endpoints marcados com `Authorize`/`Bearer` sem inserir manualmente o header.

Observações:
- O esquema de segurança do Swagger está registrado com o nome `access-token` no projeto. Use o formato `Bearer <token>` exatamente como enviado pelo endpoint de login.
- Se o token expirar (padrão 1h), repita o login e autorize novamente.
- Para testar sem Swagger, inclua o header HTTP `Authorization: Bearer <token>` nas suas requisições.

## Healthcheck

A aplicação expõe um endpoint de saúde em `/health` implementado em `src/health/health.controller.ts`.
Ele realiza duas verificações principais:

- Banco de dados: executa uma query simples (`SELECT 1`) usando o `DataSource` do TypeORM para garantir que o Postgres está acessível.
- Redis: verifica o cliente Redis via `ping` ou via um `set` curto para confirmar que o cache está respondendo.

Resposta exemplo:

```json
{ "status": "ok", "checks": { "db": true, "redis": true } }
```

Por que isso é importante:

- Orquestração: `docker-compose.yml` e orquestradores (Kubernetes, ECS) podem usar este endpoint para health/readiness checks e evitar rotear tráfego para containers não prontos.
- Startup seguro: combinado com `wait-for-postgres.sh`, garante que a aplicação só entre em estado pronto quando dependências críticas estiverem disponíveis.
- Observabilidade: facilita monitoramento e alertas (uma queda em `db` ou `redis` aparece imediatamente no health).

Exemplo (curl):

```bash
curl -s http://localhost:3000/health | jq
```


## Logs (Winston)

O projeto usa `nest-winston` + `winston` para logs. A configuração atual registra logs no console com formato simples. Exemplos de uso:

- No `main.ts` o logger é criado via `WinstonModule.createLogger` e passado ao `NestFactory.create`.
- Mensagens importantes como erros de migração ou startup são logadas. Em produção você pode adicionar transportes (arquivos, serviços externos) usando `winston.transports.File` ou integrações.

Exemplos de logs (console):

```
info: Application listening on port 3000
info: Connected to database
info: Connected to redis
error: Error running migrations on startup Error: relation "users" does not exist
```

Exemplo de log em arquivo (quando configurado com timestamp):

```
2025-08-19T12:34:56.789Z info: Application listening on port 3000
2025-08-19T12:35:01.123Z error: Error running migrations on startup Error: relation "users" does not exist
```

Boas práticas de logs:

- Use níveis (error, warn, info, debug) corretamente.
- Não escreva segredos em logs.
- Centralize logs em um serviço (ELK, CloudWatch, Datadog) em produção.

## Cache (Redis)

- O módulo `RedisModule` registra um client global `REDIS_CLIENT` usando `ioredis`.
- A `UsersService` usa Redis para cache das rotas GET. Chaves usadas:
	- `users:all` — lista de usuários
	- `users:{id}` — usuário por id
- TTL padrão configurado no código: 60 segundos.

Exemplos de conteúdo armazenado no Redis (JSON serializado):

- Chave `users:all` (lista de usuários):

```json
[{
	"id": "a1b2c3d4-1111-2222-3333-abcdef012345",
	"name": "Alice",
	"email": "alice@alice.com",
	"bio": "Desenvolvedora",
	"createdAt": "2025-08-19T12:34:56.789Z"
}]
```

- Chave `users:{id}` (usuário individual):

```json
{
	"id": "a1b2c3d4-1111-2222-3333-abcdef012345",
	"name": "Alice",
	"email": "alice@alice.com",
	"bio": "Desenvolvedora",
	"createdAt": "2025-08-19T12:34:56.789Z"
}
```

Como inspecionar no Redis (CLI):

```powershell
redis-cli GET users:all
redis-cli GET users:a1b2c3d4-1111-2222-3333-abcdef012345
```

Nota: valores são armazenados como string JSON; TTL é aplicado por 60s conforme implementado no código.

## Testes

Executar testes unitários com Jest:

```powershell
npm test
```

## Migrações

O projeto usa TypeORM. As configurações principais estão em `app.module.ts`. Você pode usar `RUN_MIGRATIONS=true` para aplicar migrações automaticamente no startup (variável `RUN_MIGRATIONS` no `.env`).