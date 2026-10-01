import { useOnline } from '@/lib/use-online'
import { useChat } from '../context'

// Aviso discreto no topo quando a conexão some. Sem internet tem prioridade:
// é a causa mais provável, e diz o que acontece com o que a pessoa enviar
export function ConnectionBanner() {
  const { status } = useChat()
  const online = useOnline()

  if (!online) {
    return (
      <p
        role="status"
        className="shrink-0 bg-warning/10 px-4 py-1.5 text-center text-xs font-medium text-warning"
      >
        Sem internet. Suas mensagens serão enviadas quando a conexão voltar.
      </p>
    )
  }

  // Envio é HTTP e tenta de novo sozinho; aqui o que para é o recebimento ao vivo
  if (status === 'reconnecting') {
    return (
      <p
        role="status"
        className="shrink-0 bg-warning/10 px-4 py-1.5 text-center text-xs font-medium text-warning"
      >
        Reconectando…
      </p>
    )
  }

  return null
}
