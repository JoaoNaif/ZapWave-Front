// Cores de avatar não têm token: usa a paleta padrão (permitido pelo theme.css).
// bg + text juntos no avatar; só o text no nome de quem fala no grupo
const colors = [
  { bg: 'bg-sky-500/20', text: 'text-sky-300' },
  { bg: 'bg-violet-500/20', text: 'text-violet-300' },
  { bg: 'bg-amber-500/20', text: 'text-amber-300' },
  { bg: 'bg-rose-500/20', text: 'text-rose-300' },
  { bg: 'bg-emerald-500/20', text: 'text-emerald-300' },
  { bg: 'bg-fuchsia-500/20', text: 'text-fuchsia-300' },
]

// Mesmo id → mesma cor, em qualquer tela
export function avatarColor(id: string) {
  let hash = 0
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return colors[hash % colors.length]
}
