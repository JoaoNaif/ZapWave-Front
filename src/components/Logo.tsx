// Mesmo "ZapWave" das telas de login/cadastro. compact = só o selo "Z" (sidebar recolhida)
export function Logo({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <span
        aria-label="ZapWave"
        className="flex size-9 items-center justify-center rounded-xl bg-primary text-lg font-bold text-on-primary"
      >
        Z
      </span>
    )
  }

  return (
    <span className="text-xl font-bold tracking-tight">
      Zap<span className="text-primary">Wave</span>
    </span>
  )
}
