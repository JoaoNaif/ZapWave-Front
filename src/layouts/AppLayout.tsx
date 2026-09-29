import { useState } from 'react'
import { Navigate, Outlet, useMatch } from 'react-router'
import { useMe } from '@/features/auth/hooks'
import { AccountDialog } from '@/features/auth/components/AccountDialog'
import { AddFriendDialog } from '@/features/friendship/components/AddFriendDialog'
import { FriendRequestsDialog } from '@/features/friendship/components/FriendRequestsDialog'
import { ChatProvider } from '@/features/chat/ChatProvider'
import { ConnectionBanner } from '@/features/chat/components/ConnectionBanner'
import type { AppContext, AppDialog } from './app-context'
import { Sidebar } from './components/Sidebar'
import { MobileNav } from './components/MobileNav'

// Telas logadas: checa a sessão (GET /me) e abre o WebSocket (ChatProvider)
export function AppLayout() {
  const me = useMe()
  const [dialog, setDialog] = useState<AppDialog | null>(null)
  // Dentro da conversa o mobile usa a tela toda: sem barra de baixo
  const inConversation = useMatch('/dm/:friendId')

  if (me.isPending) {
    return (
      <main className="flex min-h-dvh items-center justify-center text-sm text-fg-muted">
        Carregando…
      </main>
    )
  }

  // Erro que não é 401 (back fora do ar, rede): não desloga, deixa tentar de novo
  if (me.isError) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-3 text-sm">
        <p className="text-danger">Não foi possível conectar ao servidor.</p>
        <button
          type="button"
          onClick={() => me.refetch()}
          className="cursor-pointer rounded-lg border border-line px-4 py-2 hover:bg-elevated"
        >
          Tentar de novo
        </button>
      </main>
    )
  }

  if (!me.data) return <Navigate to="/login" replace />

  const context: AppContext = { me: me.data, openDialog: setDialog }
  const closeDialog = () => setDialog(null)

  return (
    <ChatProvider deviceId={me.data.deviceId}>
      <div className="flex h-dvh flex-col md:flex-row">
        <Sidebar {...context} />

        <main className="flex min-h-0 min-w-0 flex-1 flex-col">
          <ConnectionBanner />
          <Outlet context={context} />
        </main>

        {!inConversation && <MobileNav {...context} />}
      </div>

      <AddFriendDialog open={dialog === 'add-friend'} onClose={closeDialog} />
      <FriendRequestsDialog
        open={dialog === 'friend-requests'}
        onClose={closeDialog}
      />
      <AccountDialog
        me={me.data}
        open={dialog === 'account'}
        onClose={closeDialog}
      />
    </ChatProvider>
  )
}
