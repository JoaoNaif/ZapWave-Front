// Contador em lima (badge de pendentes/não lidas). 0 = não aparece
export function CountBadge({
  count,
  className = '',
}: {
  count: number
  className?: string
}) {
  if (count <= 0) return null

  return (
    <span
      className={`flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-none font-bold text-on-primary ${className}`}
    >
      {count > 9 ? '9+' : count}
    </span>
  )
}
