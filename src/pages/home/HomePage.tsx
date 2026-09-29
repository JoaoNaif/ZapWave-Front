import { MessageIcon } from '@/components/icons'
import { Logo } from '@/components/Logo'
import { FriendList } from '@/features/friendship/components/FriendList'
import { useAppContext } from '@/layouts/app-context'

export function HomePage() {
  const { me, openDialog } = useAppContext()

  return (
    <>
      {/* Mobile: a lista de amigos ocupa a tela toda */}
      <div className="flex min-h-0 flex-1 flex-col bg-sidebar md:hidden">
        <header className="flex h-16 shrink-0 items-center px-4">
          <Logo />
        </header>
        <FriendList onAddFriend={() => openDialog('add-friend')} />
      </div>

      {/* Desktop: a lista está na sidebar; aqui fica o convite para escolher alguém */}
      <div className="hidden flex-1 flex-col items-center justify-center gap-3 px-6 text-center md:flex">
        <span className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <MessageIcon className="size-8" />
        </span>
        <h1 className="mt-2 text-xl font-semibold">
          Olá, {me.user.displayName.split(' ')[0]}
        </h1>
        <p className="max-w-xs text-sm text-fg-muted">
          Escolha um amigo na barra lateral para abrir a conversa.
        </p>
      </div>
    </>
  )
}
