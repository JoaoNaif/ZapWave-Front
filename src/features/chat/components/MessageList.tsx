import { useEffect, useLayoutEffect, useRef } from 'react'
import { AlertIcon, CheckIcon, ClockIcon } from '@/components/icons'
import { avatarColor } from '@/lib/avatar-color'
import { formatDayLabel, formatTime, isSameDay } from '@/lib/format'
import { useChat, useConversation } from '../context'
import type { ChatMessage } from '../store'

// Perto do fundo = segue as mensagens novas; lendo o passado = não puxa a tela
const STICK_THRESHOLD_PX = 80
// Começa a carregar a página anterior um pouco antes de chegar no topo
const LOAD_OLDER_THRESHOLD_PX = 200
// Mesma pessoa em menos de 5 min = mesmo "bloco" (bolhas coladas)
const GROUP_WINDOW_MS = 5 * 60 * 1000

interface MessageListProps {
  conversationId: string
  meId: string
  // Só em grupo: senderId → nome, para mostrar quem falou
  senderNames?: Map<string, string>
}

export function MessageList({
  conversationId,
  meId,
  senderNames,
}: MessageListProps) {
  const { store } = useChat()
  const state = useConversation(conversationId)
  const scrollRef = useRef<HTMLDivElement>(null)
  const stickToBottom = useRef(true)
  // Altura antes de carregar a página anterior: para a tela não "pular"
  const heightBeforeOlder = useRef<number | null>(null)

  useEffect(() => {
    if (state.history === 'idle') void store.loadLatest(conversationId)
  }, [store, conversationId, state.history])

  useLayoutEffect(() => {
    const element = scrollRef.current
    if (!element) return

    // Página antiga entrou em cima: compensa a altura nova para ficar no lugar
    if (heightBeforeOlder.current !== null && !state.loadingOlder) {
      element.scrollTop += element.scrollHeight - heightBeforeOlder.current
      heightBeforeOlder.current = null
      return
    }

    const last = state.messages.at(-1)
    const sentByMe = last?.senderId === meId && last.status === 'sending'
    if (stickToBottom.current || sentByMe) {
      element.scrollTop = element.scrollHeight
    }
    // history: a lista só monta quando carrega, e aí precisa descer até o fim
  }, [state.messages, state.loadingOlder, state.history, meId])

  function handleScroll() {
    const element = scrollRef.current
    if (!element) return

    stickToBottom.current =
      element.scrollHeight - element.scrollTop - element.clientHeight <
      STICK_THRESHOLD_PX

    if (
      element.scrollTop < LOAD_OLDER_THRESHOLD_PX &&
      state.hasMore &&
      !state.loadingOlder &&
      !state.olderError
    ) {
      heightBeforeOlder.current = element.scrollHeight
      void store.loadOlder(conversationId)
    }
  }

  if (state.history === 'idle' || state.history === 'loading') {
    return (
      <div className="flex flex-1 flex-col justify-end gap-3 p-4">
        {[48, 64, 40, 56].map((width, index) => (
          <span
            key={index}
            style={{ width: `${width}%` }}
            className={`h-9 animate-pulse rounded-2xl bg-elevated ${
              index % 2 ? 'self-end' : ''
            }`}
          />
        ))}
      </div>
    )
  }

  if (state.history === 'error') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-sm">
        <p className="text-danger">Não foi possível carregar as mensagens.</p>
        <button
          type="button"
          onClick={() => void store.loadLatest(conversationId)}
          className="cursor-pointer font-medium text-primary hover:text-primary-hover"
        >
          Tentar de novo
        </button>
      </div>
    )
  }

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-4 md:px-6"
    >
      {/* mt-auto: poucas mensagens ficam embaixo, perto do campo de texto */}
      <div className="mt-auto flex flex-col">
        {state.loadingOlder && (
          <p className="py-2 text-center text-xs text-fg-subtle">
            Carregando mensagens antigas…
          </p>
        )}
        {state.olderError && (
          <button
            type="button"
            onClick={() => void store.loadOlder(conversationId)}
            className="cursor-pointer py-2 text-center text-xs text-danger"
          >
            Falhou ao carregar as antigas. Tentar de novo
          </button>
        )}
        {!state.hasMore && state.messages.length > 0 && (
          <p className="py-2 text-center text-xs text-fg-subtle">
            Início da conversa
          </p>
        )}

        {state.messages.length === 0 && (
          <p className="py-10 text-center text-sm text-fg-subtle">
            Nenhuma mensagem ainda. Diga oi!
          </p>
        )}

        {state.messages.map((message, index) => {
          const previous = state.messages[index - 1]
          const newDay =
            !previous || !isSameDay(previous.createdAt, message.createdAt)
          const grouped =
            !newDay &&
            previous.senderId === message.senderId &&
            new Date(message.createdAt).getTime() -
              new Date(previous.createdAt).getTime() <
              GROUP_WINDOW_MS

          return (
            <div key={message.clientMessageId ?? message.id}>
              {newDay && (
                <div className="my-3 flex justify-center">
                  <span className="rounded-full bg-elevated px-3 py-1 text-xs text-fg-muted first-letter:uppercase">
                    {formatDayLabel(message.createdAt)}
                  </span>
                </div>
              )}
              <MessageBubble
                message={message}
                mine={message.senderId === meId}
                grouped={grouped}
                // Nome só na primeira bolha do bloco, e nunca nas minhas
                senderName={
                  senderNames && !grouped && message.senderId !== meId
                    ? (senderNames.get(message.senderId) ?? 'Ex-membro')
                    : undefined
                }
                onRetry={() => store.retry(conversationId, message.id)}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface MessageBubbleProps {
  message: ChatMessage
  mine: boolean
  grouped: boolean
  onRetry: () => void
  senderName?: string
}

function MessageBubble({
  message,
  mine,
  grouped,
  onRetry,
  senderName,
}: MessageBubbleProps) {
  return (
    <div
      className={`flex flex-col ${mine ? 'items-end' : 'items-start'} ${
        grouped ? 'mt-0.5' : 'mt-2'
      }`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-3 py-1.5 text-sm md:max-w-[65%] ${
          mine
            ? `bg-bubble-mine ${grouped ? '' : 'rounded-tr-md'}`
            : `bg-bubble-other ${grouped ? '' : 'rounded-tl-md'}`
        } ${message.status === 'failed' ? 'opacity-60' : ''}`}
      >
        {senderName && (
          // Mesma cor do avatar da pessoa
          <p
            className={`mb-0.5 truncate text-xs font-semibold ${avatarColor(message.senderId).text}`}
          >
            {senderName}
          </p>
        )}
        <p className="whitespace-pre-wrap wrap-break-word">
          {message.body}
          {/* Horário "flutuando" no fim da última linha, estilo WhatsApp */}
          <span className="float-right mt-1.5 ml-3 flex items-center gap-1 text-[11px] leading-none text-fg-muted">
            {formatTime(message.createdAt)}
            {mine && message.status === 'sending' && (
              <ClockIcon className="size-3" />
            )}
            {/* ✓ = chegou no servidor. ✓✓ (lida) depende de rota nova no back */}
            {mine && message.status === 'sent' && (
              <CheckIcon className="size-3.5" />
            )}
          </span>
        </p>
      </div>

      {message.status === 'failed' && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 flex cursor-pointer items-center gap-1 text-xs text-danger hover:underline"
        >
          <AlertIcon className="size-3.5" />
          Não enviada. Tentar de novo
        </button>
      )}
    </div>
  )
}
