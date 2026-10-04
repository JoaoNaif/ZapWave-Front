import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  AlertIcon,
  CheckCheckIcon,
  CheckIcon,
  ChevronDownIcon,
  ClockIcon,
  PencilIcon,
  ReplyIcon,
  TrashIcon,
} from '@/components/icons'
import { Linkify } from '@/components/Linkify'
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
  // Até onde os outros leram (menor cursor). undefined = sem ✓✓ (ninguém
  // mais na conversa, ou ainda carregando)
  othersReadUpTo?: string
  // Nome de quem escreveu a mensagem citada ("Você" para mim)
  nameOf: (senderId: string) => string
  onReply: (message: ChatMessage) => void
  // Só chamados em mensagem minha já no servidor
  onEdit: (message: ChatMessage) => void
  onDelete: (message: ChatMessage) => void
}

export function MessageList({
  conversationId,
  meId,
  senderNames,
  othersReadUpTo,
  nameOf,
  onReply,
  onEdit,
  onDelete,
}: MessageListProps) {
  const { store } = useChat()
  const state = useConversation(conversationId)
  const scrollRef = useRef<HTMLDivElement>(null)
  const stickToBottom = useRef(true)
  // Altura antes de carregar a página anterior: para a tela não "pular"
  const heightBeforeOlder = useRef<number | null>(null)
  // Mesma informação do stickToBottom, mas em estado: mostra/esconde o botão ↓
  const [atBottom, setAtBottom] = useState(true)
  // Última mensagem que estava na tela quando a pessoa saiu do fim
  const [readUpTo, setReadUpTo] = useState('')
  // Mensagem destacada depois de clicar na citação de uma resposta
  const [highlightedId, setHighlightedId] = useState('')
  const highlightTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(highlightTimer.current), [])

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

  // Última mensagem enviada (já no servidor) da lista
  const lastSentId =
    state.messages.findLast((message) => message.status === 'sent')?.id ?? ''

  // Mensagens dos outros que chegaram depois que a pessoa saiu do fim.
  // ULID: comparar string = comparar tempo
  const newCount = atBottom
    ? 0
    : state.messages.filter(
        (message) =>
          message.status === 'sent' &&
          message.senderId !== meId &&
          message.id > readUpTo
      ).length

  // Clicou na citação: rola até a original (se ela já está carregada) e a
  // destaca por um instante
  function jumpToMessage(messageId: string) {
    const target = scrollRef.current?.querySelector<HTMLElement>(
      `[data-message-id="${messageId}"]`
    )
    if (!target) return
    target.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setHighlightedId(messageId)
    clearTimeout(highlightTimer.current)
    highlightTimer.current = setTimeout(() => setHighlightedId(''), 1500)
  }

  function scrollToBottom() {
    const element = scrollRef.current
    element?.scrollTo({ top: element.scrollHeight, behavior: 'smooth' })
  }

  function handleScroll() {
    const element = scrollRef.current
    if (!element) return

    const nearBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight <
      STICK_THRESHOLD_PX
    stickToBottom.current = nearBottom
    if (nearBottom !== atBottom) {
      setAtBottom(nearBottom)
      // Saiu do fim: o que chegar depois daqui conta como "nova"
      if (!nearBottom) setReadUpTo(lastSentId)
    }

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
    // relative: o botão "↓ novas mensagens" flutua sobre a lista
    <div className="relative flex min-h-0 flex-1 flex-col">
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
                  onReply={() => onReply(message)}
                  onEdit={() => onEdit(message)}
                  onDelete={() => onDelete(message)}
                  replyAuthor={
                    message.replyTo ? nameOf(message.replyTo.senderId) : ''
                  }
                  onJumpToReply={jumpToMessage}
                  highlighted={highlightedId === message.id}
                  read={
                    othersReadUpTo !== undefined &&
                    message.status === 'sent' &&
                    message.id <= othersReadUpTo
                  }
                />
              </div>
            )
          })}
        </div>
      </div>

      {!atBottom && <JumpToBottom count={newCount} onClick={scrollToBottom} />}
    </div>
  )
}

// Aparece quando a pessoa rola para cima. Com mensagem nova: pílula em lima
// com a quantidade; sem: só a setinha para voltar ao fim
function JumpToBottom({
  count,
  onClick,
}: {
  count: number
  onClick: () => void
}) {
  if (count > 0) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="absolute bottom-4 left-1/2 flex -translate-x-1/2 cursor-pointer items-center gap-1.5 rounded-full bg-primary py-1.5 pr-4 pl-3 text-xs font-semibold text-on-primary shadow-lg shadow-black/30 transition hover:bg-primary-hover"
      >
        <ChevronDownIcon className="size-4" />
        {count === 1 ? '1 nova mensagem' : `${count} novas mensagens`}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Ir para a última mensagem"
      className="absolute right-4 bottom-4 flex size-10 cursor-pointer items-center justify-center rounded-full border border-line bg-elevated text-fg-muted shadow-lg shadow-black/30 transition hover:text-fg"
    >
      <ChevronDownIcon />
    </button>
  )
}

