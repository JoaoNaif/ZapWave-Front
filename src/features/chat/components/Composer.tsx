import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import { CheckIcon, SendIcon, XIcon } from '@/components/icons'
import { avatarColor } from '@/lib/avatar-color'
import type { ReplyToDto } from '@/types/chat'

const MAX_LENGTH = 4000
// Só mostra o contador quando está perto do limite do back
const COUNTER_FROM = 3500

interface ComposerProps {
  onSend: (body: string) => void
  disabled?: boolean
  // Mensagem que está sendo respondida (barra acima do campo) e quem é o autor
  replyingTo?: ReplyToDto | null
  replyAuthor?: string
  onCancelReply?: () => void
  // Mensagem minha que está sendo editada: o campo vem com o texto dela e o
  // envio chama onEdit (que rejeita a Promise se o back recusar)
  editing?: { id: string; body: string } | null
  onEdit?: (body: string) => Promise<void>
  onCancelEdit?: () => void
}

export function Composer({
  onSend,
  disabled = false,
  replyingTo = null,
  replyAuthor = '',
  onCancelReply,
  editing = null,
  onEdit,
  onCancelEdit,
}: ComposerProps) {
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState(false)
  const body = text.trim()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const replyingToId = replyingTo?.id
  const editingId = editing?.id

  // Começou (ou parou) de editar: o campo troca para o texto da mensagem (ou
  // volta vazio). Ajuste durante a renderização, sem efeito
  const [lastEditingId, setLastEditingId] = useState(editingId)
  if (editingId !== lastEditingId) {
    setLastEditingId(editingId)
    setText(editing?.body ?? '')
    setEditError(false)
  }

  // Escolheu "Responder" ou "Editar": já deixa o cursor no campo
  useEffect(() => {
    if (replyingToId || editingId) inputRef.current?.focus()
  }, [replyingToId, editingId])

  async function submit() {
    if (!body || disabled || saving) return

    if (editing) {
      // Nada mudou: só sai do modo edição
      if (body === editing.body) return onCancelEdit?.()
      setSaving(true)
      setEditError(false)
      try {
        await onEdit?.(body)
      } catch {
        // Mantém o texto para a pessoa tentar de novo
        setEditError(true)
      } finally {
        setSaving(false)
      }
      return
    }

    onSend(body)
    setText('')
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    void submit()
  }

  // Enter envia, Shift+Enter quebra linha. isComposing: não envia no meio de
  // um acento/IME. Esc cancela a resposta/edição
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Escape') {
      if (editing) return onCancelEdit?.()
      if (replyingTo) return onCancelReply?.()
    }
    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault()
      void submit()
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex shrink-0 flex-col gap-1 border-t border-line bg-surface px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:px-6"
    >
      {editing ? (
        <div className="flex items-center gap-2 rounded-xl bg-elevated py-1.5 pr-1.5 pl-3">
          <div className="min-w-0 flex-1 border-l-4 border-primary pl-2 text-xs">
            <p className="truncate font-semibold text-primary">
              Editando mensagem
            </p>
            <p className="line-clamp-1 wrap-break-word text-fg-muted">
              {editing.body}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancelEdit}
            aria-label="Cancelar edição"
            className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-fg-muted transition hover:bg-line hover:text-fg"
          >
            <XIcon className="size-4" />
          </button>
        </div>
      ) : (
        replyingTo && (
          <div className="flex items-center gap-2 rounded-xl bg-elevated py-1.5 pr-1.5 pl-3">
            <div className="min-w-0 flex-1 border-l-4 border-primary pl-2 text-xs">
              <p
                className={`truncate font-semibold ${avatarColor(replyingTo.senderId).text}`}
              >
                Respondendo a {replyAuthor}
              </p>
              <p className="line-clamp-2 wrap-break-word text-fg-muted">
                {replyingTo.body}
              </p>
            </div>
            <button
              type="button"
              onClick={onCancelReply}
              aria-label="Cancelar resposta"
              className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-fg-muted transition hover:bg-line hover:text-fg"
            >
              <XIcon className="size-4" />
            </button>
          </div>
        )
      )}
      <div className="flex items-end gap-2">
        <label className="flex-1">
          <span className="sr-only">Mensagem</span>
          <textarea
            ref={inputRef}
            rows={1}
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={MAX_LENGTH}
            placeholder="Digite uma mensagem"
            // Foco automático só no desktop: no celular abriria o teclado sozinho
            autoFocus={window.matchMedia('(min-width: 768px)').matches}
            className="block field-sizing-content max-h-40 min-h-10 w-full resize-none rounded-xl border border-line bg-elevated px-3 py-2.5 text-sm text-fg transition outline-none placeholder:text-fg-subtle focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
        </label>
        <button
          type="submit"
          disabled={!body || disabled || saving}
          aria-label={editing ? 'Salvar edição' : 'Enviar'}
          className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-primary text-on-primary transition hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none disabled:cursor-default disabled:opacity-40"
        >
          {editing ? (
            <CheckIcon className="size-4.5" />
          ) : (
            <SendIcon className="size-4.5" />
          )}
        </button>
      </div>
      {editError && (
        <span role="alert" className="text-xs text-danger">
          Não foi possível editar a mensagem. Tente de novo.
        </span>
      )}
      {text.length >= COUNTER_FROM && (
        <span className="self-end text-xs text-warning">
          {text.length}/{MAX_LENGTH}
        </span>
      )}
    </form>
  )
}
