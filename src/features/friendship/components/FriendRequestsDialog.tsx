import { Dialog } from '@/components/Dialog'
import { InboxIcon } from '@/components/icons'

interface FriendRequestsDialogProps {
  open: boolean
  onClose: () => void
}

// TODO(back): falta a rota de pedidos pendentes (sem ela não há friendshipId para
// aceitar/recusar). Quando existir: fetch em api.ts + lista com PUT accept/decline.
export function FriendRequestsDialog({ open, onClose }: FriendRequestsDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title="Pedidos de amizade">
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-elevated text-fg-muted">
          <InboxIcon />
        </span>
        <p className="text-sm font-medium">Em breve</p>
        <p className="text-sm text-fg-muted">
          Aqui vão aparecer os pedidos que você recebeu para aceitar ou recusar.
        </p>
      </div>
    </Dialog>
  )
}
