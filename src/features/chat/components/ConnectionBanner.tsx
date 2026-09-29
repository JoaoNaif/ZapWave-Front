import { useChat } from '../context'

// Aviso discreto enquanto o WebSocket tenta voltar. Mensagens enviadas
// continuam funcionando (envio é HTTP); só o recebimento ao vivo para
export function ConnectionBanner() {
  const { status } = useChat()

  if (status !== 'reconnecting') return null

  return (
    <p
      role="status"
      className="shrink-0 bg-warning/10 px-4 py-1.5 text-center text-xs font-medium text-warning"
    >
      Reconectando…
    </p>
  )
}
