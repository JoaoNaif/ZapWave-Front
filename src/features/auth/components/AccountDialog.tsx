import { Avatar } from '@/components/Avatar'
import { Dialog } from '@/components/Dialog'
import { LogOutIcon } from '@/components/icons'
import type { Me } from '../api'
import { useLogout } from '../hooks'

interface AccountDialogProps {
  me: Me
  open: boolean
  onClose: () => void
}

export function AccountDialog({ me, open, onClose }: AccountDialogProps) {
  const logout = useLogout()

  return (
    <Dialog open={open} onClose={onClose} title="Minha conta">
      <div className="flex flex-col items-center gap-1 py-2 text-center">
        <Avatar id={me.user.id} name={me.user.displayName} size="lg" />
        <p className="mt-2 text-base font-semibold">{me.user.displayName}</p>
        <p className="text-sm text-fg-muted">@{me.user.username}</p>
        <p className="text-sm text-fg-subtle">{me.user.email}</p>
      </div>

      {logout.isError && (
        <p className="text-xs text-danger">
          Não foi possível sair. Tente novamente.
        </p>
      )}

      <button
        type="button"
        disabled={logout.isPending}
        onClick={() => logout.mutate(me.deviceId)}
        className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-danger/10 px-4 py-2.5 text-sm font-semibold text-danger transition hover:bg-danger/20 disabled:opacity-50"
      >
        <LogOutIcon className="size-4" />
        {logout.isPending ? 'Saindo…' : 'Sair'}
      </button>
    </Dialog>
  )
}
