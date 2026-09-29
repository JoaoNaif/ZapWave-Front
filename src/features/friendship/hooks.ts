import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { FriendRequestDto } from '@/types/friendship'
import {
  acceptFriendRequest,
  declineFriendRequest,
  fetchFriendRequests,
  fetchFriends,
  fetchUserByUsername,
  inviteFriendship,
} from './api'

const friendsQueryKey = ['friends']
const friendRequestsQueryKey = ['friend-requests']

// Presença não tem push: o polling mantém a bolinha de online atualizada
export function useFriends() {
  return useQuery({
    queryKey: friendsQueryKey,
    queryFn: fetchFriends,
    refetchInterval: 30_000,
  })
}

// Mutation porque a busca é disparada pelo usuário (botão), não pela tela
export function useFindUser() {
  return useMutation({ mutationFn: fetchUserByUsername })
}

export function useInviteFriend() {
  return useMutation({ mutationFn: inviteFriendship })
}

// Pedidos também não têm push: polling (alimenta o contador da sidebar)
export function useFriendRequests() {
  return useQuery({
    queryKey: friendRequestsQueryKey,
    queryFn: fetchFriendRequests,
    refetchInterval: 30_000,
  })
}

// Tira o pedido da lista na hora, sem esperar o refetch
function useRemoveRequest() {
  const queryClient = useQueryClient()

  return (friendshipId: string) => {
    queryClient.setQueryData<FriendRequestDto[]>(
      friendRequestsQueryKey,
      (requests) =>
        requests?.filter((request) => request.friendshipId !== friendshipId),
    )
    return queryClient.invalidateQueries({ queryKey: friendRequestsQueryKey })
  }
}

export function useAcceptFriendRequest() {
  const queryClient = useQueryClient()
  const removeRequest = useRemoveRequest()

  return useMutation({
    mutationFn: acceptFriendRequest,
    // O novo amigo já aparece na lista
    onSuccess: (_, friendshipId) =>
      Promise.all([
        removeRequest(friendshipId),
        queryClient.invalidateQueries({ queryKey: friendsQueryKey }),
      ]),
    // 404/401 = o pedido já não vale (respondido em outro device): atualiza a lista
    onError: () =>
      queryClient.invalidateQueries({ queryKey: friendRequestsQueryKey }),
  })
}

export function useDeclineFriendRequest() {
  const queryClient = useQueryClient()
  const removeRequest = useRemoveRequest()

  return useMutation({
    mutationFn: declineFriendRequest,
    onSuccess: (_, friendshipId) => removeRequest(friendshipId),
    onError: () =>
      queryClient.invalidateQueries({ queryKey: friendRequestsQueryKey }),
  })
}
