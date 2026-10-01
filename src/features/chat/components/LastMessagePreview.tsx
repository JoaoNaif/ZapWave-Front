import type { LastMessagePreviewDto } from '@/types/chat'

interface LastMessagePreviewProps {
  preview: LastMessagePreviewDto | null
  meId: string
  // Grupo: mostra quem mandou ("Fulano: oi"). DM: só o texto (ou "Você: oi")
  isRoom?: boolean
  // Com não lidas a prévia fica em destaque, como no WhatsApp
  unread?: boolean
  // Conversa ainda sem mensagem (@username, "3 membros")
  fallback: string
}

// Segunda linha dos itens da lista de amigos/grupos
export function LastMessagePreview({
  preview,
  meId,
  isRoom = false,
  unread = false,
  fallback,
}: LastMessagePreviewProps) {
  if (!preview) {
    return <span className="truncate text-xs text-fg-muted">{fallback}</span>
  }

  const prefix =
    preview.senderId === meId
      ? 'Você: '
      : isRoom
        ? `${preview.senderDisplayName.split(' ')[0]}: `
        : ''
  // Quebra de linha vira espaço: a prévia é uma linha só
  const body = preview.body.replace(/\s+/g, ' ')

  return (
    <span
      className={`truncate text-xs ${unread ? 'font-medium text-fg' : 'text-fg-muted'}`}
    >
      {prefix}
      {body}
    </span>
  )
}
