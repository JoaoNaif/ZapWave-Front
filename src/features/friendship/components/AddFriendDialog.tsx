import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import { Avatar } from '@/components/Avatar'
import { Dialog } from '@/components/Dialog'
import { useMe } from '@/features/auth/hooks'
import { useFindUser, useFriends, useInviteFriend } from '../hooks'
import {
  findUserSchema,
  type FindUserInput,
  type FindUserOutput,
} from '../schema'

const inputClass =
  'w-full rounded-lg border border-line bg-elevated px-3 py-2.5 pl-7 text-sm text-fg placeholder:text-fg-subtle outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30'

const primaryButtonClass =
  'cursor-pointer rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none disabled:opacity-50'

interface AddFriendDialogProps {
  open: boolean
  onClose: () => void
}

export function AddFriendDialog({ open, onClose }: AddFriendDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title="Adicionar amigo">
      <AddFriendForm />
    </Dialog>
  )
}

// Busca pelo @ exato (o back não tem autocomplete) → mostra o card → envia o pedido
function AddFriendForm() {
  const { data: me } = useMe()
  const friends = useFriends()
  const findUser = useFindUser()
  const inviteFriend = useInviteFriend()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FindUserInput, unknown, FindUserOutput>({
    resolver: zodResolver(findUserSchema),
  })

  function onSubmit({ username }: FindUserOutput) {
    inviteFriend.reset()
    findUser.mutate(username)
  }

  const found = findUser.data
  const isMe = found && found.id === me?.user.id
  const isFriend =
    found && friends.data?.some((friend) => friend.id === found.id)

  const findError = findUser.error
    ? isAxiosError(findUser.error) && findUser.error.response?.status === 429
      ? 'Muitas buscas seguidas. Aguarde um minuto.'
      : 'Não foi possível buscar agora. Tente novamente.'
    : null

  const inviteError = inviteFriend.error
    ? isAxiosError(inviteFriend.error) &&
      inviteFriend.error.response?.status === 409
      ? 'Já existe um pedido entre vocês (pendente ou recusado).'
      : 'Não foi possível enviar o pedido. Tente novamente.'
    : null

  return (
    <div className="flex flex-col gap-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-1.5"
      >
        <span className="text-sm text-fg-muted">
          Digite o usuário exato da pessoa.
        </span>
        <div className="flex gap-2">
          <label className="relative flex-1">
            <span className="sr-only">Usuário</span>
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-fg-subtle">
              @
            </span>
            <input
              type="text"
              autoFocus
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="usuario"
              className={inputClass}
              {...register('username')}
            />
          </label>
          <button
            type="submit"
            disabled={findUser.isPending}
            className="cursor-pointer rounded-lg border border-line px-4 text-sm font-medium transition hover:bg-elevated disabled:opacity-50"
          >
            {findUser.isPending ? 'Buscando…' : 'Buscar'}
          </button>
        </div>
        {errors.username && (
          <span className="text-xs text-danger">{errors.username.message}</span>
        )}
        {findError && <span className="text-xs text-warning">{findError}</span>}
      </form>

      {findUser.isSuccess && !found && (
        <p className="rounded-lg bg-elevated px-3 py-3 text-sm text-fg-muted">
          Nenhum usuário com esse @.
        </p>
      )}

      {found && (
        <div className="flex flex-col gap-3 rounded-xl border border-line bg-elevated p-3">
          <div className="flex items-center gap-3">
            <Avatar id={found.id} name={found.displayName} />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium">
                {found.displayName}
              </span>
              <span className="truncate text-xs text-fg-muted">
                @{found.username}
              </span>
            </div>
          </div>

          {isMe ? (
            <p className="text-sm text-fg-muted">Esse é você.</p>
          ) : isFriend ? (
            <p className="text-sm text-fg-muted">Vocês já são amigos.</p>
          ) : inviteFriend.isSuccess ? (
            <p className="text-sm text-online">
              Pedido enviado! Aparece aqui quando {found.displayName} aceitar.
            </p>
          ) : (
            <>
              <button
                type="button"
                disabled={inviteFriend.isPending}
                onClick={() => inviteFriend.mutate(found.id)}
                className={primaryButtonClass}
              >
                {inviteFriend.isPending ? 'Enviando…' : 'Enviar pedido'}
              </button>
              {inviteError && (
                <p className="text-xs text-danger">{inviteError}</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
