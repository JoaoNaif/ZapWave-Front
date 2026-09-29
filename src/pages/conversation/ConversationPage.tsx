import { Link, useParams } from 'react-router'
import { isAxiosError } from 'axios'
import { Avatar } from '@/components/Avatar'
import { ArrowLeftIcon } from '@/components/icons'
import { Conversation } from '@/features/chat/components/Conversation'
import { useDirectConversation } from '@/features/chat/context'
import { useFriends } from '@/features/friendship/hooks'
import { useAppContext } from '@/layouts/app-context'

export function ConversationPage() {
  const { friendId = '' } = useParams()
  const { me } = useAppContext()
  const friends = useFriends()
  const friend = friends.data?.find((item) => item.id === friendId)
  const dm = useDirectConversation(friendId)

  const notFriends =
    isAxiosError(dm.error) &&
    (dm.error.response?.status === 406 || dm.error.response?.status === 404)

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-surface">
      <header className="flex h-16 shrink-0 items-center gap-3 border-b border-line px-4">
        <Link
          to="/"
          aria-label="Voltar"
          className="-ml-2 rounded-lg p-2 text-fg-muted transition hover:bg-elevated hover:text-fg md:hidden"
        >
          <ArrowLeftIcon />
        </Link>
        {friend ? (
          <>
            <Avatar
              id={friend.id}
              name={friend.displayName}
              online={friend.online}
            />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold">
                {friend.displayName}
              </span>
              <span
                className={`text-xs ${friend.online ? 'text-online' : 'text-fg-muted'}`}
              >
                {friend.online ? 'online' : `@${friend.username}`}
              </span>
            </div>
          </>
        ) : (
          friends.isPending && (
            <span className="flex items-center gap-3">
              <span className="size-10 animate-pulse rounded-full bg-elevated" />
              <span className="h-3 w-28 animate-pulse rounded bg-elevated" />
            </span>
          )
        )}
      </header>

      {dm.isPending && <div className="flex-1" />}

      {dm.isError && (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center text-sm">
          {notFriends ? (
            <p className="text-fg-muted">
              Vocês precisam ser amigos para conversar.
            </p>
          ) : (
            <>
              <p className="text-danger">Não foi possível abrir a conversa.</p>
              <button
                type="button"
                onClick={() => dm.refetch()}
                className="cursor-pointer font-medium text-primary hover:text-primary-hover"
              >
                Tentar de novo
              </button>
            </>
          )}
        </div>
      )}

      {dm.data && (
        // key: trocar de amigo zera o campo de texto e a rolagem
        <Conversation
          key={dm.data.id}
          conversationId={dm.data.id}
          meId={me.user.id}
        />
      )}
    </div>
  )
}
