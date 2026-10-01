import { createContext, useContext, useSyncExternalStore } from 'react'
import { useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { fetchConversationReads, openDirectConversation } from './api'
import type { SocketStatus } from './socket'
import type { ChatStore } from './store'

export interface ChatContextValue {
  store: ChatStore
  status: SocketStatus
}

export const ChatContext = createContext<ChatContextValue | null>(null)

export function useChat() {
  const value = useContext(ChatContext)
  if (!value) throw new Error('useChat precisa estar dentro do ChatProvider')
  return value
}

// Re-renderiza só quando a conversa pedida muda
export function useConversation(conversationId: string) {
  const { store } = useChat()
  return useSyncExternalStore(store.subscribe, () => store.get(conversationId))
}

// POST numa query: é "acha ou cria", então repetir não faz mal. Cache infinito:
// a DM de um amigo não muda de id
export function useDirectConversation(friendId: string) {
  return useQuery({
    queryKey: ['direct-conversation', friendId],
    queryFn: () => openDirectConversation(friendId),
    staleTime: Infinity,
    // 4xx (ex.: 406 amizade não aceita) não melhora tentando de novo
    retry: (count, error) =>
      !(isAxiosError(error) && error.response && error.response.status < 500) &&
      count < 2,
  })
}

export const readsQueryKey = (conversationId: string) => [
  'conversation-reads',
  conversationId,
]

// Até onde os OUTROS leram (para o ✓✓). Não tem push: polling enquanto a
// conversa está aberta, e de novo quando a aba volta a ficar visível
export function useConversationReads(conversationId: string) {
  return useQuery({
    queryKey: readsQueryKey(conversationId),
    queryFn: () => fetchConversationReads(conversationId),
    refetchInterval: 10_000,
  })
}
