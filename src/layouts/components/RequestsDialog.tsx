import type { ReactNode } from 'react'
import { Dialog } from '@/components/Dialog'
import { InboxIcon } from '@/components/icons'
import { FriendRequestItem } from '@/features/friendship/components/FriendRequestItem'
import { useFriendRequests } from '@/features/friendship/hooks'
import { RoomInviteItem } from '@/features/rooms/components/RoomInviteItem'
import { useRoomInvites } from '@/features/rooms/hooks'

interface RequestsDialogProps {
  open: boolean
  onClose: () => void
}

// Uma caixa só para tudo que espera resposta: amizade + convites de grupo
export function RequestsDialog({ open, onClose }: RequestsDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title="Pedidos">
      <RequestsContent />
    </Dialog>
  )
}

function RequestsContent() {
  const friendRequests = useFriendRequests()
  const roomInvites = useRoomInvites()

  if (friendRequests.isPending || roomInvites.isPending) {
    return (
      <ul className="flex flex-col gap-2" aria-label="Carregando pedidos">
        {Array.from({ length: 2 }, (_, index) => (
          <li key={index} className="flex items-center gap-3 py-2">
            <span className="size-10 shrink-0 animate-pulse rounded-full bg-elevated" />
            <span className="flex flex-1 flex-col gap-1.5">
              <span className="h-3 w-2/3 animate-pulse rounded bg-elevated" />
              <span className="h-2.5 w-1/3 animate-pulse rounded bg-elevated" />
            </span>
          </li>
        ))}
      </ul>
    )
  }

  if (friendRequests.isError || roomInvites.isError) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center text-sm">
        <p className="text-danger">Não foi possível carregar os pedidos.</p>
        <button
          type="button"
          onClick={() => {
            void friendRequests.refetch()
            void roomInvites.refetch()
          }}
          className="cursor-pointer font-medium text-primary hover:text-primary-hover"
        >
          Tentar de novo
        </button>
      </div>
    )
  }

  if (friendRequests.data.length === 0 && roomInvites.data.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-elevated text-fg-muted">
          <InboxIcon />
        </span>
        <p className="text-sm font-medium">Nenhum pedido por aqui</p>
        <p className="text-sm text-fg-muted">
          Pedidos de amizade e convites para grupos aparecem aqui.
        </p>
      </div>
    )
  }

  return (
    <div className="-mx-2 flex max-h-[60dvh] flex-col gap-4 overflow-y-auto">
      {friendRequests.data.length > 0 && (
        <Section title="Amizade">
          {friendRequests.data.map((request) => (
            <FriendRequestItem key={request.friendshipId} request={request} />
          ))}
        </Section>
      )}
      {roomInvites.data.length > 0 && (
        <Section title="Grupos">
          {roomInvites.data.map((invite) => (
            <RoomInviteItem key={invite.inviteId} invite={invite} />
          ))}
        </Section>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-1">
      <h3 className="px-2 text-xs font-semibold tracking-wide text-fg-subtle uppercase">
        {title}
      </h3>
      <ul className="flex flex-col gap-1">{children}</ul>
    </section>
  )
}
