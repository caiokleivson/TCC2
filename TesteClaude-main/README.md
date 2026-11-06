# User Management API — Versão Final

API RESTful para gerenciamento de usuários com **Node.js**, **Express**, **PostgreSQL** e **Prisma ORM**, aplicando segurança OWASP e boas práticas de engenharia de software.

---

## Problemas Identificados e Corrigidos

| ID | Categoria | Problema | Correção |
|----|-----------|----------|----------|
| BUG-01 | Bug | `createUser` fazia lookup duplo com dead code | Removido `findByEmailWithPassword` desnecessário |
| BUG-02 | Bug | `DUMMY_HASH` inválido causava exceção no bcrypt | Substituído por hash válido pré-computado em `password.timingSafeCompare()` |
| BUG-03 | Bug | `authenticate` usava `throw` síncrono sem `next()` | Refatorado para `next(err)` em bloco try/catch |
| BUG-04 | Bug | `authorize` usava `throw` síncrono sem `next()` | Idem BUG-03 |
| BUG-05 | Bug | `authController.refresh` retornava `res.json()` diretamente sem AppError | Lança `UnauthorizedError` para manter padrão uniforme |
| BUG-06 | Bug | `package.json` com `name=user-api-v2` e `main=index.js` inexistente | Corrigido `name`, `version`, `main` e `description` |
| SEC-01 | Segurança | `jwt.js` lia secrets antes do `dotenv.config()` | Secrets lidos via `config/index.js`, importado após `dotenv` em `server.js` |
| SEC-02 | Segurança | `revoke` usava `updateMany` sem confirmar que revogou algo | Retorna `count` para o caller; caller pode inspecionar |
| SEC-03 | Segurança | `findValid` incluía `user` completo com `passwordHash` via `include` | Substituído por `select` explícito excluindo `passwordHash` |
| SEC-04 | Segurança | `refresh` não verificava `user.isActive` | Adicionada verificação; usuário desativado tem tokens todos revogados |
| SEC-05 | Segurança | `Number(req.params.id)` aceitava `NaN` silenciosamente | `parseId()` valida e rejeita com `ValidationError` |
| SEC-06 | Segurança | `COOKIE_OPTS` calculado no load-time | Movido para `config/index.js` |
| ORG-01 | Organização | `parseBody` duplicado em dois controllers | Extraído para `src/lib/parseBody.js` |
| ORG-02 | Organização | `requesterCtx` como função local sem documentação | Documentado com JSDoc e centralizado no controller |
| ORG-03 | Organização | Constantes mágicas espalhadas | Centralizadas em `src/config/index.js` |
| ORG-04 | Organização | `auditRepository.log` perdia stack trace no catch | Refatorado para `async/await` com `console.error(err)` completo |
| ORG-05 | Organização | `server.js` misturava validação, startup e shutdown | Separado em funções nomeadas: `validateEnv`, `start`, `scheduleTokenCleanup`, `shutdown` |
| ORG-06 | Organização | `COOKIE_OPTS` definido no controller | Movido para `src/config/index.js` |
| MAN-01 | Manutenção | Valores hardcoded espalhados (100, 20, 12, "7d") | Todos em `src/config/index.js` |
| MAN-02 | Manutenção | Strings de ação de auditoria hardcoded | Centralizadas em `src/constants/auditActions.js` |
| MAN-03 | Manutenção | JSDoc inconsistente | JSDoc adicionado em repositories, services e middlewares |
| MAN-04 | Manutenção | Timestamp do logger capturado no "finish" | Capturado no início da requisição |
| ESC-01 | Escalabilidade | Rate limiter in-memory (não compartilhado) | Documentado; comentário com instrução para migrar para Redis |
| ESC-02 | Escalabilidade | Sem cleanup de tokens expirados | `scheduleTokenCleanup()` executa a cada 24h via `setInterval` |

---

## Estrutura de Pastas

