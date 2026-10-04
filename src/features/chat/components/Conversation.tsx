import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { friendsQueryKey } from '@/features/friendship/hooks'
import { roomsQueryKey } from '@/features/rooms/hooks'
import type { ReplyToDto } from '@/types/chat'
import { markConversationRead } from '../api'
import {
  readsQueryKey,
  useChat,
  useConversation,
  useConversationReads,
} from '../context'
import type { ChatMessage } from '../store'
import { Composer } from './Composer'
import { MessageList } from './MessageList'

interface ConversationProps {
  conversationId: string
  meId: string
  // Grupo: senderId → nome (quem falou aparece em cima da bolha)
  senderNames?: Map<string, string>
  // DM: o outro lado (só para dar nome à citação; em grupo vale senderNames)
  peer?: { id: string; name: string }
}

// Mesmo corte que o back usa no preview da resposta
const REPLY_PREVIEW_MAX = 100

function toReplyPreview(message: ChatMessage): ReplyToDto {
  return {
    id: message.id,
    senderId: message.senderId,
    body:
      message.body.length > REPLY_PREVIEW_MAX
        ? message.body.slice(0, REPLY_PREVIEW_MAX) + '…'
        : message.body,
  }
}

export function Conversation({
  conversationId,
  meId,
  senderNames,
  peer,
}: ConversationProps) {
  const { store } = useChat()
  const { messages } = useConversation(conversationId)
  const [replyingTo, setReplyingTo] = useState<ReplyToDto | null>(null)

  function nameOf(senderId: string) {
    if (senderId === meId) return 'Você'
    if (peer?.id === senderId) return peer.name
    return senderNames?.get(senderId) ?? 'Ex-membro'
  }

  // Última mensagem que já está no servidor (as otimistas não têm id real).
  // Marca mesmo se for minha: o unreadCount do back conta tudo que é dos
  // outros antes do cursor, inclusive o que veio antes da minha resposta
  const lastId = messages.findLast((message) => message.status === 'sent')?.id
  useMarkAsRead(conversationId, lastId)

  // ✓✓: minha mensagem conta como lida quando TODOS os outros leram até ela,
  // ou seja, o menor cursor entre eles. ULID: comparar string = comparar tempo.
  // '' = alguém nunca leu (nenhum id é <= ''). Sozinho no grupo: sem ✓✓
  const reads = useConversationReads(conversationId)
  const othersReadUpTo =
    reads.data && reads.data.length > 0
      ? reads.data
          .map((read) => read.lastReadMessageId ?? '')
          .reduce((min, id) => (id < min ? id : min))
      : undefined

  // O outro respondeu = abriu a conversa e marcou como lida: busca o ✓✓ logo,
  // sem esperar o polling (o mark-conversation dele sai logo depois do envio)
  const lastFromOthers = messages.findLast(
    (message) => message.status === 'sent' && message.senderId !== meId
  )?.id
  const queryClient = useQueryClient()
  useEffect(() => {
    if (!lastFromOthers) return
    const timer = setTimeout(
      () =>
        queryClient.invalidateQueries({
          queryKey: readsQueryKey(conversationId),
        }),
      1500
    )
    return () => clearTimeout(timer)
  }, [lastFromOthers, conversationId, queryClient])

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
        othersReadUpTo={othersReadUpTo}
        nameOf={nameOf}
        onReply={(message) => setReplyingTo(toReplyPreview(message))}
      />
      <Composer
        onSend={(body) => {
          store.send(conversationId, meId, body, replyingTo)
          setReplyingTo(null)
        }}
        replyingTo={replyingTo}
        replyAuthor={replyingTo ? nameOf(replyingTo.senderId) : ''}
        onCancelReply={() => setReplyingTo(null)}
      />
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
