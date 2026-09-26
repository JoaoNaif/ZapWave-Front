# CLAUDE.md

Frontend do **ZapWave**: chat em tempo real (estilo WhatsApp simplificado). Responda em
**pt-BR**, de forma **simples e direta**. Em pergunta de opinião, dê uma recomendação curta e
espere o "pode fazer" antes de implementar.

## Backend

- Fica em `../ZapWave` (repo `JoaoNaif/ZapWave`, NestJS). Acessível nesta sessão e atualizado
  com `git pull` ao abrir (hook em `.claude/settings.local.json`).
- Visão geral do back: @../ZapWave/CLAUDE.md
- **Não altere arquivos do back a partir daqui sem pedir.**
- O back é um projeto de **estudo de Node streams**; o chat é só o cenário. Não peça mudança no
  transporte/entrega de mensagens sem motivo forte. Pedir endpoints de **leitura** novos é
  normal e esperado.
- **Não invente endpoint.** Se uma tela precisar de algo das [lacunas](#lacunas-do-backend),
  isole a chamada atrás de um serviço (ex.: `ConversationsApi`), use dados falsos e registre o
  pedido: essas rotas serão desenhadas no back **junto com o front, tela por tela**.
- Se este arquivo e o código do back divergirem, **o código manda**:

| Assunto | Arquivo no back |
|---|---|
| Rotas e status HTTP | `src/infra/http/controllers/**/*.controller.ts` |
| Exemplos de request/response | `*.e2e-spec.ts` ao lado de cada controller |
| Regras de negócio | `src/domain/*/applications/use-cases/*.ts` |
| Formato dos DTOs | `src/domain/*/applications/dtos/*.ts` e `mappers/*.ts` |
| Handshake / close codes do WS | `src/infra/websocket/ws-auth.ts`, `close-codes.ts` |
| Frames do WS | `src/infra/websocket/chat.gateway.ts`, `src/infra/streams/enrich.transform.ts` |
| Heartbeat / presença | `src/infra/websocket/heartbeat.ts`, `src/infra/redis/redis-presence.ts` |
| Conceitos | `docs/05-websocket.md`, `docs/06-redis-streams.md`, `docs/03-entidades.md` |

Subir o back (normalmente o dono já sobe): `npm run services:up` + `npm run start:dev` em
`../ZapWave`. Health: `GET http://localhost:3333/health`.

## Front — estado atual

- React 19 + Vite 8 + TypeScript 6, **React Compiler** ligado (`vite.config.ts`) → não precisa
  de `useMemo`/`useCallback` manual. `StrictMode` ativo.
- Ainda é o template do Vite: sem router, lib de estado, lib HTTP, estilização ou testes.
- Comandos: `npm run dev` (porta **5173**, já liberada no CORS do back), `npm run build`,
  `npm run lint`.
- Convenções (pastas, estado, estilo, testes): **a definir com o dono** — pergunte antes de
  escolher.

## Modelo mental do servidor

```
HTTP (cookie)                               WebSocket (cookie + ?deviceId=)
  escrever: enviar msg, amizade, salas, ack   servidor → cliente: mensagens
  ler: histórico, /me, presença, notific.     cliente → servidor: só "ack"
Postgres = fonte da verdade   |   Redis = tempo real (inbox por device, presença)
```

- **Enviar mensagem é HTTP** (`POST /message`). O WebSocket serve para **receber** (+ `ack`).
- **Device**: todo login cria um `Device` (uuid); é a identidade da sessão e da conexão WS.
- **Inbox por device**: cada mensagem vai para todos os devices ativos de todos os membros,
  **inclusive os do remetente** (você recebe o eco da sua própria mensagem).
- Device novo não recebe o passado pelo WS: o **passado vem do histórico HTTP**; o WS entrega
  o delta ao vivo + pendentes sem ack.
- Entrega **"pelo menos uma vez"**: o front **deduplica por `message.id`** e **envia `ack`**.
- **Tempo real só para mensagens.** Presença, notificações, pedidos e convites: polling HTTP.

## Ambiente

| Item | Valor |
|---|---|
| API | `http://localhost:3333` |
| WebSocket | `ws://localhost:3333/ws?deviceId=<uuid>` |
| Origens liberadas (CORS e WS) | `localhost:3000` e `localhost:5173`; outras exigem `CORS_ORIGINS` no `.env` do back |
| Datas | string ISO 8601 → parse no boundary |
| IDs | uuid para tudo, **exceto mensagem: ULID** (26 chars, ordenável: `a < b` ⇒ `a` mais antiga; não converta) |
| Rate limit (429) | geral 300/min; `POST /sessions` 10/min; `POST /register` 5/min; `GET /users/:username` 30/min |

## Autenticação

- Sessão = cookie `access_token` **HttpOnly**, `SameSite=Lax`, 24h. O JS não lê o token.
- Toda requisição com `credentials: 'include'` (ou `withCredentials: true`).
- Tudo exige login, exceto `POST /register`, `POST /sessions`, `GET /health`.
- **Sair = `PUT /revoke-device` com o próprio `deviceId`** (não há logout). Vale na hora:
  HTTP vira 401 e o WS daquele device fecha com **4401**.

Boot da SPA:

```
GET /me → 200 { user, deviceId } → abrir WS  |  401 → login
login:    POST /sessions → GET /me → abrir WS
cadastro: POST /register (NÃO loga) → POST /sessions
```

## Erros

Formato Nest: `{ statusCode, message, error }`. Validação: `{ message: 'Validation failed', statusCode: 400, errors }`.

| Situação | Status |
|---|---|
| body/param/query inválido | 400 |
| não existe **ou você não é membro da conversa** | 404 |
| **sem permissão** (não é o destinatário, não é admin, owner saindo…) | **401** ⚠ |
| duplicado | 409 |
| DM sem amizade aceita | 406 |
| sessão inexistente/expirada/revogada | 401 |

⚠ **401 ≠ deslogado.** Em 401 numa rota de negócio, confirme com `GET /me`; só se ele também der
401 a sessão acabou.

## Contrato HTTP

**Conta**

| Rota | Body | Resposta |
|---|---|---|
| `POST /register` | `{ email, username, displayName, password }` (senha mín. 6) | 201 `{ user }`; 409 e-mail/username em uso. Não loga |
| `POST /sessions` | `{ email, password, deviceName }` (`deviceName` obrigatório, pode ser `null`) | 200 `{ device_id }` ⚠ snake_case + cookie; 401 genérico. **Cada chamada cria um Device novo** |
| `GET /me` | — | 200 `{ user, deviceId }` |
| `GET /users/:username` | — | 200 `{ user: UserSummaryDto }`; 404. Busca **exata**, sem autocomplete |
| `PUT /revoke-device` | `{ deviceId }` | 204 |

**Amizade**

| Rota | Body | Resposta |
|---|---|---|
| `POST /invite-friendship` | `{ recipientId }` | 201 `{ friendship }`; **409 se o par já teve amizade em qualquer estado** (recusa é definitiva); 401 a si mesmo |
| `PUT /invite-friendship-accept` | `{ friendshipId }` | 204; só o destinatário, só `pending` |
| `PUT /invite-friendship-decline` | `{ friendshipId }` | 204; marca `rejected` |

**Salas** (os DTOs usam `roomId` em vez de `conversationId` → normalize como `Conversation` com `type: 'room'`)

| Rota | Body | Resposta |
|---|---|---|
| `POST /room` | `{ name }` | 201 `{ room, owner }` |
| `POST /room-invite` | `{ conversationId, recipientId }` | 201 `{ room, invite, sender }`; só owner/admin |
| `POST /room-invite-accept` | `{ inviteId }` | 201 `{ room, invite, member }` |
| `DELETE /room-leave` | `{ conversationId }` ⚠ body em DELETE | 204; owner não pode sair (401) |
| `DELETE /room-remove-member` | `{ conversationId, targetUserId }` ⚠ body em DELETE | 204; owner remove qualquer um, admin só `member` |

**Conversas e mensagens**

| Rota | Body / query | Resposta |
|---|---|---|
| `POST /direct-conversation` | `{ friendId }` | **sempre 201** `{ conversation, member, isNewConversation }` (find-or-create); 406 amizade não aceita |
| `POST /message` | `{ conversationId, body, clientMessageId? }` (1–4000 chars, trimmed) | 201 `{ message }`. **Idempotente por `clientMessageId`** |
| `GET /conversation-history/:id?before=<ulid>&limit=<1..100>` | limit padrão 50 | 200 `{ messages, hasMore }`, **mais nova → mais antiga**. Paginar: `before` = id da mais antiga |
| `PUT /mark-conversation` | `{ conversationId, messageId }` | 200 `{ read }` — recibo de leitura (✓✓), por usuário |
| `PUT /message-ack` | `{ deviceId, messageId }` | 200 `{ acknowledged }` — alternativa HTTP ao ack do WS |
| `GET /presence/:userId` | — | 200 `{ presence: { userId, online, lastSeenAt } }` (polling) |

**Notificações**

| Rota | Body | Resposta |
|---|---|---|
| `GET /notifications` | — | 200 `{ notifications }` (sem paginação) |
| `PUT /notification-read` | `{ notificationId }` | 200 `{ notification }` |

⚠ A notificação só tem `title`/`content`, com **uuid cru** no texto, e **não traz
`friendshipId`/`inviteId`**.

## Tipos

```ts
type Iso = string

interface UserDto { id: string; username: string; displayName: string; email: string; createdAt: Iso; updatedAt: Iso }
interface UserSummaryDto { id: string; username: string; displayName: string }

interface FriendshipDto {
  id: string; senderId: string; recipientId: string
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: Iso; updatedAt: Iso
}

interface ConversationDto { id: string; type: 'dm' | 'room'; name: string | null; createdById: string; createdAt: Iso }
interface ConversationMemberDto {
  id: string; conversationId: string; userId: string
  role: 'owner' | 'admin' | 'member'
  joinedAt: Iso; lastReadMessageId: string | null
}

interface MessageDto {
  id: string // ULID
  conversationId: string; senderId: string
  body: string; clientMessageId: string | null; createdAt: Iso
}

interface PresenceDto { userId: string; online: boolean; lastSeenAt: Iso | null }
interface NotificationDto { id: string; recipientId: string; title: string; content: string; readAt: Iso | null; createdAt: Iso }

// Salas: mesma coisa que Conversation*, com roomId no lugar de conversationId
interface RoomDto { id: string; name: string | null; type: 'dm' | 'room'; createdById: string; createdAt: Iso }
interface RoomMemberDto { id: string; roomId: string; userId: string; role: 'owner' | 'admin' | 'member'; joinedAt: Iso; lastReadMessageId: string | null }
interface RoomInviteDto {
  id: string; roomId: string; inviterId: string; inviteeId: string
  status: 'pending' | 'accepted' | 'declined' | 'revoked'
  createdAt: Iso; respondedAt: Iso | null
}

// WebSocket
type ServerFrame =
  | { type: 'message'; message: MessageDto }
  | { type: 'ack-result'; messageId: string; acknowledged: boolean }
type ClientFrame = { type: 'ack'; messageId: string }
```

## WebSocket

- `new WebSocket('ws://localhost:3333/ws?deviceId=' + deviceId)`: o navegador manda cookie e
  `Origin` sozinho (não dá para setar headers; não tente).
- Qualquer falha de handshake (Origin, JWT, device inexistente, de outro usuário ou revogado) →
  close **4401**, sem dizer o motivo. 4401 também derruba socket aberto quando o device é revogado.
- Ao abrir, o servidor já empurra os **pendentes sem ack** e depois o ao vivo. O cliente não
  manda cursor.
- Frame malformado do cliente é **ignorado em silêncio**.

**Ack**
- **Cumulativo**: confirmar `X` confirma todas as anteriores. Mande só o maior id (debounce ~300 ms).
- Só confirme **depois de guardar no estado**. Sem ack a mensagem volta a cada reconexão e o
  inbox cresce (~1000 por device).
- Ack (entrega, por device) ≠ `PUT /mark-conversation` (leitura, por usuário).

**Heartbeat**: ping do servidor a cada 20 s; o navegador responde pong sozinho. Sem pong → conexão
derrubada (~40 s). Presença "online" é janela de 45 s renovada pelo pong.

**Reconexão**
- **4401**: não reconecte no automático → `GET /me` (401 = login; 200 = pode tentar de novo).
- Outros fechamentos: backoff exponencial + jitter, **mesmo `deviceId`**, deduplicando por id.
- Depois de muito tempo offline: busque a última página do histórico da conversa aberta e faça
  merge por id (o inbox do Redis é uma janela; o histórico completo está no Postgres).

**Multi-aba não é suportado**: todas as abas têm o mesmo `deviceId` e disputariam o mesmo inbox.
Só **uma aba** mantém o WS (líder via `navigator.locks`/`BroadcastChannel`) e repassa às outras.
Com **StrictMode** (monta 2×): feche o socket no cleanup e nunca abra dois ao mesmo tempo.

## Receitas

**Enviar**: `clientMessageId = crypto.randomUUID()` → mostra otimista → `POST /message` → 201
troca pela `MessageDto` → erro de rede: reenvia com o **mesmo** `clientMessageId` → o eco via WS
é ignorado se o `id`/`clientMessageId` já está no estado.

**Receber**: frame `message` → dedup por id → adiciona → agenda ack do maior id → se a conversa
está aberta e visível, `PUT /mark-conversation`.

**Abrir conversa**: `GET /conversation-history/:id` → inverte para exibir → scroll para cima com
`hasMore` usa `before=<id mais antigo>`.

**Iniciar DM**: `GET /users/:username` → `POST /invite-friendship` → (outro aceita) →
`POST /direct-conversation { friendId }`.

## Lacunas do backend

Não existem ainda; serão criadas **junto com o front**, quando a tela precisar:

- **Listar minhas conversas** (DMs + salas, com última msg e não lidas): a maior lacuna
- Listar amigos
- Pedidos de amizade pendentes (sem eles não há `friendshipId` para aceitar/recusar)
- Convites de sala pendentes (sem `inviteId` não dá para aceitar) e recusar convite de sala
- Membros de uma sala
- Meus devices
- Contador de não lidas (o dado `lastReadMessageId` existe, mas não é exposto)
- "Digitando…" (frame `typing`)
- Push de notificação/presença/pedidos; presença em lote
- Texto de notificação legível (hoje tem uuid cru)
- Fora de escopo: transferir dono, editar/apagar mensagem, mídia
