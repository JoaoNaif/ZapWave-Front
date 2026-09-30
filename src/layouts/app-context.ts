import { useOutletContext } from 'react-router'
import type { Me } from '@/features/auth/api'
import { useFriendRequests } from '@/features/friendship/hooks'
import { useRoomInvites } from '@/features/rooms/hooks'

// Os modais da área logada ficam no AppLayout (um de cada); sidebar, barra de baixo
// e páginas só pedem para abrir
export type AppDialog = 'add-friend' | 'create-room' | 'requests' | 'account'

// Aba da lista: amigos (DMs) ou grupos. Compartilhada por sidebar, barra de
// baixo e Home (no mobile a lista é a própria Home)
export type ListTab = 'friends' | 'rooms'

export interface AppContext {
  me: Me
  openDialog: (dialog: AppDialog) => void
  tab: ListTab
  setTab: (tab: ListTab) => void
}

export function useAppContext() {
  return useOutletContext<AppContext>()
}

// Contador do botão "Pedidos": amizade + convites de grupo
export function usePendingRequestsCount() {
  const friendRequests = useFriendRequests()
  const roomInvites = useRoomInvites()
  return (friendRequests.data?.length ?? 0) + (roomInvites.data?.length ?? 0)
}
