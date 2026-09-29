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
