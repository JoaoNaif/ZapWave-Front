import { isAxiosError, type AxiosInstance } from 'axios'
import type { QueryClient } from '@tanstack/react-query'
import { getMe, type Me } from './api'

export const meQueryKey = ['me']

// Rotas em que 401 não quer dizer "a sessão caiu": o próprio /me (já trata o
// 401 como null) e as telas públicas (401 = senha errada)
const IGNORED_URLS = ['/me', '/sessions', '/register']

// Apaga tudo do usuário que saiu e marca como deslogado: o AppLayout vê null e
// manda para o login (e desmonta o WebSocket)
export function endSession(queryClient: QueryClient) {
  queryClient.removeQueries({
    predicate: (query) => query.queryKey[0] !== 'me',
  })
  queryClient.setQueryData(meQueryKey, null)
}

// 401 ≠ deslogado (no back, 401 também é "sem permissão"). Quem decide é o /me:
// 401 nele também = sessão acabou. Chamadas simultâneas viram uma busca só
// (o fetchQuery junta as que têm a mesma chave)
export async function confirmSession(queryClient: QueryClient) {
  const me = await queryClient.fetchQuery<Me | null>({
    queryKey: meQueryKey,
    queryFn: getMe,
    staleTime: 0,
  })
  if (me === null) endSession(queryClient)
  return me !== null
}

// Cookie expirou (24h) ou device foi revogado em outro lugar: qualquer 401
// numa rota de negócio dispara a confirmação. O erro original segue normal
export function installSessionGuard(
  api: AxiosInstance,
  queryClient: QueryClient
) {
  api.interceptors.response.use(undefined, (error) => {
    const is401 = isAxiosError(error) && error.response?.status === 401
    const url = isAxiosError(error) ? error.config?.url : undefined
    // Só confere se eu achava que estava logado (evita laço depois de sair)
    const loggedIn = queryClient.getQueryData(meQueryKey) != null

    if (is401 && loggedIn && !IGNORED_URLS.includes(url ?? '')) {
      // Rede falhou no /me: não desloga, só fica como estava
      confirmSession(queryClient).catch(() => {})
    }

    return Promise.reject(error)
  })
}
