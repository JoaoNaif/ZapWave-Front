import { api } from '@/lib/api'
import type {
  MyRoomDto,
  ReceivedRoomInviteDto,
  RoomDto,
  RoomMemberSummaryDto,
} from '@/types/room'

// GET /rooms → 200 { rooms }. Só salas (sem DMs), última atividade primeiro
export async function fetchMyRooms() {
  const response = await api.get<{ rooms: MyRoomDto[] }>('/rooms')
  return response.data.rooms
}

// POST /room → 201 { room, owner }. Quem cria vira owner
export async function createRoom(name: string) {
  const response = await api.post<{ room: RoomDto }>('/room', { name })
  return response.data.room
}

// GET /rooms/:id/members → 200 { members }. 404 = não existe ou não sou membro
export async function fetchRoomMembers(roomId: string) {
  const response = await api.get<{ members: RoomMemberSummaryDto[] }>(
    `/rooms/${roomId}/members`,
  )
  return response.data.members
}

// GET /room-invites → 200 { roomInvites }. Só os recebidos e pendentes
export async function fetchRoomInvites() {
  const response = await api.get<{ roomInvites: ReceivedRoomInviteDto[] }>(
    '/room-invites',
  )
  return response.data.roomInvites
}

// POST /room-invite → 201. Só owner/admin. 409 = já é membro ou já foi convidado
export async function inviteToRoom(data: {
  conversationId: string
  recipientId: string
}) {
  await api.post('/room-invite', data)
}

// POST /room-invite-accept → 201. Entra como member
export async function acceptRoomInvite(inviteId: string) {
  await api.post('/room-invite-accept', { inviteId })
}

// POST /room-invite-decline → 204
export async function declineRoomInvite(inviteId: string) {
  await api.post('/room-invite-decline', { inviteId })
}

// DELETE /room-leave → 204. Body em DELETE (axios: `data`). Owner não sai (401)
export async function leaveRoom(conversationId: string) {
  await api.delete('/room-leave', { data: { conversationId } })
}

interface MemberAction {
  conversationId: string
  targetUserId: string
}

// DELETE /room-remove-member → 204. Owner remove qualquer um; admin só member
export async function removeRoomMember(data: MemberAction) {
  await api.delete('/room-remove-member', { data })
}

// PUT /room-promote-admin → 204. Só o owner
export async function promoteToAdmin(data: MemberAction) {
  await api.put('/room-promote-admin', data)
}

// PUT /room-demote-admin → 204. Só o owner
export async function demoteAdmin(data: MemberAction) {
  await api.put('/room-demote-admin', data)
}
