import { useSyncExternalStore } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useFriends } from '@/features/friendship/hooks'
import { useRooms } from '@/features/rooms/hooks'
import type { ConversationDto } from '@/types/chat'
import { useChat } from './context'
import type { UnreadState } from './store'

// Contador de uma conversa = unreadCount do back + o que chegou pelo WS depois
// da última busca da lista. Cada mensagem ao vivo já dispara uma nova busca
// (ChatProvider), então a parte "ao vivo" some sozinha quando o back alcança.
function countFor(
  state: UnreadState,
  conversationId: string | undefined,
  serverCount: number,
  // Quando a lista (/friends ou /rooms) chegou do back
  fetchedAt: number,
  receivedAt: number[]
) {
  // Aberta e visível: o que chega já está sendo lido
  if (
    conversationId &&
    state.active === conversationId &&
    document.visibilityState === 'visible'
  ) {
    return 0
  }

  // Vista depois da última busca: o número do back ainda é o de antes do
  // mark-conversation, então não vale
  const seenAt = (conversationId && state.seenAt.get(conversationId)) || 0
  const base = seenAt > fetchedAt ? 0 : serverCount
  const cutoff = Math.max(fetchedAt, seenAt)

  return base + receivedAt.filter((time) => time > cutoff).length
}

export function useUnreadSummary() {
  const { store } = useChat()
  const queryClient = useQueryClient()
  const state = useSyncExternalStore(store.subscribe, store.getUnread)
  const friends = useFriends()
  const rooms = useRooms()
  const roomIds = new Set(rooms.data?.map((room) => room.id))

  const byRoom = new Map<string, number>()
  let roomsTotal = 0
  for (const room of rooms.data ?? []) {
    const count = countFor(
      state,
      room.id,
      room.unreadCount,
      rooms.dataUpdatedAt,
      state.live.get(room.id)?.receivedAt ?? []
    )
    byRoom.set(room.id, count)
    roomsTotal += count
  }

  const byFriend = new Map<string, number>()
  let friendsTotal = 0
  for (const friend of friends.data ?? []) {
    // A lista de amigos não traz o id da DM; ele só é conhecido se a DM já
    // foi aberta nesta sessão (cache do POST /direct-conversation)
    const dmId = queryClient.getQueryData<ConversationDto>([
      'direct-conversation',
      friend.id,
    ])?.id
    // Ao vivo: mensagens que não são de grupo e vieram deste amigo
    const receivedAt: number[] = []
    for (const [conversationId, entry] of state.live) {
      if (!roomIds.has(conversationId) && entry.senderId === friend.id) {
        receivedAt.push(...entry.receivedAt)
      }
    }
    const count = countFor(
      state,
      dmId,
      friend.unreadCount,
      friends.dataUpdatedAt,
      receivedAt
    )
    byFriend.set(friend.id, count)
    friendsTotal += count
  }

  return {
    byFriend,
    byRoom,
    friendsTotal,
    roomsTotal,
    total: friendsTotal + roomsTotal,
  }
}
