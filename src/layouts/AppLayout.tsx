import { Navigate, Outlet } from 'react-router'
import { useMe } from '@/features/auth/hooks'

// Telas logadas: checa a sessão (GET /me). Aqui também vai entrar o WebSocket
export function AppLayout() {
  const me = useMe()

  if (me.isPending) {
    return (
      <main className="flex min-h-screen items-center justify-center text-sm text-fg-muted">
        Carregando…
      </main>
    )
  }

  // Erro que não é 401 (back fora do ar, rede): não desloga, deixa tentar de novo
  if (me.isError) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 text-sm">
        <p className="text-danger">Não foi possível conectar ao servidor.</p>
        <button
          type="button"
          onClick={() => me.refetch()}
          className="cursor-pointer rounded-lg border border-line px-4 py-2 hover:bg-elevated"
        >
          Tentar de novo
        </button>
      </main>
    )
  }

  if (!me.data) return <Navigate to="/login" replace />

  return (
    <main>
      <Outlet />
    </main>
  )
}
