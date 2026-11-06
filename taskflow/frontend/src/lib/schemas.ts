import { z } from 'zod'

const utf8Length = (value: string) => new TextEncoder().encode(value).length

export const passwordSchema = z
  .string()
  .min(8, 'A senha deve ter no mínimo 8 caracteres.')
  .refine((v) => utf8Length(v) <= 72, 'A senha deve ter no máximo 72 bytes.')
  .refine((v) => /\p{L}/u.test(v), 'A senha deve conter ao menos uma letra.')
  .refine((v) => /\p{N}/u.test(v), 'A senha deve conter ao menos um número.')

const emailSchema = z
  .string()
  .trim()
  .min(1, 'Informe seu e-mail.')
  .max(254, 'O e-mail deve ter no máximo 254 caracteres.')
  .email('Informe um e-mail válido.')

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Informe sua senha.').max(128, 'Senha inválida.'),
})
export type LoginValues = z.infer<typeof loginSchema>

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'O nome deve ter ao menos 2 caracteres.').max(120, 'O nome deve ter no máximo 120 caracteres.'),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirme a senha.'),
    acceptTerms: z.boolean().refine((v) => v, 'É necessário aceitar os termos de uso e a política de privacidade.'),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'A confirmação não confere com a senha.',
  })
export type RegisterValues = z.infer<typeof registerSchema>

export const forgotPasswordSchema = z.object({ email: emailSchema })
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

export const resetPasswordSchema = z
  .object({ password: passwordSchema, confirmPassword: z.string().min(1, 'Confirme a senha.') })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'A confirmação não confere com a senha.',
  })
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>

export const taskSchema = z.object({
  title: z.string().trim().min(1, 'Informe o título da tarefa.').max(150, 'O título deve ter no máximo 150 caracteres.'),
  description: z.string().max(2000, 'A descrição deve ter no máximo 2000 caracteres.'),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  categoryId: z.string(),
  dueAt: z.string(),
})
export type TaskValues = z.infer<typeof taskSchema>

export const categorySchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome da categoria.').max(60, 'O nome deve ter no máximo 60 caracteres.'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'A cor deve estar no formato #RRGGBB.'),
})
export type CategoryValues = z.infer<typeof categorySchema>

export const profileSchema = z.object({
  name: z.string().trim().min(2, 'O nome deve ter ao menos 2 caracteres.').max(120, 'O nome deve ter no máximo 120 caracteres.'),
})
export type ProfileValues = z.infer<typeof profileSchema>

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Informe a senha atual.').max(128),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirme a nova senha.'),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'A confirmação não confere com a nova senha.',
  })
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>

export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Informe sua senha para confirmar.').max(128),
})
export type DeleteAccountValues = z.infer<typeof deleteAccountSchema>
