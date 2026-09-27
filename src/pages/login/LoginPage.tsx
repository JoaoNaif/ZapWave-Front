import { Link } from 'react-router'

const inputClass =
  'w-full rounded-lg border border-line bg-elevated px-3 py-2.5 text-sm text-fg placeholder:text-fg-subtle outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30'

export function LoginPage() {
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

        <form className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-6 shadow-xl shadow-black/20">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">E-mail</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              placeholder="voce@email.com"
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Senha</span>
            <input
              type="password"
              name="password"
              autoComplete="new-password"
              placeholder="••••••"
              className={inputClass}
            />
          </label>

          <button
            type="submit"
            className="mt-2 cursor-pointer rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none disabled:opacity-50"
          >
            Logar
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
