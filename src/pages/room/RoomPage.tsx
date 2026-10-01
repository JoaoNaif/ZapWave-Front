import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Avatar } from '@/components/Avatar'
import { ArrowLeftIcon, ChevronRightIcon } from '@/components/icons'
import { Conversation } from '@/features/chat/components/Conversation'
import { RoomDetailsDialog } from '@/features/rooms/components/RoomDetailsDialog'
import { useRoomMembers, useRooms } from '@/features/rooms/hooks'
import { canInvite } from '@/features/rooms/permissions'
import { useAppContext } from '@/layouts/app-context'

export function RoomPage() {
  const { roomId = '' } = useParams()
  const { me } = useAppContext()
  const navigate = useNavigate()
  const rooms = useRooms()
  const room = rooms.data?.find((item) => item.id === roomId)
  const members = useRoomMembers(roomId, room !== undefined)
  const [detailsOpen, setDetailsOpen] = useState(false)

  // Mensagem só traz senderId: os nomes vêm da lista de membros
  const senderNames = members.data
    ? new Map(members.data.map((member) => [member.id, member.displayName]))
    : undefined

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-surface">
      <header className="flex h-16 shrink-0 items-center gap-1 border-b border-line px-4">
        <Link
          to="/"
          aria-label="Voltar"
          className="-ml-2 rounded-lg p-2 text-fg-muted transition hover:bg-elevated hover:text-fg md:hidden"
        >
          <ArrowLeftIcon />
        </Link>
        {room ? (
          // O cabeçalho inteiro abre as informações (membros, convidar, sair)
          <button
            type="button"
            onClick={() => setDetailsOpen(true)}
            className="-ml-2 flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-left transition hover:bg-elevated"
          >
            <Avatar id={room.id} name={room.name} shape="square" />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-semibold">
                {room.name}
              </span>
              <span className="truncate text-xs text-fg-muted">
                {members.data
                  ? members.data.map((member) => member.displayName).join(', ')
                  : `${room.memberCount} ${room.memberCount === 1 ? 'membro' : 'membros'}`}
              </span>
            </span>
            <ChevronRightIcon className="size-4 shrink-0 text-fg-subtle" />
          </button>
        ) : (
          rooms.isPending && (
            <span className="flex items-center gap-3">
              <span className="size-10 animate-pulse rounded-xl bg-elevated" />
              <span className="h-3 w-28 animate-pulse rounded bg-elevated" />
            </span>
          )
        )}
      </header>

      {rooms.isError && (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-sm">
          <p className="text-danger">Não foi possível abrir o grupo.</p>
          <button
            type="button"
            onClick={() => rooms.refetch()}
            className="cursor-pointer font-medium text-primary hover:text-primary-hover"
          >
            Tentar de novo
          </button>
        </div>
      )}

      {rooms.data && !room && (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center text-sm">
          <p className="text-fg-muted">Você não faz parte deste grupo.</p>
          <Link
            to="/"
            className="font-medium text-primary hover:text-primary-hover"
          >
            Voltar
          </Link>
        </div>
      )}

      {room && (
        <>
          {room.memberCount === 1 && canInvite(room.role) && (
            <button
              type="button"
              onClick={() => setDetailsOpen(true)}
              className="shrink-0 cursor-pointer bg-primary/10 px-4 py-2 text-center text-xs font-medium text-primary transition hover:bg-primary/20"
            >
              Só você por aqui. Convidar amigos
            </button>
          )}

          {/* key: trocar de grupo zera o campo de texto e a rolagem */}
          <Conversation
            key={room.id}
            conversationId={room.id}
            meId={me.user.id}
            senderNames={senderNames}
          />

          <RoomDetailsDialog
            room={room}
            meId={me.user.id}
            open={detailsOpen}
            onClose={() => setDetailsOpen(false)}
            onLeft={() => {
              setDetailsOpen(false)
              navigate('/', { replace: true })
            }}
          />
        </>
      )}
    </div>
  )
}
