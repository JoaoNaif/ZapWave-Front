import { useEffect, useRef } from 'react'
import { markConversationRead } from '../api'
import { useChat, useConversation } from '../context'
import { Composer } from './Composer'
import { MessageList } from './MessageList'

interface ConversationProps {
  conversationId: string
  meId: string
}

export function Conversation({ conversationId, meId }: ConversationProps) {
  const { store } = useChat()
  const { messages } = useConversation(conversationId)

  // Última mensagem que já está no servidor (as otimistas não têm id real)
  const lastSent = messages.findLast((message) => message.status === 'sent')
  const lastId = lastSent?.id
  const lastFromOther = lastSent !== undefined && lastSent.senderId !== meId
  useMarkAsRead(conversationId, lastFromOther ? lastId : undefined)

  return (
    <>
      <MessageList conversationId={conversationId} meId={meId} />
      <Composer
        onSend={(body) => store.send(conversationId, meId, body)}
      />
    </>
  )
}

// Recibo de leitura: conversa aberta + aba visível + mensagem nova do outro
function useMarkAsRead(conversationId: string, messageId: string | undefined) {
  const lastMarked = useRef<string | null>(null)

  useEffect(() => {
    if (!messageId) return

    function mark() {
      if (!messageId || document.visibilityState !== 'visible') return
      if (lastMarked.current && messageId <= lastMarked.current) return

      lastMarked.current = messageId
      markConversationRead({ conversationId, messageId }).catch(() => {
        // Deixa tentar de novo na próxima mensagem/volta da aba
        lastMarked.current = null
      })
    }

    mark()
    // Mensagem chegou com a aba escondida: marca quando a pessoa voltar
    document.addEventListener('visibilitychange', mark)
    return () => document.removeEventListener('visibilitychange', mark)
  }, [conversationId, messageId])
}
