import { useState, type ReactNode } from 'react'
import { Avatar } from '@/components/Avatar'
import {
  InboxIcon,
  MoreIcon,
  PanelCloseIcon,
  PanelOpenIcon,
  UserPlusIcon,
} from '@/components/icons'
import { Logo } from '@/components/Logo'
import { CountBadge } from '@/components/CountBadge'
import { FriendList } from '@/features/friendship/components/FriendList'
import { useFriendRequests } from '@/features/friendship/hooks'
import type { AppContext } from '../app-context'

const COLLAPSED_KEY = 'zapwave:sidebar-collapsed'

// localStorage pode falhar (aba anônima, bloqueado): aí só não lembra
function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === 'true'
  } catch {
    return false
  }
}

function saveCollapsed(value: boolean) {
  try {
    localStorage.setItem(COLLAPSED_KEY, String(value))
  } catch {
    // ignora
  }
}

// Só no desktop (md+). No mobile a navegação é a MobileNav, embaixo
export function Sidebar({ me, openDialog }: AppContext) {
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const requests = useFriendRequests()

  function toggle() {
    setCollapsed(!collapsed)
    saveCollapsed(!collapsed)
  }

  return (
    <aside
      className={`hidden h-full shrink-0 flex-col border-r border-line bg-sidebar transition-[width] duration-200 md:flex ${
        collapsed ? 'w-19' : 'w-72'
      }`}
    >
      <header
        className={`flex border-b border-line px-4 ${
          collapsed
            ? 'flex-col items-center gap-3 py-4'
            : 'h-16 items-center justify-between'
        }`}
      >
        <Logo compact={collapsed} />
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
          title={collapsed ? 'Expandir' : 'Recolher'}
          className="cursor-pointer rounded-lg p-2 text-fg-muted transition hover:bg-elevated hover:text-fg"
        >
          {collapsed ? <PanelOpenIcon /> : <PanelCloseIcon />}
        </button>
      </header>

      <div className="flex flex-col gap-1 p-3">
        <SidebarAction
          collapsed={collapsed}
          icon={<UserPlusIcon className="size-5" />}
          label="Adicionar amigo"
          onClick={() => openDialog('add-friend')}
          highlight
        />
        <SidebarAction
          collapsed={collapsed}
          icon={<InboxIcon className="size-5" />}
          label="Pedidos de amizade"
          badge={requests.data?.length ?? 0}
          onClick={() => openDialog('friend-requests')}
        />
      </div>

      {!collapsed && (
        <p className="px-5 pt-2 pb-2 text-xs font-semibold tracking-wide text-fg-subtle uppercase">
          Amigos
        </p>
      )}

      <div className="flex min-h-0 flex-1 flex-col">
        <FriendList
          collapsed={collapsed}
          onAddFriend={() => openDialog('add-friend')}
        />
      </div>

      <footer className="border-t border-line p-3">
        <button
          type="button"
          onClick={() => openDialog('account')}
          title={collapsed ? 'Minha conta' : undefined}
          className={`flex w-full cursor-pointer items-center gap-3 rounded-lg p-2 text-left transition hover:bg-elevated ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <Avatar id={me.user.id} name={me.user.displayName} online />
          {!collapsed && (
            <>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">
                  {me.user.displayName}
                </span>
                <span className="truncate text-xs text-fg-muted">
                  @{me.user.username}
                </span>
              </span>
              <MoreIcon className="size-4 text-fg-muted" />
            </>
          )}
        </button>
      </footer>
    </aside>
  )
}

interface SidebarActionProps {
  collapsed: boolean
  icon: ReactNode
  label: string
  onClick: () => void
  // Contador (ex.: pedidos pendentes); 0 = escondido
  badge?: number
  // Destaque suave em lima: a ação principal da sidebar
  highlight?: boolean
}

function SidebarAction({
  collapsed,
  icon,
  label,
  onClick,
  badge = 0,
  highlight = false,
}: SidebarActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? label : undefined}
      aria-label={collapsed ? label : undefined}
      className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
        collapsed ? 'justify-center' : ''
      } ${
        highlight
          ? 'bg-primary/10 text-primary hover:bg-primary/20'
          : 'text-fg-muted hover:bg-elevated hover:text-fg'
      }`}
    >
      <span className="relative flex">
        {icon}
        {/* Recolhida: o contador fica em cima do ícone */}
        {collapsed && (
          <CountBadge
            count={badge}
            className="absolute -top-2 -right-2.5 ring-2 ring-sidebar"
          />
        )}
      </span>
      {!collapsed && (
        <>
          <span className="flex-1 text-left">{label}</span>
          <CountBadge count={badge} />
        </>
      )}
    </button>
  )
}
