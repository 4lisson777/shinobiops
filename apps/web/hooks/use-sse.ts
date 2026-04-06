"use client"
import { useEffect, useRef } from "react"
import type { ShinobiEvent } from "@/lib/sse-emitter"

type Handler = (event: ShinobiEvent) => void

export function useSSE(onEvent: Handler) {
  const handlerRef = useRef(onEvent)
  handlerRef.current = onEvent

  useEffect(() => {
    let es: EventSource | null = null
    let retryTimeout: ReturnType<typeof setTimeout> | null = null
    let retries = 0
    const MAX_RETRIES = 10

    function connect() {
      es = new EventSource("/api/sse")
      es.onmessage = (e) => {
        try {
          handlerRef.current(JSON.parse(e.data) as ShinobiEvent)
        } catch {
          // Ignore malformed event data
        }
      }
      es.onerror = () => {
        es?.close()
        if (retries < MAX_RETRIES) {
          const delay = Math.min(1000 * 2 ** retries, 30_000)
          retryTimeout = setTimeout(() => {
            retries++
            connect()
          }, delay)
        }
      }
      es.onopen = () => {
        retries = 0
      }
    }

    connect()

    return () => {
      if (retryTimeout) clearTimeout(retryTimeout)
      es?.close()
    }
  }, []) // empty deps — effect runs once; handler is stable via ref
}
