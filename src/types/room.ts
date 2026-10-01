import type { UserSummaryDto } from './user'

type Iso = string

export type RoomRole = 'owner' | 'admin' | 'member'

// GET /rooms: role é o MEU papel. Ordenado por última atividade (msg ou criação)
export interface MyRoomDto {
  id: string // = conversationId (histórico, envio, WS)
  name: string
  role: RoomRole
  memberCount: number
  lastMessageAt: Iso | null
  // Mensagens dos outros depois do meu lastReadMessageId (ou de quando entrei)
  unreadCount: number
}

// GET /room-invites: convites recebidos e pendentes, mais recente primeiro
export interface ReceivedRoomInviteDto {
  inviteId: string
  room: { id: string; name: string }
  inviter: UserSummaryDto
  createdAt: Iso
}

// GET /rooms/:id/members: id é o do USUÁRIO (casa com senderId das mensagens).
// Ordem: owner, admins, members; alfabético dentro de cada papel
export interface RoomMemberSummaryDto extends UserSummaryDto {
  role: RoomRole
}

// POST /room (os DTOs de sala usam roomId em vez de conversationId)
export interface RoomDto {
  id: string
  name: string | null
  type: 'dm' | 'room'
  createdById: string
  createdAt: Iso
}
