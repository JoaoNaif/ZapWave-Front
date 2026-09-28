import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authenticate, getMe, register, revokeDevice } from './api'
import type { RegisterInput } from './schema'

const meQueryKey = ['me']

// Sessão atual: Me = logado, null = deslogado
export function useMe() {
  return useQuery({
    queryKey: meQueryKey,
    queryFn: getMe,
    staleTime: Infinity,
    retry: false,
  })
}

export function useAuthenticate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authenticate,
    // Busca o /me de novo antes de terminar: ao navegar, a sessão já está no cache
    onSuccess: () => queryClient.invalidateQueries({ queryKey: meQueryKey }),
  })
}

// Cadastro não loga sozinho: cadastra e já faz o login em seguida
export function useRegister() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: RegisterInput) => {
      await register(data)
      await authenticate({ email: data.email, password: data.password })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: meQueryKey }),
  })
}

export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: revokeDevice,
    // Limpa tudo do usuário anterior; o AppLayout vê null e manda para o login
    onSuccess: () => {
      queryClient.clear()
      queryClient.setQueryData(meQueryKey, null)
    },
  })
}
