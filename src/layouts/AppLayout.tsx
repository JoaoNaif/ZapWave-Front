import { useState } from 'react'
import { Navigate, Outlet, useLocation, useMatch } from 'react-router'
import { useMe } from '@/features/auth/hooks'
import { AccountDialog } from '@/features/auth/components/AccountDialog'
import { AddFriendDialog } from '@/features/friendship/components/AddFriendDialog'
import { CreateRoomDialog } from '@/features/rooms/components/CreateRoomDialog'
import { ChatProvider } from '@/features/chat/ChatProvider'
import { ConnectionBanner } from '@/features/chat/components/ConnectionBanner'
import type { AppContext, AppDialog, ListTab } from './app-context'
import { Sidebar } from './components/Sidebar'
import { MobileNav } from './components/MobileNav'
import { RequestsDialog } from './components/RequestsDialog'

const TAB_KEY = 'zapwave:list-tab'

// localStorage pode falhar (aba anônima, bloqueado): aí só não lembra
function readTab(): ListTab {
  try {
    return localStorage.getItem(TAB_KEY) === 'rooms' ? 'rooms' : 'friends'
  } catch {
    return 'friends'
  }
}

function saveTab(tab: ListTab) {
  try {
    localStorage.setItem(TAB_KEY, tab)
  } catch {
    // ignora
  }
}

// Telas logadas: checa a sessão (GET /me) e abre o WebSocket (ChatProvider)
export function AppLayout() {
  const me = useMe()
  const location = useLocation()
  const [dialog, setDialog] = useState<AppDialog | null>(null)
  // Abriu direto num link de grupo/DM: começa na aba certa
  const [tab, setTabState] = useState<ListTab>(() =>
    location.pathname.startsWith('/room/')
      ? 'rooms'
      : location.pathname.startsWith('/dm/')
        ? 'friends'
        : readTab()
  )
  // Dentro da conversa o mobile usa a tela toda: sem barra de baixo
  const inDm = useMatch('/dm/:friendId')
  const inRoom = useMatch('/room/:roomId')

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

  function setTab(next: ListTab) {
    setTabState(next)
    saveTab(next)
  }

  const context: AppContext = {
    me: me.data,
    openDialog: setDialog,
    tab,
    setTab,
  }
  const closeDialog = () => setDialog(null)

  return (
    <ChatProvider deviceId={me.data.deviceId} meId={me.data.user.id}>
      <div className="flex h-dvh flex-col md:flex-row">
        <Sidebar {...context} />

        <main className="flex min-h-0 min-w-0 flex-1 flex-col">
          <ConnectionBanner />
          <Outlet context={context} />
        </main>

        {!inDm && !inRoom && <MobileNav {...context} />}
      </div>

      <AddFriendDialog open={dialog === 'add-friend'} onClose={closeDialog} />
      <CreateRoomDialog open={dialog === 'create-room'} onClose={closeDialog} />
      <RequestsDialog open={dialog === 'requests'} onClose={closeDialog} />
      <AccountDialog
        me={me.data}
        open={dialog === 'account'}
        onClose={closeDialog}
      />
    </ChatProvider>
  )
}
