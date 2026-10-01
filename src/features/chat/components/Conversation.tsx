import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { friendsQueryKey } from '@/features/friendship/hooks'
import { roomsQueryKey } from '@/features/rooms/hooks'
import { markConversationRead } from '../api'
import { useChat, useConversation } from '../context'
import { Composer } from './Composer'
import { MessageList } from './MessageList'

interface ConversationProps {
  conversationId: string
  meId: string
  // Grupo: senderId → nome (quem falou aparece em cima da bolha)
  senderNames?: Map<string, string>
}

export function Conversation({
  conversationId,
  meId,
  senderNames,
}: ConversationProps) {
  const { store } = useChat()
  const { messages } = useConversation(conversationId)

  // Última mensagem que já está no servidor (as otimistas não têm id real).
  // Marca mesmo se for minha: o unreadCount do back conta tudo que é dos
  // outros antes do cursor, inclusive o que veio antes da minha resposta
  const lastId = messages.findLast((message) => message.status === 'sent')?.id
  useMarkAsRead(conversationId, lastId)

  // Conversa aberta = o que chega nela não vira "não lida" (com a aba visível)
  useEffect(() => {
    store.setActive(conversationId)

    function seen() {
      if (document.visibilityState === 'visible') store.markSeen(conversationId)
    }

    seen()
    // Chegou mensagem com a aba escondida: zera quando a pessoa voltar
    document.addEventListener('visibilitychange', seen)
    return () => {
      document.removeEventListener('visibilitychange', seen)
      store.setActive(null)
    }
  }, [store, conversationId])

  return (
    <>
      <MessageList
        conversationId={conversationId}
        meId={meId}
        senderNames={senderNames}
      />
      <Composer onSend={(body) => store.send(conversationId, meId, body)} />
    </>
  )
}

// Recibo de leitura: conversa aberta + aba visível + mensagem nova. O cursor
// no back só anda para frente, então marcar de novo nunca "desmarca"
function useMarkAsRead(conversationId: string, messageId: string | undefined) {
  const queryClient = useQueryClient()
  const lastMarked = useRef<string | null>(null)

  useEffect(() => {
    if (!messageId) return

    function mark() {
      if (!messageId || document.visibilityState !== 'visible') return
      if (lastMarked.current && messageId <= lastMarked.current) return

      lastMarked.current = messageId
      markConversationRead({ conversationId, messageId })
        // Busca as listas de novo: o unreadCount do back já vem zerado
        .then(() =>
          Promise.all([
            queryClient.invalidateQueries({ queryKey: friendsQueryKey }),
            queryClient.invalidateQueries({ queryKey: roomsQueryKey }),
          ])
        )
        .catch(() => {
          // Deixa tentar de novo na próxima mensagem/volta da aba
          lastMarked.current = null
        })
    }

    mark()
    // Mensagem chegou com a aba escondida: marca quando a pessoa voltar
    document.addEventListener('visibilitychange', mark)
    return () => document.removeEventListener('visibilitychange', mark)
  }, [conversationId, messageId, queryClient])
}
