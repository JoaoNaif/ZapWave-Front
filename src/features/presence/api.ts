import { api } from '@/lib/api'
import type { PresenceDto } from '@/types/chat'

// GET /presence/:userId → 200 { presence }. Presença não tem push: polling
export async function fetchPresence(userId: string) {
  const response = await api.get<{ presence: PresenceDto }>(
    `/presence/${userId}`
  )
  return response.data.presence
}
