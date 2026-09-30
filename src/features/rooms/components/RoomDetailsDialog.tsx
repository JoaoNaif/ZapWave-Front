import { useState, type ReactNode } from 'react'
import { isAxiosError } from 'axios'
import { Avatar } from '@/components/Avatar'
import { Dialog } from '@/components/Dialog'
import { LogOutIcon, MoreIcon } from '@/components/icons'
import { useFriends } from '@/features/friendship/hooks'
import type { FriendDto } from '@/types/friendship'
import type { MyRoomDto, RoomMemberSummaryDto, RoomRole } from '@/types/room'
import {
  useDemoteAdmin,
  useInviteToRoom,
  useLeaveRoom,
  usePromoteToAdmin,
  useRemoveRoomMember,
  useRoomMembers,
} from '../hooks'
import {
  canDemote,
  canInvite,
  canLeave,
  canPromote,
  canRemove,
  roleLabel,
} from '../permissions'

interface RoomDetailsDialogProps {
  room: MyRoomDto
  meId: string
  open: boolean
  onClose: () => void
  // Saiu do grupo: a página volta para a home
  onLeft: () => void
}

export function RoomDetailsDialog({
  room,
  meId,
  open,
  onClose,
  onLeft,
}: RoomDetailsDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title="Informações do grupo">
      <RoomDetails room={room} meId={meId} onLeft={onLeft} />
    </Dialog>
  )
}

function RoomDetails({
  room,
  meId,
  onLeft,
}: {
  room: MyRoomDto
  meId: string
  onLeft: () => void
}) {
  const members = useRoomMembers(room.id)
  const myRole = room.role

  return (
    <div className="-mx-6 flex max-h-[70dvh] flex-col gap-5 overflow-y-auto px-6">
      <div className="flex flex-col items-center gap-1 text-center">
        <Avatar id={room.id} name={room.name} size="lg" shape="square" />
        <p className="mt-2 text-base font-semibold">{room.name}</p>
        <p className="text-sm text-fg-muted">
          {room.memberCount} {room.memberCount === 1 ? 'membro' : 'membros'} ·
          você é {roleLabel[myRole].toLowerCase()}
        </p>
      </div>

      <Section title="Membros">
        {members.isPending && (
          <p className="px-2 py-3 text-sm text-fg-subtle">Carregando…</p>
        )}
        {members.isError && (
          <button
            type="button"
            onClick={() => members.refetch()}
            className="cursor-pointer px-2 py-3 text-left text-sm text-danger"
          >
            Não foi possível carregar os membros. Tentar de novo
          </button>
        )}
        {members.data?.map((member) => (
          <MemberRow
            key={member.id}
            roomId={room.id}
            member={member}
            myRole={myRole}
            isMe={member.id === meId}
          />
        ))}
      </Section>

      {canInvite(myRole) && members.data && (
        <InviteFriends
          roomId={room.id}
          memberIds={new Set(members.data.map((member) => member.id))}
        />
      )}

      <LeaveRoom roomId={room.id} myRole={myRole} onLeft={onLeft} />
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-1">
      <h3 className="text-xs font-semibold tracking-wide text-fg-subtle uppercase">
        {title}
      </h3>
      <ul className="-mx-2 flex flex-col">{children}</ul>
    </section>
  )
}

function RoleBadge({ role }: { role: RoomRole }) {
  if (role === 'member') return null
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        role === 'owner' ? 'bg-primary/10 text-primary' : 'bg-elevated text-fg-muted'
      }`}
    >
      {roleLabel[role]}
    </span>
  )
}

interface MemberRowProps {
  roomId: string
  member: RoomMemberSummaryDto
  myRole: RoomRole
  isMe: boolean
}

function MemberRow({ roomId, member, myRole, isMe }: MemberRowProps) {
  const remove = useRemoveRoomMember()
  const promote = usePromoteToAdmin()
  const demote = useDemoteAdmin()
  const [expanded, setExpanded] = useState(false)
  const [confirmingRemove, setConfirmingRemove] = useState(false)

  const action = { conversationId: roomId, targetUserId: member.id }
  const busy = remove.isPending || promote.isPending || demote.isPending
  const failed = remove.isError || promote.isError || demote.isError

  const showPromote = !isMe && canPromote(myRole, member.role)
  const showDemote = !isMe && canDemote(myRole, member.role)
  const showRemove = !isMe && canRemove(myRole, member.role)
  const hasActions = showPromote || showDemote || showRemove

  return (
    <li className="flex flex-col gap-2 rounded-xl px-2 py-2">
      <div className="flex items-center gap-3">
        <Avatar id={member.id} name={member.displayName} size="sm" />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium">
            {member.displayName}
            {isMe && <span className="font-normal text-fg-muted"> (você)</span>}
          </span>
          <span className="truncate text-xs text-fg-muted">
            @{member.username}
          </span>
        </div>
        <RoleBadge role={member.role} />
        {hasActions && (
          <button
            type="button"
            onClick={() => {
              setExpanded(!expanded)
              setConfirmingRemove(false)
            }}
            aria-label={`Ações para ${member.displayName}`}
            aria-expanded={expanded}
            className="cursor-pointer rounded-lg p-1.5 text-fg-muted transition hover:bg-elevated hover:text-fg"
          >
            <MoreIcon className="size-4" />
          </button>
        )}
      </div>

      {expanded && !confirmingRemove && (
        <div className="flex flex-wrap gap-2 pl-11">
          {showPromote && (
            <SmallButton disabled={busy} onClick={() => promote.mutate(action)}>
              {promote.isPending ? 'Promovendo…' : 'Tornar admin'}
            </SmallButton>
          )}
          {showDemote && (
            <SmallButton disabled={busy} onClick={() => demote.mutate(action)}>
              {demote.isPending ? 'Rebaixando…' : 'Remover admin'}
            </SmallButton>
          )}
          {showRemove && (
            <SmallButton
              danger
              disabled={busy}
              onClick={() => setConfirmingRemove(true)}
            >
              Remover do grupo
            </SmallButton>
          )}
        </div>
      )}

      {confirmingRemove && (
        <div className="ml-11 flex flex-col gap-2 rounded-lg bg-danger/10 p-3">
          <p className="text-xs">
            Remover {member.displayName} do grupo? Não dá para convidar de novo
            depois.
          </p>
          <div className="flex gap-2">
            <SmallButton
              disabled={busy}
              onClick={() => setConfirmingRemove(false)}
            >
              Cancelar
            </SmallButton>
            <SmallButton
              danger
              disabled={busy}
              onClick={() => remove.mutate(action)}
            >
              {remove.isPending ? 'Removendo…' : 'Remover'}
            </SmallButton>
          </div>
        </div>
      )}

      {failed && (
        <p className="pl-11 text-xs text-danger">
          Não foi possível concluir. Tente novamente.
        </p>
      )}
    </li>
  )
}

function SmallButton({
  children,
  onClick,
  disabled,
  danger = false,
}: {
  children: ReactNode
  onClick: () => void
  disabled?: boolean
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
        danger
          ? 'bg-danger/10 text-danger hover:bg-danger/20'
          : 'border border-line hover:bg-elevated'
      }`}
    >
      {children}
    </button>
  )
}

