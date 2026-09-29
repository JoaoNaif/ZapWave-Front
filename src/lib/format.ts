const DAY_MS = 24 * 60 * 60 * 1000

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

// Horário curto estilo WhatsApp: "14:32", "ontem", "seg", "12/09"
export function formatShortDate(iso: string) {
  const date = new Date(iso)
  // round (não floor) por causa do horário de verão: um dia pode ter 23h ou 25h
  const daysAgo = Math.round(
    (startOfDay(new Date()).getTime() - startOfDay(date).getTime()) / DAY_MS,
  )

  if (daysAgo <= 0) {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  if (daysAgo === 1) return 'ontem'
  if (daysAgo < 7) {
    return date
      .toLocaleDateString('pt-BR', { weekday: 'short' })
      .replace('.', '')
  }
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}
