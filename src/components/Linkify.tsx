import type { ReactNode } from 'react'

// http(s)://… ou www.… até o próximo espaço
const URL_PATTERN = /\b(?:https?:\/\/|www\.)[^\s<>"]+/gi

// Pontuação no fim costuma ser da frase, não do link: "veja https://x.com."
// ")" só sai se estiver sobrando (links da Wikipédia têm parênteses de verdade)
function trimTrailing(url: string) {
  let result = url
  for (;;) {
    const last = result.at(-1)
    if (last && '.,!?;:\'"'.includes(last)) {
      result = result.slice(0, -1)
    } else if (
      last === ')' &&
      result.split(')').length > result.split('(').length
    ) {
      result = result.slice(0, -1)
    } else {
      return result
    }
  }
}

// Só http/https: nunca vira link algo como "javascript:"
function toHref(text: string) {
  try {
    const url = new URL(text.startsWith('www.') ? `https://${text}` : text)
    return url.protocol === 'http:' || url.protocol === 'https:'
      ? url.href
      : null
  } catch {
    return null
  }
}

// Texto com os links clicáveis (abrem em nova aba). O resto continua texto puro
export function Linkify({ text }: { text: string }) {
  const nodes: ReactNode[] = []
  let cursor = 0

  for (const match of text.matchAll(URL_PATTERN)) {
    const raw = trimTrailing(match[0])
    const href = toHref(raw)
    if (!href) continue

    nodes.push(text.slice(cursor, match.index))
    nodes.push(
      <a
        key={match.index}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
      >
        {raw}
      </a>
    )
    cursor = match.index + raw.length
  }

  nodes.push(text.slice(cursor))
  return nodes
}
