import { Link } from 'react-router'
import { FullScreenMessage } from '@/components/FullScreenMessage'

export function NotFoundPage() {
  return (
    <FullScreenMessage
      code="404"
      title="Página não encontrada"
      description="O endereço que você abriu não existe ou foi digitado errado."
    >
      <Link
        to="/"
        className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition hover:bg-primary-hover"
      >
        Ir para o início
      </Link>
    </FullScreenMessage>
  )
}
