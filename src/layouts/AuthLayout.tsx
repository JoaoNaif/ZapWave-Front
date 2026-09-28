import { Navigate, Outlet } from 'react-router'
import { useMe } from '@/features/auth/hooks'

// Telas públicas (login, cadastro). Quem já está logado vai direto para a home
export function AuthLayout() {
  const me = useMe()

  if (me.data) return <Navigate to="/" replace />

  return (
    <main>
      <Outlet />
    </main>
  )
}
