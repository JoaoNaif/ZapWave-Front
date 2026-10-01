import { useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog } from '@/components/Dialog'
import { useCreateRoom } from '../hooks'
import { createRoomSchema, type CreateRoomInput } from '../schema'

interface CreateRoomDialogProps {
  open: boolean
  onClose: () => void
}

export function CreateRoomDialog({ open, onClose }: CreateRoomDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title="Criar grupo">
      <CreateRoomForm onCreated={onClose} />
    </Dialog>
  )
}

// Cria → abre o grupo. Convidar os amigos é lá dentro (você vira o dono)
function CreateRoomForm({ onCreated }: { onCreated: () => void }) {
  const navigate = useNavigate()
  const createRoom = useCreateRoom()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateRoomInput>({ resolver: zodResolver(createRoomSchema) })

  function onSubmit({ name }: CreateRoomInput) {
    createRoom.mutate(name, {
      onSuccess: (room) => {
        onCreated()
        navigate(`/room/${room.id}`)
      },
    })
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-4"
    >
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Nome do grupo</span>
        <input
          type="text"
          autoFocus
          autoComplete="off"
          placeholder="Ex.: Galera do futebol"
          className="w-full rounded-lg border border-line bg-elevated px-3 py-2.5 text-sm text-fg transition outline-none placeholder:text-fg-subtle focus:border-primary focus:ring-2 focus:ring-primary/30"
          {...register('name')}
        />
        {errors.name ? (
          <span className="text-xs text-danger">{errors.name.message}</span>
        ) : (
          <span className="text-xs text-fg-muted">
            Você será o dono e poderá convidar amigos depois.
          </span>
        )}
      </label>

      {createRoom.isError && (
        <p className="text-xs text-danger">
          Não foi possível criar o grupo. Tente novamente.
        </p>
      )}

      <button
        type="submit"
        disabled={createRoom.isPending}
        className="cursor-pointer rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none disabled:opacity-50"
      >
        {createRoom.isPending ? 'Criando…' : 'Criar grupo'}
      </button>
    </form>
  )
}
