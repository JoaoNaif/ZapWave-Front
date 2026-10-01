import { useState } from 'react'
import { NavLink } from 'react-router'
import { Avatar } from '@/components/Avatar'
import { CountBadge } from '@/components/CountBadge'
import { SearchIcon } from '@/components/icons'
import { useUnreadSummary } from '@/features/chat/unread'
import { formatShortDate } from '@/lib/format'
import { useFriends } from '../hooks'

interface FriendListProps {
  // Sidebar recolhida: só os avatares
  collapsed?: boolean
  onAddFriend: () => void
}

export function FriendList({
  collapsed = false,
  onAddFriend,
}: FriendListProps) {
  const friends = useFriends()
  const unread = useUnreadSummary()
  const [search, setSearch] = useState('')

  if (friends.isPending) {
    return (
      <ul className="flex flex-col gap-1 px-3" aria-label="Carregando amigos">
        {Array.from({ length: 5 }, (_, index) => (
          <li key={index} className="flex items-center gap-3 px-2 py-2">
            <span className="size-10 shrink-0 animate-pulse rounded-full bg-elevated" />
            {!collapsed && (
              <span className="flex flex-1 flex-col gap-1.5">
                <span className="h-3 w-2/3 animate-pulse rounded bg-elevated" />
                <span className="h-2.5 w-1/3 animate-pulse rounded bg-elevated" />
              </span>
            )}
          </li>
        ))}
      </ul>
    )
  }

  if (friends.isError) {
    if (collapsed) return null
    return (
      <div className="flex flex-col items-center gap-2 px-6 py-8 text-center text-sm">
        <p className="text-danger">Não foi possível carregar seus amigos.</p>
        <button
          type="button"
          onClick={() => friends.refetch()}
          className="cursor-pointer font-medium text-primary hover:text-primary-hover"
        >
          Tentar de novo
        </button>
      </div>
    )
  }

  if (friends.data.length === 0) {
    if (collapsed) return null
    return (
      <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
        <p className="text-sm font-medium">Nenhum amigo ainda</p>
        <p className="text-sm text-fg-muted">
          Adicione alguém pelo @ para começar a conversar.
        </p>
        <button
          type="button"
          onClick={onAddFriend}
          className="mt-2 cursor-pointer text-sm font-medium text-primary hover:text-primary-hover"
        >
          Adicionar amigo
        </button>
      </div>
    )
  }

  const term = search.trim().toLowerCase()
  const visible = term
    ? friends.data.filter(
        (friend) =>
          friend.displayName.toLowerCase().includes(term) ||
          friend.username.toLowerCase().includes(term)
      )
    : friends.data

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {!collapsed && (
        <div className="px-3 pb-2">
          <label className="relative block">
            <span className="sr-only">Buscar amigo</span>
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-subtle" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar amigo"
              className="w-full rounded-lg border border-line bg-elevated py-2 pr-3 pl-9 text-sm text-fg transition outline-none placeholder:text-fg-subtle focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
          </label>
        </div>
      )}

      <ul className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-3 pb-3">
        {visible.map((friend) => {
          const unreadCount = unread.byFriend.get(friend.id) ?? 0
          return (
            <li key={friend.id}>
              <NavLink
                to={`/dm/${friend.id}`}
                title={collapsed ? friend.displayName : undefined}
                className={({ isActive }) =>
                  `relative flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-elevated ${
                    collapsed ? 'justify-center' : ''
                  } ${isActive ? 'bg-elevated' : ''}`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute top-2 bottom-2 -left-3 w-1 rounded-r-full bg-primary" />
                    )}
                    <span className="relative flex">
                      <Avatar
                        id={friend.id}
                        name={friend.displayName}
                        online={friend.online}
                      />
                      {/* Recolhida: o contador fica em cima do avatar */}
                      {collapsed && (
                        <CountBadge
                          count={unreadCount}
                          className="absolute -top-1 -right-1 ring-2 ring-sidebar"
                        />
                      )}
                    </span>
                    {!collapsed && (
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="flex items-baseline justify-between gap-2">
                          <span
                            className={`truncate text-sm ${unreadCount > 0 ? 'font-semibold' : 'font-medium'}`}
                          >
                            {friend.displayName}
                          </span>
                          {friend.lastMessageAt && (
                            <span
                              className={`shrink-0 text-xs ${unreadCount > 0 ? 'text-primary' : 'text-fg-subtle'}`}
                            >
                              {formatShortDate(friend.lastMessageAt)}
                            </span>
                          )}
                        </span>
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-xs text-fg-muted">
                            @{friend.username}
                          </span>
                          <CountBadge count={unreadCount} />
                        </span>
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          )
        })}

        {visible.length === 0 && (
          <li className="px-2 py-6 text-center text-sm text-fg-subtle">
            Ninguém com esse nome.
          </li>
        )}
      </ul>
    </div>
  )
}
