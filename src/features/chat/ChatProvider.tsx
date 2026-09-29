import { useEffect, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ChatContext } from './context'
import { startChatSocket, type SocketStatus } from './socket'
import { createChatStore } from './store'

// Vive no AppLayout: um store e um WebSocket por sessão. Sair = desmonta = fecha
export function ChatProvider({
  deviceId,
  children,
}: {
  deviceId: string
  children: ReactNode
}) {
  const queryClient = useQueryClient()
  const [store] = useState(createChatStore)
  const [status, setStatus] = useState<SocketStatus>('connecting')

  useEffect(() => {
    let friendsTimer: ReturnType<typeof setTimeout> | undefined

    // StrictMode monta 2×: o cleanup fecha o primeiro socket, e o lock garante
    // que o segundo só abre depois
    const stop = startChatSocket({
      deviceId,
      onMessage: (message) => {
        store.receive([message])
        // Mensagem nova muda a ordem da lista de amigos (agrupa rajadas)
        clearTimeout(friendsTimer)
        friendsTimer = setTimeout(
          () => queryClient.invalidateQueries({ queryKey: ['friends'] }),
          1000,
        )
      },
      onStatus: setStatus,
      onReconnect: () => store.refreshLoaded(),
      isSessionAlive: async () => {
        await queryClient.invalidateQueries({ queryKey: ['me'] })
        return queryClient.getQueryData(['me']) != null
      },
    })

    return () => {
      clearTimeout(friendsTimer)
      stop()
    }
  }, [deviceId, queryClient, store])

  return (
    <ChatContext.Provider value={{ store, status }}>
      {children}
    </ChatContext.Provider>
  )
}
