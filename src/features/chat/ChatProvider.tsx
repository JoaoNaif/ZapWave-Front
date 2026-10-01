import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { confirmSession } from '@/features/auth/session'
import { friendsQueryKey } from '@/features/friendship/hooks'
import { membersQueryKey, roomsQueryKey } from '@/features/rooms/hooks'
import type { MessageDto } from '@/types/chat'
import type { FriendDto } from '@/types/friendship'
import type { MyRoomDto, RoomMemberSummaryDto } from '@/types/room'
import { ChatContext } from './context'
import { showMessageNotification } from './notifications'
import { startChatSocket, type SocketStatus } from './socket'
import { createChatStore } from './store'
import { useUnreadSummary } from './unread'

const APP_TITLE = 'ZapWave'

// Vive no AppLayout: um store e um WebSocket por sessão. Sair = desmonta = fecha
export function ChatProvider({
  deviceId,
  meId,
  children,
}: {
  deviceId: string
  meId: string
  children: ReactNode
}) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [store] = useState(() => createChatStore(meId))
  const [status, setStatus] = useState<SocketStatus>('connecting')

  useEffect(() => {
    let listsTimer: ReturnType<typeof setTimeout> | undefined

    // StrictMode monta 2×: o cleanup fecha o primeiro socket, e o lock garante
    // que o segundo só abre depois
    const stop = startChatSocket({
      deviceId,
      onMessage: (message) => {
        const unseen = store.receive([message], { live: true })
        for (const item of unseen) {
          const { title, body, path } = describe(item, queryClient)
          showMessageNotification({
            title,
            body,
            tag: item.conversationId,
            onClick: () => navigate(path),
          })
        }

        // Mensagem nova muda a ordem das listas de amigos e de grupos
        // (agrupa rajadas numa busca só)
        clearTimeout(listsTimer)
        listsTimer = setTimeout(() => {
          void queryClient.invalidateQueries({ queryKey: friendsQueryKey })
          void queryClient.invalidateQueries({ queryKey: roomsQueryKey })
        }, 1000)
      },
      onStatus: setStatus,
      onReconnect: () => {
        store.refreshLoaded()
        // Servidor voltou: manda o que ficou na fila sem esperar o backoff
        store.flushOutbox()
      },
      isSessionAlive: () => confirmSession(queryClient),
    })

    return () => {
      clearTimeout(listsTimer)
      stop()
    }
    // navigate é estável no data router (createBrowserRouter): não reabre o socket
  }, [deviceId, queryClient, store, navigate])

  // Internet voltou: envia a fila de saída na hora
  useEffect(() => {
    const flush = () => store.flushOutbox()
    window.addEventListener('online', flush)
    flush()
    return () => {
      window.removeEventListener('online', flush)
      store.dispose()
    }
  }, [store])

  return (
    <ChatContext.Provider value={{ store, status }}>
      <UnreadTitle />
      {children}
    </ChatContext.Provider>
  )
}

// "(3) ZapWave" na aba enquanto houver não lidas (back + ao vivo)
function UnreadTitle() {
  const { total } = useUnreadSummary()

  useEffect(() => {
    document.title = total > 0 ? `(${total}) ${APP_TITLE}` : APP_TITLE
  }, [total])

  useEffect(() => {
    return () => {
      document.title = APP_TITLE
    }
  }, [])

  return null
}

// Texto da notificação a partir do que já está no cache (sem chamada nova):
// grupo = "Nome do grupo" / "Fulano: oi"; DM = "Fulano" / "oi"
function describe(message: MessageDto, queryClient: QueryClient) {
  const friends = queryClient.getQueryData<FriendDto[]>(friendsQueryKey)
  const rooms = queryClient.getQueryData<MyRoomDto[]>(roomsQueryKey)
  const room = rooms?.find((item) => item.id === message.conversationId)

  if (room) {
    const members = queryClient.getQueryData<RoomMemberSummaryDto[]>(
      membersQueryKey(room.id)
    )
    const sender =
      members?.find((member) => member.id === message.senderId)?.displayName ??
      friends?.find((friend) => friend.id === message.senderId)?.displayName ??
      'Alguém'
    return {
      title: room.name,
      body: `${sender}: ${message.body}`,
      path: `/room/${room.id}`,
    }
  }

  const friend = friends?.find((item) => item.id === message.senderId)
  return {
    title: friend?.displayName ?? 'Nova mensagem',
    body: message.body,
    path: `/dm/${message.senderId}`,
  }
}