// Convidar = escolher entre os amigos que ainda não estão no grupo
function InviteFriends({
  roomId,
  memberIds,
}: {
  roomId: string
  memberIds: Set<string>
}) {
  const friends = useFriends()
  const candidates =
    friends.data?.filter((friend) => !memberIds.has(friend.id)) ?? []

  return (
    <Section title="Convidar amigos">
      {friends.isPending && (
        <p className="px-2 py-3 text-sm text-fg-subtle">Carregando…</p>
      )}
      {friends.data && candidates.length === 0 && (
        <p className="px-2 py-3 text-sm text-fg-subtle">
          {friends.data.length === 0
            ? 'Você ainda não tem amigos para convidar.'
            : 'Todos os seus amigos já estão no grupo.'}
        </p>
      )}
      {candidates.map((friend) => (
        <InviteRow key={friend.id} roomId={roomId} friend={friend} />
      ))}
    </Section>
  )
}

function InviteRow({ roomId, friend }: { roomId: string; friend: FriendDto }) {
  const invite = useInviteToRoom()
  // 409: já tem convite (pendente, recusado ou de quando já foi membro)
  const alreadyInvited =
    isAxiosError(invite.error) && invite.error.response?.status === 409

  return (
    <li className="flex items-center gap-3 rounded-xl px-2 py-2">
      <Avatar id={friend.id} name={friend.displayName} size="sm" />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">
          {friend.displayName}
        </span>
        <span className="truncate text-xs text-fg-muted">
          @{friend.username}
        </span>
      </div>
      {invite.isSuccess ? (
        <span className="text-xs font-medium text-online">Convidado</span>
      ) : alreadyInvited ? (
        <span className="text-xs text-fg-subtle">Já convidado</span>
      ) : (
        <SmallButton
          disabled={invite.isPending}
          onClick={() =>
            invite.mutate({ conversationId: roomId, recipientId: friend.id })
          }
        >
          {invite.isPending
            ? 'Convidando…'
            : invite.isError
              ? 'Tentar de novo'
              : 'Convidar'}
        </SmallButton>
      )}
    </li>
  )
}

function LeaveRoom({
  roomId,
  myRole,
  onLeft,
}: {
  roomId: string
  myRole: RoomRole
  onLeft: () => void
}) {
  const leave = useLeaveRoom()
  const [confirming, setConfirming] = useState(false)

  if (!canLeave(myRole)) {
    return (
      <p className="border-t border-line pt-4 text-xs text-fg-subtle">
        Como dono, você não pode sair do grupo.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2 border-t border-line pt-4">
      {confirming ? (
        <div className="flex flex-col gap-2 rounded-lg bg-danger/10 p-3">
          <p className="text-xs">
            Sair do grupo? Você deixa de receber as mensagens e não pode ser
            convidado de novo.
          </p>
          <div className="flex gap-2">
            <SmallButton
              disabled={leave.isPending}
              onClick={() => setConfirming(false)}
            >
              Cancelar
            </SmallButton>
            <SmallButton
              danger
              disabled={leave.isPending}
              onClick={() => leave.mutate(roomId, { onSuccess: onLeft })}
            >
              {leave.isPending ? 'Saindo…' : 'Sair do grupo'}
            </SmallButton>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-danger/10 px-4 py-2.5 text-sm font-semibold text-danger transition hover:bg-danger/20"
        >
          <LogOutIcon className="size-4" />
          Sair do grupo
        </button>
      )}
      {leave.isError && (
        <p className="text-xs text-danger">
          Não foi possível sair. Tente novamente.
        </p>
      )}
    </div>
  )
}
