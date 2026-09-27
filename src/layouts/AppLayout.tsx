import { Outlet } from 'react-router'

// Telas logadas: aqui entra a checagem de sessão (GET /me) e o WebSocket
export function AppLayout() {
  return (
    <main>
      <Outlet />
    </main>
  )
}
