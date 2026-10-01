// Notificação do navegador para mensagem nova com a aba escondida

export function notificationsSupported() {
  return typeof window !== 'undefined' && 'Notification' in window
}

// Pedir permissão precisa vir de um clique (Firefox/Safari recusam sem gesto)
export async function requestNotificationPermission() {
  if (!notificationsSupported()) return 'denied' as const
  return Notification.requestPermission()
}

interface MessageNotification {
  title: string
  body: string
  // Mesma tag = substitui a anterior: uma notificação por conversa (e as
  // outras abas do mesmo navegador não duplicam)
  tag: string
  onClick: () => void
}

export function showMessageNotification({
  title,
  body,
  tag,
  onClick,
}: MessageNotification) {
  if (!notificationsSupported() || Notification.permission !== 'granted') return
  // Aba visível: o contador na tela já avisa
  if (document.visibilityState === 'visible') return

  const notification = new Notification(title, {
    body: body.length > 120 ? `${body.slice(0, 117)}…` : body,
    tag,
    icon: '/favicon.svg',
  })

  notification.onclick = () => {
    window.focus()
    onClick()
    notification.close()
  }
}
