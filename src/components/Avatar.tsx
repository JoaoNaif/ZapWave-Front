import { avatarColor } from '@/lib/avatar-color'

const sizes = {
  xs: 'size-6 text-[10px]',
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-16 text-xl',
}

// Pessoa = círculo; grupo = quadrado arredondado (bate o olho e diferencia)
const shapes = {
  circle: 'rounded-full',
  square: 'rounded-xl',
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? '?'
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

interface AvatarProps {
  id: string
  name: string
  size?: keyof typeof sizes
  shape?: keyof typeof shapes
  // undefined = não mostra a bolinha de presença
  online?: boolean
}

export function Avatar({
  id,
  name,
  size = 'md',
  shape = 'circle',
  online,
}: AvatarProps) {
  const color = avatarColor(id)

  return (
    <span className="relative inline-flex shrink-0">
      <span
        className={`flex items-center justify-center font-semibold ${sizes[size]} ${shapes[shape]} ${color.bg} ${color.text}`}
      >
        {initials(name)}
      </span>
      {online !== undefined && (
        <span
          title={online ? 'Online' : 'Offline'}
          className={`absolute right-0 bottom-0 size-3 rounded-full ring-2 ring-sidebar ${online ? 'bg-online' : 'bg-away'}`}
        />
      )}
    </span>
  )
}
