import { Link, useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import {
  authenticateSchema,
  type AuthenticateInput,
} from '@/features/auth/schema'
import { useAuthenticate } from '@/features/auth/hooks'

const inputClass =
  'w-full rounded-lg border border-line bg-elevated px-3 py-2.5 text-sm text-fg placeholder:text-fg-subtle outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30'

const errorClass = 'text-xs text-danger'

export function LoginPage() {
  const navigate = useNavigate()
  const authenticateUser = useAuthenticate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthenticateInput>({ resolver: zodResolver(authenticateSchema) })

  function onSubmit(data: AuthenticateInput) {
    authenticateUser.mutate(data, {
      // useAuthenticate já atualizou o /me antes de chegar aqui
      onSuccess: () => navigate('/'),
    })
  }

  const apiError = authenticateUser.error
    ? isAxiosError(authenticateUser.error) &&
      authenticateUser.error.response?.status === 401
      ? 'E-mail ou senha incorretos.'
      : isAxiosError(authenticateUser.error) &&
          authenticateUser.error.response?.status === 429
        ? 'Muitas tentativas. Aguarde um minuto.'
        : 'Não foi possível entrar. Tente novamente.'
    : null

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-2xl font-bold tracking-tight">
            Zap<span className="text-primary">Wave</span>
          </span>
          <h1 className="mt-6 text-xl font-semibold">Bem vindo de volta</h1>
          <p className="mt-1 text-sm text-fg-muted">faça o login.</p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-6 shadow-xl shadow-black/20"
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">E-mail</span>
            <input
              type="email"
              autoComplete="email"
              placeholder="voce@email.com"
              className={inputClass}
              {...register('email')}
            />
            {errors.email && (
              <span className={errorClass}>{errors.email.message}</span>
            )}
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Senha</span>
            <input
              type="password"
              autoComplete="current-password"
              placeholder="••••••"
              className={inputClass}
              {...register('password')}
            />
            {errors.password && (
              <span className={errorClass}>{errors.password.message}</span>
            )}
          </label>

          {apiError && <p className={errorClass}>{apiError}</p>}

          <button
            type="submit"
            disabled={authenticateUser.isPending}
            className="mt-2 cursor-pointer rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none disabled:opacity-50"
          >
            {authenticateUser.isPending ? 'Entrando…' : 'Logar'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-fg-muted">
          Ainda não tem conta?{' '}
          <Link
            to="/register"
            className="font-medium text-primary hover:text-primary-hover"
          >
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  )
}
