import { Link, useParams } from 'react-router'
import { Avatar } from '@/components/Avatar'
import { ArrowLeftIcon } from '@/components/icons'
import { useFriends } from '@/features/friendship/hooks'

// Placeholder: a conversa em si ainda não foi implementada
export function ConversationPage() {
  const { friendId } = useParams()
  const friends = useFriends()
  const friend = friends.data?.find((item) => item.id === friendId)

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
        {friend && (
          <>
            <Avatar id={friend.id} name={friend.displayName} online={friend.online} />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold">
                {friend.displayName}
              </span>
              <span className="text-xs text-fg-muted">
                {friend.online ? 'online' : `@${friend.username}`}
              </span>
            </div>
          </>
        )}
      </header>

      <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-fg-subtle">
        A conversa ainda vai ser implementada.
      </div>
    </div>
  )
}
