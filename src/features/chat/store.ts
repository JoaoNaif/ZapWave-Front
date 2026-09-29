import type { MessageDto } from '@/types/chat'
import { fetchConversationHistory, sendMessage } from './api'

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
  const sentIds = new Set(
    current.filter((m) => m.status === 'sent').map((m) => m.id),
  )
  const next = [...current]
  let changed = false

  for (const message of incoming) {
    if (sentIds.has(message.id)) continue
    sentIds.add(message.id)
    changed = true

    const sent: ChatMessage = { ...message, status: 'sent' }
    const pendingIndex = message.clientMessageId
      ? next.findIndex(
          (m) =>
            m.status !== 'sent' && m.clientMessageId === message.clientMessageId,
        )
      : -1

    if (pendingIndex >= 0) next[pendingIndex] = sent
    else next.push(sent)
  }

  return changed ? next.sort(compare) : current
}

export type ChatStore = ReturnType<typeof createChatStore>

export function createChatStore() {
  const conversations = new Map<string, ConversationState>()
  const listeners = new Set<() => void>()

  function get(conversationId: string) {
    return conversations.get(conversationId) ?? EMPTY
  }

  function update(
    conversationId: string,
    change: (state: ConversationState) => Partial<ConversationState>,
  ) {
    const state = get(conversationId)
    conversations.set(conversationId, { ...state, ...change(state) })
    for (const listener of listeners) listener()
  }

  function subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }

  function receive(messages: MessageDto[]) {
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

  async function post(message: ChatMessage) {
    try {
      const sent = await sendMessage({
        conversationId: message.conversationId,
        body: message.body,
        clientMessageId: message.id,
      })
      receive([sent])
    } catch {
      // Se o eco do WS já chegou, a otimista virou "sent" e isto não muda nada
      update(message.conversationId, (state) => ({
        messages: state.messages.map((m) =>
          m.status === 'sending' && m.id === message.id
            ? { ...m, status: 'failed' }
            : m,
        ),
      }))
    }
  }

  // Otimista: aparece na hora como "sending"; a resposta (ou o eco) troca pela real
  function send(conversationId: string, senderId: string, body: string) {
    const clientMessageId = crypto.randomUUID()
    const message: ChatMessage = {
      id: clientMessageId,
      clientMessageId,
      conversationId,
      senderId,
      body,
      createdAt: new Date().toISOString(),
      status: 'sending',
    }
    update(conversationId, (state) => ({
      messages: [...state.messages, message],
    }))
    void post(message)
  }

  // Reenvia com o MESMO clientMessageId: se a primeira chegou, o back não duplica
  function retry(conversationId: string, clientMessageId: string) {
    const failed = get(conversationId).messages.find(
      (m) => m.status === 'failed' && m.id === clientMessageId,
    )
    if (!failed) return

    const message: ChatMessage = { ...failed, status: 'sending' }
    update(conversationId, (state) => ({
      messages: state.messages.map((m) => (m.id === message.id ? message : m)),
    }))
    void post(message)
  }

  return {
    get,
    subscribe,
    receive,
    loadLatest,
    loadOlder,
    refreshLoaded,
    send,
    retry,
  }
}
