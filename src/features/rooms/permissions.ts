import type { RoomRole } from '@/types/room'

// Espelha as regras dos use cases do back (remove-member, promote/demote,
// invite-to-room, leave-room). O back valida de novo; aqui é só para não
// mostrar botão que vai dar 401.

export function canInvite(me: RoomRole) {
  return me === 'owner' || me === 'admin'
}

// Owner remove qualquer um (menos ele); admin só remove member
export function canRemove(me: RoomRole, target: RoomRole) {
  if (target === 'owner') return false
  if (me === 'owner') return true
  return me === 'admin' && target === 'member'
}

// Só o owner promove/rebaixa (admin criaria admins que não consegue remover)
export function canPromote(me: RoomRole, target: RoomRole) {
  return me === 'owner' && target === 'member'
}

export function canDemote(me: RoomRole, target: RoomRole) {
  return me === 'owner' && target === 'admin'
}

// Owner não pode sair: teria que transferir o dono (ainda não existe no back)
export function canLeave(me: RoomRole) {
  return me !== 'owner'
}

export const roleLabel: Record<RoomRole, string> = {
  owner: 'Dono',
  admin: 'Admin',
  member: 'Membro',
}
