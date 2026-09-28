// Nome amigável do device (ex.: "Chrome no Windows"), só para exibição.
// A ordem importa: Edge/Opera têm "Chrome" no UA, Android tem "Linux", iPhone tem "Mac OS X".
export function getDeviceName(): string | null {
  const ua = navigator.userAgent

  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /OPR\//.test(ua)
      ? 'Opera'
      : /Firefox\//.test(ua)
        ? 'Firefox'
        : /Chrome\//.test(ua)
          ? 'Chrome'
          : /Safari\//.test(ua)
            ? 'Safari'
            : null

  const os = /Windows/.test(ua)
    ? 'Windows'
    : /Android/.test(ua)
      ? 'Android'
      : /iPhone|iPad/.test(ua)
        ? 'iOS'
        : /Mac OS X/.test(ua)
          ? 'macOS'
          : /Linux/.test(ua)
            ? 'Linux'
            : null

  if (!browser && !os) return null
  return [browser, os].filter(Boolean).join(' no ')
}
