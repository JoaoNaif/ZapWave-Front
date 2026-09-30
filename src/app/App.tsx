import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router'
import { installSessionGuard } from '@/features/auth/session'
import { api } from '@/lib/api'
import { queryClient } from '@/lib/query-client'
import { router } from './router'

// Uma vez, fora do componente: 401 em rota de negócio → confere o /me
installSessionGuard(api, queryClient)

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
