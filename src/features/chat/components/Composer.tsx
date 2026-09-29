import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { SendIcon } from '@/components/icons'

const MAX_LENGTH = 4000
// Só mostra o contador quando está perto do limite do back
const COUNTER_FROM = 3500

interface ComposerProps {
  onSend: (body: string) => void
  disabled?: boolean
}

export function Composer({ onSend, disabled = false }: ComposerProps) {
  const [text, setText] = useState('')
  const body = text.trim()

  function submit() {
    if (!body || disabled) return
    onSend(body)
    setText('')
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    submit()
  }

  // Enter envia, Shift+Enter quebra linha. isComposing: não envia no meio de
  // um acento/IME
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex shrink-0 flex-col gap-1 border-t border-line bg-surface px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:px-6"
    >
      <div className="flex items-end gap-2">
        <label className="flex-1">
          <span className="sr-only">Mensagem</span>
          <textarea
            rows={1}
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={MAX_LENGTH}
            placeholder="Digite uma mensagem"
            // Foco automático só no desktop: no celular abriria o teclado sozinho
            autoFocus={window.matchMedia('(min-width: 768px)').matches}
            className="field-sizing-content block max-h-40 min-h-10 w-full resize-none rounded-xl border border-line bg-elevated px-3 py-2.5 text-sm text-fg placeholder:text-fg-subtle outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
        </label>
        <button
          type="submit"
          disabled={!body || disabled}
          aria-label="Enviar"
          className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-primary text-on-primary transition hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none disabled:cursor-default disabled:opacity-40"
        >
          <SendIcon className="size-4.5" />
        </button>
      </div>
      {text.length >= COUNTER_FROM && (
        <span className="self-end text-xs text-warning">
          {text.length}/{MAX_LENGTH}
        </span>
      )}
    </form>
  )
}
