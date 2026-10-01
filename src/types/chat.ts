type Iso = string

export interface ConversationDto {
  id: string
  type: 'dm' | 'room'
  name: string | null
  createdById: string
  createdAt: Iso
}

export interface ConversationMemberDto {
  id: string
  conversationId: string
  userId: string
  role: 'owner' | 'admin' | 'member'
  joinedAt: Iso
  lastReadMessageId: string | null
}

export interface MessageDto {
  id: string // ULID: comparar strings = comparar tempo (a < b ⇒ a mais antiga)
  conversationId: string
  senderId: string
  body: string
  clientMessageId: string | null
  createdAt: Iso
}

// WebSocket
export type ServerFrame =
  | { type: 'message'; message: MessageDto }
  | { type: 'ack-result'; messageId: string; acknowledged: boolean }

export type ClientFrame = { type: 'ack'; messageId: string }

// GET /presence/:userId. lastSeenAt = último heartbeat do WS (ping a cada 20 s);
// null = nunca se conectou. online = heartbeat nos últimos 45 s
export interface PresenceDto {
  userId: string
  online: boolean
  lastSeenAt: Iso | null
}

// Última mensagem de uma conversa, para a prévia nas listas (/friends, /rooms).
// body já vem cortado em 100 caracteres (com "…")
export interface LastMessagePreviewDto {
  id: string
  senderId: string
  senderDisplayName: string
  body: string
  createdAt: Iso
}

// GET /conversations/:id/reads: até onde cada OUTRO membro leu (o meu fica
// de fora). null = nunca leu
export interface ConversationReadDto {
  userId: string
  lastReadMessageId: string | null
}
