import type { ClientFrame, MessageDto, ServerFrame } from '@/types/chat'

// Fechamento que o back usa para handshake recusado ou device revogado
const CLOSE_UNAUTHORIZED = 4401
// Ack cumulativo: junta as mensagens de uma rajada e confirma só a maior
const ACK_DELAY_MS = 300
const MAX_RETRY_DELAY_MS = 30_000

const decoder = new TextDecoder()

// follower = outra aba deste navegador tem o socket e repassa as mensagens
export type SocketStatus =
  | 'connecting'
  | 'open'
  | 'reconnecting'
  | 'follower'

interface ChatSocketOptions {
  deviceId: string
  // Tem que guardar no estado de forma síncrona: o ack sai logo depois
  onMessage: (message: MessageDto) => void
  onStatus: (status: SocketStatus) => void
  // Voltou depois de cair: hora de buscar o histórico e completar buracos
  onReconnect: () => void
  // Depois de um 4401: false = sessão acabou (não reconecta)
  isSessionAlive: () => Promise<boolean>
}

function socketUrl(deviceId: string) {
  const url = new URL('/ws', import.meta.env.VITE_API_URL)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  url.searchParams.set('deviceId', deviceId)
  return url
}

// Todas as abas têm o mesmo deviceId e disputariam o mesmo inbox. Só a aba
// que pega o lock abre o WebSocket e repassa as mensagens às outras pelo
// BroadcastChannel. Fechou a líder, a próxima aba pega o lock e conecta.
// Retorna a função que desliga tudo (cleanup do useEffect).
export function startChatSocket(options: ChatSocketOptions) {
  const controller = new AbortController()
  const channel = new BroadcastChannel(`zapwave:chat:${options.deviceId}`)

  channel.onmessage = (event: MessageEvent<MessageDto>) =>
    options.onMessage(event.data)

  options.onStatus('follower')

  navigator.locks
    .request(
      `zapwave:ws:${options.deviceId}`,
      { signal: controller.signal },
      () => lead(options, channel, controller.signal),
    )
    // AbortError: a aba desmontou enquanto esperava o lock
    .catch(() => {})

  return () => {
    controller.abort()
    channel.close()
  }
}

// Segura o lock enquanto a Promise não resolve (até o cleanup)
function lead(
  options: ChatSocketOptions,
  channel: BroadcastChannel,
  signal: AbortSignal,
) {
  return new Promise<void>((resolve) => {
    if (signal.aborted) return resolve()

    let socket: WebSocket | null = null
    let attempt = 0
    let hasConnected = false
    let retryTimer: ReturnType<typeof setTimeout> | undefined
    let ackTimer: ReturnType<typeof setTimeout> | undefined
    let pendingAck: string | null = null

    function flushAck() {
      ackTimer = undefined
      if (pendingAck && socket?.readyState === WebSocket.OPEN) {
        const frame: ClientFrame = { type: 'ack', messageId: pendingAck }
        socket.send(JSON.stringify(frame))
      }
      // Se o socket caiu, tudo bem: o que ficou sem ack volta na reconexão
      pendingAck = null
    }

    function scheduleAck(messageId: string) {
      if (!pendingAck || messageId > pendingAck) pendingAck = messageId
      ackTimer ??= setTimeout(flushAck, ACK_DELAY_MS)
    }

    function scheduleReconnect() {
      // Backoff exponencial com jitter: 1s, 2s, 4s… até 30s
      const base = Math.min(MAX_RETRY_DELAY_MS, 1000 * 2 ** attempt)
      attempt++
      retryTimer = setTimeout(connect, base * (0.5 + Math.random() / 2))
    }

    function connect() {
      options.onStatus(hasConnected ? 'reconnecting' : 'connecting')
      const ws = new WebSocket(socketUrl(options.deviceId))
      // O back manda o JSON como frame binário (Buffer do Node), não texto.
      // ArrayBuffer (em vez do Blob padrão) dá para decodificar de forma síncrona
      ws.binaryType = 'arraybuffer'
      socket = ws

      ws.onopen = () => {
        attempt = 0
        options.onStatus('open')
        if (hasConnected) options.onReconnect()
        hasConnected = true
      }

      ws.onmessage = (event: MessageEvent<string | ArrayBuffer>) => {
        let frame: ServerFrame
        try {
          frame = JSON.parse(
            typeof event.data === 'string'
              ? event.data
              : decoder.decode(event.data),
          )
        } catch {
          return
        }
        if (frame.type !== 'message') return

        // Ordem importa: guarda → repassa às outras abas → só então confirma
        options.onMessage(frame.message)
        channel.postMessage(frame.message)
        scheduleAck(frame.message.id)
      }

      ws.onclose = async (event) => {
        socket = null
        if (signal.aborted) return
        options.onStatus('reconnecting')

        // 4401 não diz o motivo: pergunta ao /me se a sessão ainda vale
        if (event.code === CLOSE_UNAUTHORIZED) {
          const alive = await options.isSessionAlive().catch(() => true)
          // Sessão acabou: o AppLayout manda para o login e desmonta tudo
          if (!alive || signal.aborted) return
        }

        scheduleReconnect()
      }
    }

    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(retryTimer)
        clearTimeout(ackTimer)
        flushAck()
        socket?.close(1000)
        resolve()
      },
      { once: true },
    )

    connect()
  })
}
