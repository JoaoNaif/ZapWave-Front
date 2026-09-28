import { z } from 'zod'

export const registerSchema = z.object({
  displayName: z.string().trim().min(1, 'Informe seu nome'),
  username: z.string().trim().min(1, 'Informe um usuário'),
  email: z.email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo de 6 caracteres'),
})

export type RegisterInput = z.infer<typeof registerSchema>

export const authenticateSchema = z.object({
  email: z.email('E-mail inválido'),
  // No login não valida regra de senha: quem decide se está certa é o back
  password: z.string().min(1, 'Informe sua senha'),
})

export type AuthenticateInput = z.infer<typeof authenticateSchema>