```
user-api/
├── server.js                          # Entry point: env validation, startup, shutdown, cleanup
├── .env.example                       # Modelo de variáveis de ambiente
├── .gitignore
├── package.json
│
├── prisma/
│   ├── schema.prisma                  # Modelos: User, RefreshToken, AuditLog
│   └── seed.js                        # Dados de teste (idempotente via upsert)
│
└── src/
    ├── app.js                         # Express: middlewares globais, rotas, error handler
    │
    ├── config/
    │   └── index.js                   # ★ Fonte única de todas as configurações
    │
    ├── constants/
    │   └── auditActions.js            # ★ Constantes para action strings do AuditLog
    │
    ├── lib/
    │   ├── prisma.js                  # Singleton do PrismaClient
    │   ├── jwt.js                     # signAccess, signRefresh, verifyAccess, verifyRefresh
    │   ├── password.js                # hash(), verify(), timingSafeCompare()
    │   └── parseBody.js               # ★ Helper Zod compartilhado (elimina duplicação)
    │
    ├── errors/
    │   └── AppError.js                # AppError + subclasses (Not Found, Conflict, etc.)
    │
    ├── validators/
    │   ├── authValidator.js           # loginSchema
    │   └── userValidator.js           # createUserSchema, updateUserSchema
    │
    ├── repositories/                  # Acesso ao banco — única camada que usa Prisma
    │   ├── userRepository.js          # CRUD de usuários (passwordHash nunca retornado)
    │   ├── refreshTokenRepository.js  # Tokens armazenados como SHA-256 hash
    │   └── auditRepository.js         # Inserção de AuditLog (não-bloqueante)
    │
    ├── services/                      # Regras de negócio
    │   ├── authService.js             # Login timing-safe, rotação de token, logout
    │   └── userService.js             # BOLA, RBAC, unicidade de e-mail, auditoria
    │
    ├── controllers/                   # Camada HTTP: parse req → service → res
    │   ├── authController.js
    │   └── userController.js
    │
    ├── routes/
    │   ├── index.js                   # Agrega rotas sob /api/v1
    │   ├── auth.js                    # /auth/login, /refresh, /logout, /logout-all
    │   └── users.js                   # /users CRUD
    │
    └── middlewares/
        ├── asyncHandler.js            # Wrapper para handlers async (elimina try/catch)
        ├── authenticate.js            # Extrai e valida JWT → popula req.user
        ├── authorize.js               # RBAC: authorize("ADMIN")
        ├── rateLimiter.js             # apiLimiter, authLimiter, writeLimiter
        ├── requestLogger.js           # Log com timestamp de início, userId, IP
        └── errorHandler.js            # Respostas seguras sem vazar internals
```

---

## Configuração

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar variáveis de ambiente
```bash
cp .env.example .env
```

Edite `.env`:
```env
DATABASE_URL="postgresql://postgres:senha@localhost:5432/user_api_db"

# Gere com: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_ACCESS_SECRET="<string-aleatória-64-bytes>"
JWT_REFRESH_SECRET="<string-aleatória-64-bytes-diferente>"

NODE_ENV=development
PORT=3000
```

### 3. Criar banco de dados
```sql
CREATE DATABASE user_api_db;
```

### 4. Gerar o Prisma Client e aplicar migrations
```bash
npm run db:generate      # gera o Prisma Client (lê prisma.config.js)
npm run db:migrate       # aplica migrations (dev)
npm run db:migrate:prod  # aplica migrations (produção)
```

> **Prisma 7 — Novo comportamento:** a URL de conexão não fica mais no `schema.prisma`.
> Ela é lida a partir do `prisma.config.js` na raiz do projeto, que por sua vez carrega
> o `DATABASE_URL` do arquivo `.env`. Nenhuma mudança no `.env` é necessária.

### 5. Popular dados de teste (opcional)
```bash
npm run db:seed
# ADMIN: alice@exemplo.com / Admin@123456
# USER:  bruno@exemplo.com / User@123456
```

### 6. Iniciar
```bash
npm run dev    # desenvolvimento (auto-reload)
npm start      # produção
```

---

## Endpoints

Base URL: `http://localhost:3000/api/v1`

### Autenticação

