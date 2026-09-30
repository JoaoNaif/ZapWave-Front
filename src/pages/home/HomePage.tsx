import { MessageIcon } from '@/components/icons'
import { Logo } from '@/components/Logo'
import { FriendList } from '@/features/friendship/components/FriendList'
import { RoomList } from '@/features/rooms/components/RoomList'
import { useAppContext } from '@/layouts/app-context'

export function HomePage() {
  const { me, openDialog, tab } = useAppContext()

  return (
    <>
      {/* Mobile: a lista (amigos ou grupos, pela aba da barra de baixo) ocupa a tela toda */}
      <div className="flex min-h-0 flex-1 flex-col bg-sidebar md:hidden">
        <header className="flex h-16 shrink-0 items-center justify-between px-4">
          <Logo />
          <span className="text-sm font-medium text-fg-muted">
            {tab === 'friends' ? 'Amigos' : 'Grupos'}
          </span>
        </header>
        {tab === 'friends' ? (
          <FriendList onAddFriend={() => openDialog('add-friend')} />
        ) : (
          <RoomList onCreateRoom={() => openDialog('create-room')} />
        )}
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
          {tab === 'friends'
            ? 'Escolha um amigo na barra lateral para abrir a conversa.'
            : 'Escolha um grupo na barra lateral ou crie um novo.'}
        </p>
      </div>
    </>
  )
}
