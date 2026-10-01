import { api } from '@/lib/api'
import type {
  ConversationDto,
  ConversationMemberDto,
  ConversationReadDto,
  MessageDto,
} from '@/types/chat'

// POST /direct-conversation → sempre 201 (acha ou cria). 406 = amizade não aceita
export async function openDirectConversation(friendId: string) {
  const response = await api.post<{
    conversation: ConversationDto
    member: ConversationMemberDto
    isNewConversation: boolean
  }>('/direct-conversation', { friendId })
  return response.data.conversation
}

// GET /conversation-history/:id → mais nova → mais antiga.
// Paginar para trás: before = id da mais antiga que já tenho
export async function fetchConversationHistory(
  conversationId: string,
  before?: string
) {
  const response = await api.get<{ messages: MessageDto[]; hasMore: boolean }>(
    `/conversation-history/${conversationId}`,
    { params: { before, limit: 50 } }
  )
  return response.data
}

// POST /message → 201 { message }. Idempotente por clientMessageId:
// reenviar com o mesmo id não duplica
export async function sendMessage(data: {
  conversationId: string
  body: string
  clientMessageId: string
}) {
  const response = await api.post<{ message: MessageDto }>('/message', data)
  return response.data.message
}

// PUT /mark-conversation → recibo de leitura (por usuário, não por device)
export async function markConversationRead(data: {
  conversationId: string
  messageId: string
}) {
  await api.put('/mark-conversation', data)
}

// GET /conversations/:id/reads → 200 { reads }: cursor de leitura dos OUTROS
// membros (para o ✓✓). 404 = não sou membro
export async function fetchConversationReads(conversationId: string) {
  const response = await api.get<{ reads: ConversationReadDto[] }>(
    `/conversations/${conversationId}/reads`
  )
  return response.data.reads
}