| Método | Rota | Autenticação | Rate Limit | Descrição |
|--------|------|--------------|------------|-----------|
| POST | `/auth/login` | — | 10/15min (falhas) | Login com e-mail e senha |
| POST | `/auth/refresh` | Cookie | 10/15min | Renova access token |
| POST | `/auth/logout` | Bearer | — | Logout do dispositivo atual |
| POST | `/auth/logout-all` | Bearer | — | Logout de todos os dispositivos |

### Usuários

| Método | Rota | Role | Rate Limit | Descrição |
|--------|------|------|------------|-----------|
| GET | `/users` | ADMIN | — | Lista usuários (paginado) |
| GET | `/users/:id` | ADMIN ou próprio | — | Busca usuário por ID |
| POST | `/users` | ADMIN | 20/min | Cria usuário |
| PUT | `/users/:id` | ADMIN ou próprio | 20/min | Atualiza usuário |
| DELETE | `/users/:id` | ADMIN ou próprio | 20/min | Desativa usuário |

---

## Exemplos de Uso

### Login
```bash
curl -c cookies.txt -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@exemplo.com","password":"Admin@123456"}'
```
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "user": { "id": 1, "name": "Alice Admin", "email": "alice@exemplo.com", "role": "ADMIN" }
}
```

### Listar usuários (ADMIN)
```bash
curl "http://localhost:3000/api/v1/users?page=1&limit=10" \
  -H "Authorization: Bearer <accessToken>"
```
```json
{
  "data": [...],
  "meta": { "total": 3, "page": 1, "limit": 10, "pages": 1 }
}
```

### Ver próprio perfil (USER)
```bash
curl http://localhost:3000/api/v1/users/2 \
  -H "Authorization: Bearer <accessToken>"
```

### Criar usuário
```bash
curl -X POST http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer <adminToken>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Daniel","email":"daniel@ex.com","password":"Senha@123","role":"USER"}'
```

### Atualizar usuário
```bash
curl -X PUT http://localhost:3000/api/v1/users/2 \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Bruno Atualizado"}'
```

### Renovar token
```bash
curl -b cookies.txt -c cookies.txt -X POST \
  http://localhost:3000/api/v1/auth/refresh
```
```json
{ "accessToken": "eyJhbGciOiJIUzI1NiJ9..." }
```

### Logout
```bash
curl -b cookies.txt -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Authorization: Bearer <accessToken>"
```

---

## Formato das Respostas de Erro

Todas as respostas de erro seguem o mesmo formato — sem vazar internals em produção:

```json
{ "error": "Acesso negado.", "code": "FORBIDDEN" }
{ "error": "Token inválido ou expirado.", "code": "UNAUTHORIZED" }
{ "error": "Muitas requisições.", "code": "RATE_LIMITED" }
{
  "error": "Dados de entrada inválidos.",
  "code": "VALIDATION_ERROR",
  "details": [
    { "field": "email", "message": "'email' inválido." },
    { "field": "password", "message": "'password' deve conter ao menos uma letra maiúscula." }
  ]
}
```

---

## Medidas de Segurança (OWASP)

| OWASP | Implementação |
|-------|---------------|
| **API1 BOLA** | Service verifica `requesterId === targetId` antes de qualquer operação |
| **API2 Auth** | JWT HS256, access 15min, refresh 7d em cookie `httpOnly+secure+sameSite=strict`, bcrypt custo 12, timing-safe login |
| **API3 Properties** | `select` explícito no repository — `passwordHash` nunca retornado |
| **API4 Resources** | 3 camadas de rate limit + payload limitado a 10kb |
| **API5 BFLA** | `authorize(...roles)` por rota + verificação de role no service |
| **API7 Config** | Helmet (11 headers), `x-powered-by` removido, secrets em variáveis de ambiente |
| **API8 Logging** | `AuditLog` no banco para todas ações sensíveis + request logger |
| **API9 Inventory** | Refresh tokens como hash SHA-256, rotação obrigatória, revogação em massa, cleanup periódico |
| **API10 Unsafe** | Zod com limites explícitos de tamanho, formato e conteúdo |