interface MessageBubbleProps {
  message: ChatMessage
  mine: boolean
  grouped: boolean
  onRetry: () => void
  onReply: () => void
  onEdit: () => void
  onDelete: () => void
  // Nome do autor da mensagem citada
  replyAuthor: string
  onJumpToReply: (messageId: string) => void
  // Piscando depois de alguém clicar na citação que aponta para ela
  highlighted: boolean
  senderName?: string
  // Minha mensagem já lida pelo(s) outro(s)
  read: boolean
}

function MessageBubble({
  message,
  mine,
  grouped,
  onRetry,
  onReply,
  onEdit,
  onDelete,
  replyAuthor,
  onJumpToReply,
  highlighted,
  senderName,
  read,
}: MessageBubbleProps) {
  const { replyTo } = message

  return (
    <div
      data-message-id={message.id}
      className={`flex flex-col ${mine ? 'items-end' : 'items-start'} ${
        grouped ? 'mt-0.5' : 'mt-2'
      }`}
    >
      {/* Ações ao lado da bolha (responder; e, nas minhas, editar e apagar):
          aparecem no hover/foco (no toque, ficam sempre visíveis). Só em
          mensagem já no servidor: a otimista ainda não tem id real */}
      <div
        className={`group flex max-w-[85%] items-center gap-1 md:max-w-[70%] ${
          mine ? 'flex-row-reverse' : ''
        }`}
      >
        <div
          className={`min-w-0 rounded-2xl px-3 py-1.5 text-sm transition-shadow duration-300 ${
            mine
              ? `bg-bubble-mine ${grouped ? '' : 'rounded-tr-md'}`
              : `bg-bubble-other ${grouped ? '' : 'rounded-tl-md'}`
          } ${message.status === 'failed' ? 'opacity-60' : ''} ${
            highlighted ? 'ring-2 ring-primary' : ''
          }`}
        >
          {senderName && (
            // Mesma cor do avatar da pessoa
            <p
              className={`mb-0.5 truncate text-xs font-semibold ${avatarColor(message.senderId).text}`}
            >
              {senderName}
            </p>
          )}
          {replyTo && (
            <button
              type="button"
              onClick={() => onJumpToReply(replyTo.id)}
              className="mb-1 block w-full cursor-pointer rounded-lg border-l-4 border-primary bg-black/20 px-2 py-1 text-left text-xs"
            >
              <span
                className={`block truncate font-semibold ${avatarColor(replyTo.senderId).text}`}
              >
                {replyAuthor}
              </span>
              <span className="line-clamp-2 wrap-break-word text-fg-muted">
                {replyTo.body}
              </span>
            </button>
          )}
          <p className="wrap-break-word whitespace-pre-wrap">
            <Linkify text={message.body} />
            {/* Horário "flutuando" no fim da última linha, estilo WhatsApp */}
            <span className="float-right mt-1.5 ml-3 flex items-center gap-1 text-[11px] leading-none text-fg-muted">
              {message.editedAt && <span>editada</span>}
              {formatTime(message.createdAt)}
              {mine && message.status === 'sending' && (
                <ClockIcon className="size-3" label="Enviando" />
              )}
              {/* ✓ = chegou no servidor; ✓✓ em aqua = lida (por todos, em grupo) */}
              {mine &&
                message.status === 'sent' &&
                (read ? (
                  <CheckCheckIcon
                    className="size-3.5 text-online"
                    label="Lida"
                  />
                ) : (
                  <CheckIcon className="size-3.5" label="Enviada" />
                ))}
            </span>
          </p>
        </div>

        {message.status === 'sent' && (
          <div className="flex shrink-0 items-center opacity-0 transition group-hover:opacity-100 focus-within:opacity-100 pointer-coarse:opacity-100">
            <BubbleAction label="Responder" onClick={onReply}>
              <ReplyIcon className="size-4" />
            </BubbleAction>
            {mine && (
              <>
                <BubbleAction label="Editar" onClick={onEdit}>
                  <PencilIcon className="size-4" />
                </BubbleAction>
                <BubbleAction label="Apagar" onClick={onDelete}>
                  <TrashIcon className="size-4" />
                </BubbleAction>
              </>
            )}
          </div>
        )}
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

function BubbleAction({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex size-7 cursor-pointer items-center justify-center rounded-full text-fg-subtle transition hover:bg-elevated hover:text-fg"
    >
      {children}
    </button>
  )
}
