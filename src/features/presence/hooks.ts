import { useQuery } from '@tanstack/react-query'
import { fetchPresence } from './api'

// Só para o cabeçalho da conversa aberta (uma pessoa): a lista de amigos já
// traz o online de todos no /friends
export function usePresence(userId: string) {
  return useQuery({
    queryKey: ['presence', userId],
    queryFn: () => fetchPresence(userId),
    refetchInterval: 30_000,
  })
}
