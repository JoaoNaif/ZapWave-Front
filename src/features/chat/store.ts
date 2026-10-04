import { isAxiosError } from 'axios'
import type { MessageDto, ReplyToDto } from '@/types/chat'
import {
  deleteMessage,
  editMessage,
  fetchConversationHistory,
  sendMessage,
} from './api'

// Vale tentar de novo: sem resposta (rede caiu), servidor fora (5xx) ou rate
// limit (429). 4xx de regra (não é membro, texto inválido) não muda tentando
function isTemporary(error: unknown) {
  if (!isAxiosError(error) || !error.response) return true
  const { status } = error.response
  return status >= 500 || status === 429
}

// Mensagens ficam fora do React Query: chegam por 3 caminhos (histórico HTTP,
// resposta do POST e WebSocket) e precisam de merge por id. Um store simples
// com useSyncExternalStore resolve sem brigar com o cache.

// sent = está no servidor. sending/failed = otimista, id local = clientMessageId
export type MessageStatus = 'sent' | 'sending' | 'failed'

export interface ChatMessage extends MessageDto {
  status: MessageStatus
}

export interface ConversationState {
  // Mais antiga → mais nova; pendentes sempre no fim
  messages: ChatMessage[]
  history: 'idle' | 'loading' | 'loaded' | 'error'
  hasMore: boolean
  loadingOlder: boolean
  olderError: boolean
  // Mais antiga vinda do histórico: é o "before" da próxima página
  cursor: string | null
}

const EMPTY: ConversationState = {
  messages: [],
  history: 'idle',
  hasMore: false,
  loadingOlder: false,
  olderError: false,
  cursor: null,
}

function compare(a: ChatMessage, b: ChatMessage) {
  if (a.status === 'sent' && b.status === 'sent') {
    // ULID: comparar string = comparar tempo
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
  }
  if (a.status === 'sent') return -1
  if (b.status === 'sent') return 1
  return a.createdAt.localeCompare(b.createdAt)
}

// Entrega é "pelo menos uma vez": dedup por id, e a versão do servidor
// substitui a otimista que tem o mesmo clientMessageId
function merge(current: ChatMessage[], incoming: MessageDto[]) {
  const next = [...current]
  // id → posição, só das que já estão no servidor
  const sentIndex = new Map<string, number>()
  next.forEach((m, index) => {
    if (m.status === 'sent') sentIndex.set(m.id, index)
  })
  let changed = false

  for (const message of incoming) {
    const existing = sentIndex.get(message.id)
    if (existing !== undefined) {
      // Já tenho: só troca se a versão que chegou é uma edição mais nova (o
      // histórico refeito depois de reconectar pode trazer o texto editado)
      if ((message.editedAt ?? '') > (next[existing].editedAt ?? '')) {
        next[existing] = { ...message, status: 'sent' }
        changed = true
      }
      continue
    }
    changed = true

    const sent: ChatMessage = { ...message, status: 'sent' }
    const pendingIndex = message.clientMessageId
      ? next.findIndex(
          (m) =>
            m.status !== 'sent' && m.clientMessageId === message.clientMessageId
        )
      : -1

    if (pendingIndex >= 0) {
      next[pendingIndex] = sent
      sentIndex.set(message.id, pendingIndex)
    } else {
      next.push(sent)
      sentIndex.set(message.id, next.length - 1)
    }
  }

  return changed ? next.sort(compare) : current
}

export type ChatStore = ReturnType<typeof createChatStore>

// Não lidas que chegaram ao vivo, por conversa. senderId: numa DM quem manda é
// sempre o amigo, e é assim que a lista de amigos acha o contador (ela só tem
// o friendId). receivedAt: para somar só o que o back ainda não contou
export interface LiveUnread {
  senderId: string
  receivedAt: number[]
}

// A base é o unreadCount do back (/friends e /rooms). Aqui fica só o que ele
// ainda não sabe: o que chegou pelo WS depois da última busca da lista, e
// quando cada conversa foi vista (o back só zera depois do mark-conversation)
export interface UnreadState {
  live: ReadonlyMap<string, LiveUnread>
  // Última vez que a conversa foi vista na tela (Date.now())
  seenAt: ReadonlyMap<string, number>
  // Conversa aberta na tela (null = nenhuma)
  active: string | null
}

