// Cores de avatar não têm token: usa a paleta padrão (permitido pelo theme.css)
const colors = [
  'bg-sky-500/20 text-sky-300',
  'bg-violet-500/20 text-violet-300',
  'bg-amber-500/20 text-amber-300',
  'bg-rose-500/20 text-rose-300',
  'bg-emerald-500/20 text-emerald-300',
  'bg-fuchsia-500/20 text-fuchsia-300',
]

const sizes = {
  xs: 'size-6 text-[10px]',
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-16 text-xl',
}

// Mesmo id → mesma cor, em qualquer tela
function colorFor(id: string) {
  let hash = 0
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return colors[hash % colors.length]
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
  // undefined = não mostra a bolinha de presença
  online?: boolean
}

export function Avatar({ id, name, size = 'md', online }: AvatarProps) {
  return (
    <span className="relative inline-flex shrink-0">
      <span
        className={`flex items-center justify-center rounded-full font-semibold ${sizes[size]} ${colorFor(id)}`}
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
