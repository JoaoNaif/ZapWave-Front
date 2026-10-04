import { useState } from 'react'
import { Dialog } from '@/components/Dialog'

interface DeleteMessageDialogProps {
  // null = fechado. body: o texto da mensagem, para a pessoa conferir
  message: { id: string; body: string } | null
  onClose: () => void
  // Rejeita se o back recusar (a mensagem continua na lista)
  onConfirm: (messageId: string) => Promise<void>
}

export function DeleteMessageDialog({
  message,
  onClose,
  onConfirm,
}: DeleteMessageDialogProps) {
  return (
    <Dialog open={message !== null} onClose={onClose} title="Apagar mensagem">
      {message && (
        <Confirm message={message} onClose={onClose} onConfirm={onConfirm} />
      )}
    </Dialog>
  )
}

// Separado para o estado (carregando/erro) zerar a cada abertura: o Dialog só
// monta o conteúdo aberto
function Confirm({
  message,
  onClose,
  onConfirm,
}: {
  message: { id: string; body: string }
  onClose: () => void
  onConfirm: (messageId: string) => Promise<void>
}) {
  const [deleting, setDeleting] = useState(false)
  const [failed, setFailed] = useState(false)

  async function confirm() {
    setDeleting(true)
    setFailed(false)
    try {
      await onConfirm(message.id)
      onClose()
    } catch {
      setFailed(true)
      setDeleting(false)
    }
  }

  return (
    <>
      <p className="text-sm text-fg-muted">
        A mensagem some para todos na conversa. Não dá para desfazer.
      </p>
      <p className="line-clamp-3 rounded-xl bg-elevated px-3 py-2 text-sm wrap-break-word">
        {message.body}
      </p>
      {failed && (
        <p role="alert" className="text-sm text-danger">
          Não foi possível apagar a mensagem. Tente de novo.
        </p>
      )}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={deleting}
          className="cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-fg-muted transition hover:bg-elevated hover:text-fg disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => void confirm()}
          disabled={deleting}
          className="cursor-pointer rounded-lg bg-danger px-4 py-2 text-sm font-semibold text-app transition hover:bg-danger/90 disabled:cursor-default disabled:opacity-50"
        >
          {deleting ? 'Apagando…' : 'Apagar'}
        </button>
      </div>
    </>
  )
}
