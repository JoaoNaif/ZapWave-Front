import { useEffect } from 'react'
import { isRouteErrorResponse, Link, useRouteError } from 'react-router'
import { FullScreenMessage } from '@/components/FullScreenMessage'
import { NotFoundPage } from '../not-found/NotFoundPage'

// errorElement da raiz: no lugar da tela de erro padrão do router quando
// algum componente quebra durante a renderização
export function ErrorPage() {
  const error = useRouteError()

  useEffect(() => {
    // Mantém o erro visível no console para depurar
    console.error(error)
  }, [error])

  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFoundPage />
  }

  return (
    <FullScreenMessage
      title="Algo deu errado"
      description="Um erro inesperado interrompeu a tela. Recarregar costuma resolver."
    >
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="cursor-pointer rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition hover:bg-primary-hover"
      >
        Recarregar
      </button>
      <Link
        to="/"
        reloadDocument
        className="rounded-lg border border-line px-4 py-2.5 text-sm font-medium transition hover:bg-elevated"
      >
        Ir para o início
      </Link>
    </FullScreenMessage>
  )
}
