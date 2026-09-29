import { isAxiosError } from 'axios'
import { api } from '@/lib/api'
import type {
  FriendDto,
  FriendRequestDto,
  FriendshipDto,
} from '@/types/friendship'
import type { UserSummaryDto } from '@/types/user'

// GET /friends → 200 { friends }. Só amizades aceitas, já ordenadas pelo back
export async function fetchFriends() {
  const response = await api.get<{ friends: FriendDto[] }>('/friends')
  return response.data.friends
}

// GET /users/:username → 200 { user }. Busca exata; 404 = não existe → null
export async function fetchUserByUsername(username: string) {
  try {
    const response = await api.get<{ user: UserSummaryDto }>(
      `/users/${encodeURIComponent(username)}`,
    )
    return response.data.user
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) return null
    throw error
  }
}

// POST /invite-friendship → 201 { friendship }. 409 = o par já teve amizade (qualquer estado)
export async function inviteFriendship(recipientId: string) {
  const response = await api.post<{ friendship: FriendshipDto }>(
    '/invite-friendship',
    { recipientId },
  )
  return response.data.friendship
}

// GET /friend-requests → 200 { friendRequests }. Só os recebidos e ainda pendentes
export async function fetchFriendRequests() {
  const response = await api.get<{ friendRequests: FriendRequestDto[] }>(
    '/friend-requests',
  )
  return response.data.friendRequests
}

// PUT /invite-friendship-accept → 204. Só o destinatário, só pedido pendente
export async function acceptFriendRequest(friendshipId: string) {
  await api.put('/invite-friendship-accept', { friendshipId })
}

// PUT /invite-friendship-decline → 204. Definitivo: o par não pode mais se convidar
export async function declineFriendRequest(friendshipId: string) {
  await api.put('/invite-friendship-decline', { friendshipId })
}
