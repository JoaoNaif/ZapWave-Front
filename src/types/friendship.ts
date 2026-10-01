import type { UserSummaryDto } from './user'

type Iso = string

export interface FriendshipDto {
  id: string
  senderId: string
  recipientId: string
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: Iso
  updatedAt: Iso
}

// GET /friends: já vem ordenado pela última mensagem trocada na DM
export interface FriendDto extends UserSummaryDto {
  online: boolean
  lastMessageAt: Iso | null
  // Mensagens do amigo na DM que eu ainda não li (0 se não há DM)
  unreadCount: number
}

// GET /friend-requests: pedidos recebidos e pendentes, mais recente primeiro
export interface FriendRequestDto {
  friendshipId: string
  sender: UserSummaryDto
  createdAt: Iso
}
