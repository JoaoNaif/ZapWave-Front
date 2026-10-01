import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ReceivedRoomInviteDto } from '@/types/room'
import {
  acceptRoomInvite,
  createRoom,
  declineRoomInvite,
  demoteAdmin,
  fetchMyRooms,
  fetchRoomInvites,
  fetchRoomMembers,
  inviteToRoom,
  leaveRoom,
  promoteToAdmin,
  removeRoomMember,
} from './api'

export const roomsQueryKey = ['rooms']
const roomInvitesQueryKey = ['room-invites']
// Fora do prefixo ['rooms']: invalidar a lista de salas (a cada mensagem nova)
// não deve rebuscar os membros
export const membersQueryKey = (roomId: string) => ['room-members', roomId]

// Sem push para "fui adicionado/removido": polling, igual amigos
export function useRooms() {
  return useQuery({
    queryKey: roomsQueryKey,
    queryFn: fetchMyRooms,
    refetchInterval: 30_000,
  })
}

export function useCreateRoom() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createRoom,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: roomsQueryKey }),
  })
}

// enabled: só busca quando já sei que sou membro (senão é 404 garantido)
export function useRoomMembers(roomId: string, enabled = true) {
  return useQuery({
    queryKey: membersQueryKey(roomId),
    queryFn: () => fetchRoomMembers(roomId),
    refetchInterval: 30_000,
    enabled,
  })
}

export function useRoomInvites() {
  return useQuery({
    queryKey: roomInvitesQueryKey,
    queryFn: fetchRoomInvites,
    refetchInterval: 30_000,
  })
}

// Tira o convite da lista na hora, sem esperar o refetch
function useRemoveInvite() {
  const queryClient = useQueryClient()

  return (inviteId: string) => {
    queryClient.setQueryData<ReceivedRoomInviteDto[]>(
      roomInvitesQueryKey,
      (invites) => invites?.filter((invite) => invite.inviteId !== inviteId),
    )
    return queryClient.invalidateQueries({ queryKey: roomInvitesQueryKey })
  }
}

export function useAcceptRoomInvite() {
  const queryClient = useQueryClient()
  const removeInvite = useRemoveInvite()

  return useMutation({
    mutationFn: acceptRoomInvite,
    // O grupo já aparece na lista
    onSuccess: (_, inviteId) =>
      Promise.all([
        removeInvite(inviteId),
        queryClient.invalidateQueries({ queryKey: roomsQueryKey }),
      ]),
    // 404/401 = convite já respondido (outro device): atualiza a lista
    onError: () =>
      queryClient.invalidateQueries({ queryKey: roomInvitesQueryKey }),
  })
}

export function useDeclineRoomInvite() {
  const queryClient = useQueryClient()
  const removeInvite = useRemoveInvite()

  return useMutation({
    mutationFn: declineRoomInvite,
    onSuccess: (_, inviteId) => removeInvite(inviteId),
    onError: () =>
      queryClient.invalidateQueries({ queryKey: roomInvitesQueryKey }),
  })
}

export function useInviteToRoom() {
  return useMutation({ mutationFn: inviteToRoom })
}

export function useLeaveRoom() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: leaveRoom,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: roomsQueryKey }),
  })
}

// Remover/promover/rebaixar: muda a lista de membros (e o memberCount da sala)
function useMemberMutation(mutationFn: typeof removeRoomMember) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSettled: (_, __, { conversationId }) =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: membersQueryKey(conversationId),
        }),
        queryClient.invalidateQueries({ queryKey: roomsQueryKey }),
      ]),
  })
}

export function useRemoveRoomMember() {
  return useMemberMutation(removeRoomMember)
}

export function usePromoteToAdmin() {
  return useMemberMutation(promoteToAdmin)
}

export function useDemoteAdmin() {
  return useMemberMutation(demoteAdmin)
}
