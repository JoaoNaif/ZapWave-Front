import { isAxiosError } from 'axios'
import { api } from '@/lib/api'
import type { UserDto } from '@/types/user'
import type { AuthenticateInput, RegisterInput } from './schema'
import { getDeviceName } from './device-name'

export interface Me {
  user: UserDto
  deviceId: string
}

// POST /register → 201 { user }. Não loga: depois precisa do POST /sessions
export async function register(data: RegisterInput) {
  const response = await api.post<{ user: UserDto }>('/register', data)
  return response.data.user
}

// POST /sessions → 200 { device_id } + cookie. Cada chamada cria um Device novo
export async function authenticate(data: AuthenticateInput) {
  const response = await api.post<{ device_id: string }>('/sessions', {
    ...data,
    deviceName: getDeviceName(),
  })
  return { deviceId: response.data.device_id }
}

// GET /me → 200 { user, deviceId }. 401 = não está logado → null (não é erro)
export async function getMe(): Promise<Me | null> {
  try {
    const response = await api.get<Me>('/me')
    return response.data
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 401) return null
    throw error
  }
}

// PUT /revoke-device → 204. É o "sair": derruba a sessão deste device
export async function revokeDevice(deviceId: string) {
  await api.put('/revoke-device', { deviceId })
}
