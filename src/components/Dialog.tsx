import { useEffect, useRef, type ReactNode } from 'react'
import { XIcon } from './icons'

interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

// <dialog> nativo: foco, Esc e fundo escuro de graça. No mobile vira "bottom sheet"
export function Dialog({ open, onClose, title, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      // Clique no fundo (fora do conteúdo) fecha
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-line bg-surface p-0 text-fg shadow-xl shadow-black/40 backdrop:bg-black/60 backdrop:backdrop-blur-sm max-md:mb-0 max-md:w-full max-md:max-w-none max-md:rounded-b-none"
    >
      {/* Só monta o conteúdo aberto: fechar = formulário zerado */}
      {open && (
        <div className="flex flex-col gap-4 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="-mr-2 cursor-pointer rounded-lg p-2 text-fg-muted transition hover:bg-elevated hover:text-fg"
            >
              <XIcon />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  )
}
