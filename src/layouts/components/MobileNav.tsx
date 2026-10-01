import type { ReactNode } from 'react'
import { Avatar } from '@/components/Avatar'
import { CountBadge } from '@/components/CountBadge'
import {
  GroupIcon,
  InboxIcon,
  PlusIcon,
  UserPlusIcon,
  UsersIcon,
} from '@/components/icons'
import { useUnreadSummary } from '@/features/chat/unread'
import { usePendingRequestsCount, type AppContext } from '../app-context'

const itemClass =
  'flex flex-1 cursor-pointer flex-col items-center gap-1 py-2 text-[11px] font-medium transition'

// Barra de baixo no mobile (< md). Só aparece na Home (a lista); dentro da
// conversa some (quem decide é o AppLayout)
export function MobileNav({ me, openDialog, tab, setTab }: AppContext) {
  const pendingCount = usePendingRequestsCount()
  const unread = useUnreadSummary()

  return (
    <nav className="flex border-t border-line bg-sidebar pb-[env(safe-area-inset-bottom)] md:hidden">
      <NavButton
        icon={
          <WithBadge
            count={unread.friendsTotal}
            icon={<UsersIcon className="size-6" />}
          />
        }
        label="Amigos"
        active={tab === 'friends'}
        onClick={() => setTab('friends')}
      />

      <NavButton
        icon={
          <WithBadge
            count={unread.roomsTotal}
            icon={<GroupIcon className="size-6" />}
          />
        }
        label="Grupos"
        active={tab === 'rooms'}
        onClick={() => setTab('rooms')}
      />

      {/* Acompanha a aba: adicionar amigo ou criar grupo */}
      {tab === 'friends' ? (
        <NavButton
          icon={<UserPlusIcon className="size-6" />}
          label="Adicionar"
          onClick={() => openDialog('add-friend')}
        />
      ) : (
        <NavButton
          icon={<PlusIcon className="size-6" />}
          label="Novo grupo"
          onClick={() => openDialog('create-room')}
        />
      )}

      <NavButton
        icon={
          <WithBadge
            count={pendingCount}
            icon={<InboxIcon className="size-6" />}
          />
        }
        label="Pedidos"
        onClick={() => openDialog('requests')}
      />

      <NavButton
        icon={<Avatar id={me.user.id} name={me.user.displayName} size="xs" />}
        label="Conta"
        onClick={() => openDialog('account')}
      />
    </nav>
  )
}

// Ícone com contador no canto (não lidas, pedidos)
function WithBadge({ icon, count }: { icon: ReactNode; count: number }) {
  return (
    <span className="relative">
      {icon}
      <CountBadge
        count={count}
        className="absolute -top-1.5 -right-2.5 ring-2 ring-sidebar"
      />
    </span>
  )
}

interface NavButtonProps {
  icon: ReactNode
  label: string
  onClick: () => void
  active?: boolean
}

function NavButton({ icon, label, onClick, active = false }: NavButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`${itemClass} ${active ? 'text-primary' : 'text-fg-muted hover:text-fg'}`}
    >
      {icon}
      {label}
    </button>
  )
}
