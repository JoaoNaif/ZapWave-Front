import { useState } from 'react'
import { NavLink } from 'react-router'
import { Avatar } from '@/components/Avatar'
import { CountBadge } from '@/components/CountBadge'
import { SearchIcon } from '@/components/icons'
import { useUnreadSummary } from '@/features/chat/unread'
import { formatShortDate } from '@/lib/format'
import { useRooms } from '../hooks'

interface RoomListProps {
  // Sidebar recolhida: só os avatares
  collapsed?: boolean
  onCreateRoom: () => void
}

export function RoomList({ collapsed = false, onCreateRoom }: RoomListProps) {
  const rooms = useRooms()
  const unread = useUnreadSummary()
  const [search, setSearch] = useState('')

  if (rooms.isPending) {
    return (
      <ul className="flex flex-col gap-1 px-3" aria-label="Carregando grupos">
        {Array.from({ length: 4 }, (_, index) => (
          <li key={index} className="flex items-center gap-3 px-2 py-2">
            <span className="size-10 shrink-0 animate-pulse rounded-xl bg-elevated" />
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

  if (rooms.isError) {
    if (collapsed) return null
    return (
      <div className="flex flex-col items-center gap-2 px-6 py-8 text-center text-sm">
        <p className="text-danger">Não foi possível carregar seus grupos.</p>
        <button
          type="button"
          onClick={() => rooms.refetch()}
          className="cursor-pointer font-medium text-primary hover:text-primary-hover"
        >
          Tentar de novo
        </button>
      </div>
    )
  }

  if (rooms.data.length === 0) {
    if (collapsed) return null
    return (
      <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
        <p className="text-sm font-medium">Nenhum grupo ainda</p>
        <p className="text-sm text-fg-muted">
          Crie um grupo e convide seus amigos, ou aceite um convite em Pedidos.
        </p>
        <button
          type="button"
          onClick={onCreateRoom}
          className="mt-2 cursor-pointer text-sm font-medium text-primary hover:text-primary-hover"
        >
          Criar grupo
        </button>
      </div>
    )
  }

  const term = search.trim().toLowerCase()
  const visible = term
    ? rooms.data.filter((room) => room.name.toLowerCase().includes(term))
    : rooms.data

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {!collapsed && (
        <div className="px-3 pb-2">
          <label className="relative block">
            <span className="sr-only">Buscar grupo</span>
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-subtle" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar grupo"
              className="w-full rounded-lg border border-line bg-elevated py-2 pr-3 pl-9 text-sm text-fg transition outline-none placeholder:text-fg-subtle focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
          </label>
        </div>
      )}

      <ul className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-3 pb-3">
        {visible.map((room) => {
          const unreadCount = unread.byRoom.get(room.id) ?? 0
          return (
            <li key={room.id}>
              <NavLink
                to={`/room/${room.id}`}
                title={collapsed ? room.name : undefined}
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
                      <Avatar id={room.id} name={room.name} shape="square" />
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
                            {room.name}
                          </span>
                          {room.lastMessageAt && (
                            <span
                              className={`shrink-0 text-xs ${unreadCount > 0 ? 'text-primary' : 'text-fg-subtle'}`}
                            >
                              {formatShortDate(room.lastMessageAt)}
                            </span>
                          )}
                        </span>
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-xs text-fg-muted">
                            {room.memberCount}{' '}
                            {room.memberCount === 1 ? 'membro' : 'membros'}
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
            Nenhum grupo com esse nome.
          </li>
        )}
      </ul>
    </div>
  )
}
