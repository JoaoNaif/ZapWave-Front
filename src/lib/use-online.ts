import { useSyncExternalStore } from 'react'

function subscribe(onChange: () => void) {
  window.addEventListener('online', onChange)
  window.addEventListener('offline', onChange)
  return () => {
    window.removeEventListener('online', onChange)
    window.removeEventListener('offline', onChange)
  }
}

// O navegador diz se tem rede. false é confiável (sem rede nenhuma); true pode
// ser "Wi-Fi sem internet", e aí quem avisa é o WS caindo ("Reconectando…")
export function useOnline() {
  return useSyncExternalStore(subscribe, () => navigator.onLine)
}
