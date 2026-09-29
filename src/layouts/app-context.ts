import { useOutletContext } from 'react-router'
import type { Me } from '@/features/auth/api'

// Os modais da área logada ficam no AppLayout (um de cada); sidebar, barra de baixo
// e páginas só pedem para abrir
export type AppDialog = 'add-friend' | 'friend-requests' | 'account'

export interface AppContext {
  me: Me
  openDialog: (dialog: AppDialog) => void
}

export function useAppContext() {
  return useOutletContext<AppContext>()
}
