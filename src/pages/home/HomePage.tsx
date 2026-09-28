import { useMe, useLogout } from '@/features/auth/hooks'

export function HomePage() {
  const { data: me } = useMe()
  const logout = useLogout()

  if (!me) return null

  return (
    <div className="flex flex-col items-start gap-3 p-6">
      <h1 className="text-xl font-semibold">Olá, {me.user.displayName}</h1>
      <button
        type="button"
        disabled={logout.isPending}
        onClick={() => logout.mutate(me.deviceId)}
        className="cursor-pointer rounded-lg bg-danger/10 px-4 py-2 text-sm font-medium text-danger hover:bg-danger/20 disabled:opacity-50"
      >
        Sair
      </button>
    </div>
  )
}
