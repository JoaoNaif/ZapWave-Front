import { useState } from 'react'
import { Avatar } from '@/components/Avatar'
import { formatShortDate } from '@/lib/format'
import type { FriendRequestDto } from '@/types/friendship'
import { useAcceptFriendRequest, useDeclineFriendRequest } from '../hooks'

// Cada item tem as próprias mutations: o "carregando" de um não trava os outros
export function FriendRequestItem({ request }: { request: FriendRequestDto }) {
  const accept = useAcceptFriendRequest()
  const decline = useDeclineFriendRequest()
  // Recusar é definitivo (o par não pode mais se convidar): pede confirmação
  const [confirmingDecline, setConfirmingDecline] = useState(false)

  const busy = accept.isPending || decline.isPending
  const { sender } = request

  return (
    <li className="flex flex-col gap-3 rounded-xl px-2 py-2.5 transition hover:bg-elevated/60">
      <div className="flex items-center gap-3">
        <Avatar id={sender.id} name={sender.displayName} />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="flex items-baseline justify-between gap-2">
            <span className="truncate text-sm font-medium">
              {sender.displayName}
            </span>
            <span className="shrink-0 text-xs text-fg-subtle">
              {formatShortDate(request.createdAt)}
            </span>
          </span>
          <span className="truncate text-xs text-fg-muted">
            @{sender.username}
          </span>
        </div>
      </div>

      {confirmingDecline ? (
        <div className="flex flex-col gap-2 rounded-lg bg-danger/10 p-3">
          <p className="text-xs text-fg">
            Recusar o pedido de {sender.displayName}? Não dá para desfazer, e
            vocês não poderão se adicionar de novo.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => setConfirmingDecline(false)}
              className="flex-1 cursor-pointer rounded-lg border border-line px-3 py-2 text-sm font-medium transition hover:bg-elevated disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => decline.mutate(request.friendshipId)}
              className="flex-1 cursor-pointer rounded-lg bg-danger px-3 py-2 text-sm font-semibold text-app transition hover:bg-danger/90 disabled:opacity-50"
            >
              {decline.isPending ? 'Recusando…' : 'Recusar'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirmingDecline(true)}
            className="flex-1 cursor-pointer rounded-lg bg-danger/10 px-3 py-2 text-sm font-medium text-danger transition hover:bg-danger/20 disabled:opacity-50"
          >
            Recusar
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => accept.mutate(request.friendshipId)}
            className="flex-1 cursor-pointer rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-on-primary transition hover:bg-primary-hover disabled:opacity-50"
          >
            {accept.isPending ? 'Aceitando…' : 'Aceitar'}
          </button>
        </div>
      )}

      {(accept.isError || decline.isError) && (
        <p className="text-xs text-danger">
          Não foi possível responder. Tente novamente.
        </p>
      )}
    </li>
  )
}
