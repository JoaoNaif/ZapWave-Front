import type { ReactNode } from 'react'
import { Logo } from './Logo'

// Tela cheia simples (404, erro inesperado), no mesmo visual do login
export function FullScreenMessage({
  code,
  title,
  description,
  children,
}: {
  code?: string
  title: string
  description: string
  // Botões/links de ação
  children: ReactNode
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="flex w-full max-w-sm flex-col items-center text-center">
        <Logo />
        {code && (
          <p className="mt-8 text-6xl font-bold tracking-tight text-primary">
            {code}
          </p>
        )}
        <h1 className={`text-xl font-semibold ${code ? 'mt-2' : 'mt-8'}`}>
          {title}
        </h1>
        <p className="mt-2 text-sm text-fg-muted">{description}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {children}
        </div>
      </div>
    </main>
  )
}