export function createChatStore(meId: string) {
  const conversations = new Map<string, ConversationState>()
  const listeners = new Set<() => void>()
  let unread: UnreadState = { live: new Map(), seenAt: new Map(), active: null }
  const active = () => unread.active

  function isBeingRead(conversationId: string) {
    return active() === conversationId && document.visibilityState === 'visible'
  }

  function notify() {
    for (const listener of listeners) listener()
  }

  function get(conversationId: string) {
    return conversations.get(conversationId) ?? EMPTY
  }

  function update(
    conversationId: string,
    change: (state: ConversationState) => Partial<ConversationState>
  ) {
    const state = get(conversationId)
    conversations.set(conversationId, { ...state, ...change(state) })
    notify()
  }

  function subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }

  function hasMessage(message: MessageDto) {
    return get(message.conversationId).messages.some(
      (m) => m.status === 'sent' && m.id === message.id
    )
  }

  // live = veio pelo WebSocket. Só o ao vivo conta como não lida (histórico e
  // resposta do POST não). Retorna as que viraram não lidas agora (para notificar)
  function receive(messages: MessageDto[], { live = false } = {}) {
    const fresh = live
      ? messages.filter(
          (message) => message.senderId !== meId && !hasMessage(message) // entrega "pelo menos uma vez": não conta 2×
        )
      : []
    const unseen = fresh.filter(
      (message) => !isBeingRead(message.conversationId)
    )
    // Chegou na conversa aberta: conta como vista agora
    const readNow = fresh.filter((message) =>
      isBeingRead(message.conversationId)
    )

    const byConversation = new Map<string, MessageDto[]>()
    for (const message of messages) {
      const group = byConversation.get(message.conversationId) ?? []
      group.push(message)
      byConversation.set(message.conversationId, group)
    }
    for (const [conversationId, incoming] of byConversation) {
      update(conversationId, (state) => ({
        messages: merge(state.messages, incoming),
      }))
    }

    if (unseen.length > 0 || readNow.length > 0) {
      const now = Date.now()
      const live = new Map(unread.live)
      for (const message of unseen) {
        const entry = live.get(message.conversationId)
        live.set(message.conversationId, {
          senderId: message.senderId,
          receivedAt: [...(entry?.receivedAt ?? []), now],
        })
      }
      const seenAt = new Map(unread.seenAt)
      for (const message of readNow) seenAt.set(message.conversationId, now)
      unread = { ...unread, live, seenAt }
      notify()
    }

    return unseen
  }

  // Edição (minha, de outro device ou de outro membro). Só mexe no que já está
  // carregado: se a mensagem não está aqui, o histórico traz a versão nova.
  // Idempotente: o eco da minha própria edição chega depois da resposta do PATCH
  function applyEdit(message: MessageDto) {
    const known = get(message.conversationId).messages.some(
      (m) => m.status === 'sent' && m.id === message.id
    )
    if (!known) return
    update(message.conversationId, (state) => ({
      messages: state.messages.map((m) =>
        m.status === 'sent' && m.id === message.id
          ? { ...m, body: message.body, editedAt: message.editedAt }
          : m
      ),
    }))
  }

  // Remoção: some da lista, e as respostas a ela perdem a citação (o back faz
  // o mesmo no banco: replyTo vira null)
  function applyDelete(conversationId: string, messageId: string) {
    update(conversationId, (state) => ({
      messages: state.messages
        .filter((m) => !(m.status === 'sent' && m.id === messageId))
        .map((m) => (m.replyTo?.id === messageId ? { ...m, replyTo: null } : m)),
    }))
  }

  // Erro (403/404/rede) sobe para a tela mostrar; o estado só muda no sucesso
  async function edit(messageId: string, body: string) {
    applyEdit(await editMessage(messageId, body))
  }

  async function remove(conversationId: string, messageId: string) {
    await deleteMessage(messageId)
    applyDelete(conversationId, messageId)
  }

  function getUnread() {
    return unread
  }

  // Abriu a conversa (ou voltou para a aba com ela aberta): zera o que chegou
  // ao vivo e guarda o momento, para ignorar o unreadCount antigo do back até
  // a lista ser buscada de novo (depois do mark-conversation)
  function markSeen(conversationId: string) {
    const live = new Map(unread.live)
    live.delete(conversationId)
    const seenAt = new Map(unread.seenAt)
    seenAt.set(conversationId, Date.now())
    unread = { ...unread, live, seenAt }
    notify()
  }

  function setActive(conversationId: string | null) {
    unread = { ...unread, active: conversationId }
    notify()
  }

  // Primeira página (a mais recente). refresh = depois de reconectar: faz merge
  // sem mostrar "carregando" e sem mexer na paginação
  async function loadLatest(conversationId: string, refresh = false) {
    const state = get(conversationId)
    if (state.history === 'loading') return
    if (!refresh) update(conversationId, () => ({ history: 'loading' }))

    try {
      const page = await fetchConversationHistory(conversationId)
      update(conversationId, (current) => ({
        messages: merge(current.messages, page.messages),
        history: 'loaded',
        ...(refresh && current.history === 'loaded'
          ? {}
          : {
              hasMore: page.hasMore,
              cursor: page.messages.at(-1)?.id ?? null,
            }),
      }))
    } catch {
      if (!refresh) update(conversationId, () => ({ history: 'error' }))
    }
  }

  async function loadOlder(conversationId: string) {
    const state = get(conversationId)
    if (!state.hasMore || state.loadingOlder || !state.cursor) return
    update(conversationId, () => ({ loadingOlder: true, olderError: false }))

    try {
      const page = await fetchConversationHistory(conversationId, state.cursor)
      update(conversationId, (current) => ({
        messages: merge(current.messages, page.messages),
        hasMore: page.hasMore,
        cursor: page.messages.at(-1)?.id ?? current.cursor,
        loadingOlder: false,
      }))
    } catch {
      update(conversationId, () => ({ loadingOlder: false, olderError: true }))
    }
  }

  // Depois de reconectar, o histórico cobre o que o inbox do Redis pode ter perdido
  function refreshLoaded() {
    for (const [conversationId, state] of conversations) {
      if (state.history === 'loaded') void loadLatest(conversationId, true)
    }
  }

  // Fila de saída: envia em ordem e, se a rede falhar, tenta de novo sozinha.
  // Reenviar é seguro: o POST /message é idempotente por clientMessageId
  const outbox: ChatMessage[] = []
  let sending = false
  let retryTimer: ReturnType<typeof setTimeout> | undefined
  let retryAttempt = 0

  function markFailed(message: ChatMessage) {
    // Se o eco do WS já chegou, a otimista virou "sent" e isto não muda nada
    update(message.conversationId, (state) => ({
      messages: state.messages.map((m) =>
        m.status === 'sending' && m.id === message.id
          ? { ...m, status: 'failed' }
          : m
      ),
    }))
  }

  async function processOutbox() {
    if (sending) return
    sending = true
    clearTimeout(retryTimer)

    try {
      while (outbox.length > 0) {
        // Sem internet: nem tenta. O evento "online" chama flushOutbox
        if (!navigator.onLine) return

        const message = outbox[0]
        try {
          const sent = await sendMessage({
            conversationId: message.conversationId,
            body: message.body,
            clientMessageId: message.id,
            replyToId: message.replyTo?.id,
          })
          outbox.shift()
          retryAttempt = 0
          receive([sent])
        } catch (error) {
          if (isTemporary(error)) {
            // Rede/servidor fora: para a fila (mantém a ordem) e tenta depois.
            // 1s, 2s, 4s… até 30s
            const delay = Math.min(30_000, 1000 * 2 ** retryAttempt)
            retryAttempt++
            retryTimer = setTimeout(() => void processOutbox(), delay)
            return
          }
          // 4xx (ex.: não é mais membro): tentar de novo não resolve
          outbox.shift()
          markFailed(message)
        }
      }
    } finally {
      sending = false
    }
  }

  // Conexão voltou (evento "online" ou WS reconectou): tenta agora, sem esperar
  function flushOutbox() {
    retryAttempt = 0
    void processOutbox()
  }

  // Sessão acabou (desmontou): para de tentar
  function dispose() {
    clearTimeout(retryTimer)
  }

  // Otimista: aparece na hora como "sending"; a resposta (ou o eco) troca pela real
  function send(
    conversationId: string,
    senderId: string,
    body: string,
    replyTo: ReplyToDto | null = null
  ) {
    const clientMessageId = crypto.randomUUID()
    const message: ChatMessage = {
      id: clientMessageId,
      clientMessageId,
      conversationId,
      senderId,
      body,
      replyTo,
      editedAt: null,
      createdAt: new Date().toISOString(),
      status: 'sending',
    }
    update(conversationId, (state) => ({
      messages: [...state.messages, message],
    }))
    outbox.push(message)
    void processOutbox()
  }

  // Reenvia com o MESMO clientMessageId: se a primeira chegou, o back não duplica
  function retry(conversationId: string, clientMessageId: string) {
    const failed = get(conversationId).messages.find(
      (m) => m.status === 'failed' && m.id === clientMessageId
    )
    if (!failed) return

    const message: ChatMessage = { ...failed, status: 'sending' }
    update(conversationId, (state) => ({
      messages: state.messages.map((m) => (m.id === message.id ? message : m)),
    }))
    outbox.push(message)
    flushOutbox()
  }

  return {
    flushOutbox,
    dispose,
    get,
    subscribe,
    receive,
    applyEdit,
    applyDelete,
    edit,
    remove,
    getUnread,
    markSeen,
    setActive,
    loadLatest,
    loadOlder,
    refreshLoaded,
    send,
    retry,
  }
}
