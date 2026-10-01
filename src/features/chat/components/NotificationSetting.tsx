import { useState } from 'react'
import {
  notificationsSupported,
  requestNotificationPermission,
} from '../notifications'

// Liga as notificações do navegador (mensagem nova com a aba escondida).
// O navegador só mostra o pedido de permissão a partir de um clique
export function NotificationSetting() {
  const [permission, setPermission] = useState<NotificationPermission | null>(
    notificationsSupported() ? Notification.permission : null
  )

  if (permission === null) return null

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-elevated px-3 py-2.5">
      <div className="flex min-w-0 flex-col">
        <span className="text-sm font-medium">Notificações</span>
        <span className="text-xs text-fg-muted">
          {permission === 'granted'
            ? 'Ativadas para mensagens novas.'
            : permission === 'denied'
              ? 'Bloqueadas. Libere nas configurações do site no navegador.'
              : 'Avisar quando chegar mensagem com a aba fechada.'}
        </span>
      </div>
      {permission === 'default' && (
        <button
          type="button"
          onClick={async () =>
            setPermission(await requestNotificationPermission())
          }
          className="shrink-0 cursor-pointer rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-on-primary transition hover:bg-primary-hover"
        >
          Ativar
        </button>
      )}
      {permission === 'granted' && (
        <span className="size-2 shrink-0 rounded-full bg-online" />
      )}
    </div>
  )
}
