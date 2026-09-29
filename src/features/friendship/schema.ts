import { z } from 'zod'

export const findUserSchema = z.object({
  // Aceita "@fulano" ou "fulano"
  username: z
    .string()
    .trim()
    .transform((value) => value.replace(/^@/, ''))
    .pipe(z.string().min(1, 'Informe o @ do usuário')),
})

export type FindUserInput = z.input<typeof findUserSchema>
export type FindUserOutput = z.output<typeof findUserSchema>
