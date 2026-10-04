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

// A mensagem que esta responde. body já vem cortado em 100 caracteres (com "…")
export interface ReplyToDto {
  id: string
  senderId: string
  body: string
}

export interface MessageDto {
  id: string // ULID: comparar strings = comparar tempo (a < b ⇒ a mais antiga)
  conversationId: string
  senderId: string
  body: string
  clientMessageId: string | null
  // null: não é resposta, ou a original não existe mais
  replyTo: ReplyToDto | null
  // null = nunca foi editada
  editedAt: Iso | null
  createdAt: Iso
}

// WebSocket. message-edited/message-deleted têm eventId: é ele (e não o id da
// mensagem) que vai no ack, porque é a chave de ordem do inbox do device
export type ServerFrame =
  | { type: 'message'; message: MessageDto }
  | { type: 'message-edited'; eventId: string; message: MessageDto }
  | {
      type: 'message-deleted'
      eventId: string
      messageId: string
      conversationId: string
    }
  | { type: 'ack-result'; messageId: string; acknowledged: boolean }

// Frames que mudam as mensagens (o ack-result é só resposta do servidor)
export type ChatEvent = Exclude<ServerFrame, { type: 'ack-result' }>

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
