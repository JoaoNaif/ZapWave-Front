import { Outlet } from 'react-router'

// Telas públicas (login, cadastro)
export function AuthLayout() {
  return (
    <main>
      <Outlet />
    </main>
  )
}
