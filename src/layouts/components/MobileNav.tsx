import type { ReactNode } from 'react'
import { NavLink } from 'react-router'
import { Avatar } from '@/components/Avatar'
import { CountBadge } from '@/components/CountBadge'
import { InboxIcon, UserPlusIcon, UsersIcon } from '@/components/icons'
import { useFriendRequests } from '@/features/friendship/hooks'
import type { AppContext } from '../app-context'

const itemClass =
  'flex flex-1 cursor-pointer flex-col items-center gap-1 py-2 text-[11px] font-medium transition'

// Barra de baixo no mobile (< md). Some dentro da conversa (quem decide é o AppLayout)
export function MobileNav({ me, openDialog }: AppContext) {
  const requests = useFriendRequests()

  return (
    <nav className="flex border-t border-line bg-sidebar pb-[env(safe-area-inset-bottom)] md:hidden">
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          `${itemClass} ${isActive ? 'text-primary' : 'text-fg-muted hover:text-fg'}`
        }
      >
        <UsersIcon className="size-6" />
        Amigos
      </NavLink>

      <NavButton
        icon={<UserPlusIcon className="size-6" />}
        label="Adicionar"
        onClick={() => openDialog('add-friend')}
      />

      <NavButton
        icon={
          <span className="relative">
            <InboxIcon className="size-6" />
            <CountBadge
              count={requests.data?.length ?? 0}
              className="absolute -top-1.5 -right-2.5 ring-2 ring-sidebar"
            />
          </span>
        }
        label="Pedidos"
        onClick={() => openDialog('friend-requests')}
      />

      <NavButton
        icon={<Avatar id={me.user.id} name={me.user.displayName} size="xs" />}
        label="Conta"
        onClick={() => openDialog('account')}
      />
    </nav>
  )
}

interface NavButtonProps {
  icon: ReactNode
  label: string
  onClick: () => void
}

function NavButton({ icon, label, onClick }: NavButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${itemClass} text-fg-muted hover:text-fg`}
    >
      {icon}
      {label}
    </button>
  )
}
