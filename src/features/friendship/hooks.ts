import { useMutation, useQuery } from '@tanstack/react-query'
import { fetchFriends, fetchUserByUsername, inviteFriendship } from './api'

// Presença não tem push: o polling mantém a bolinha de online atualizada
export function useFriends() {
  return useQuery({
    queryKey: ['friends'],
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
