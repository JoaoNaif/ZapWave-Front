import { z } from 'zod'

// O back aceita qualquer string; o front exige um nome de verdade
export const createRoomSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Dê um nome ao grupo')
    .max(60, 'Máximo de 60 caracteres'),
})

export type CreateRoomInput = z.infer<typeof createRoomSchema>
