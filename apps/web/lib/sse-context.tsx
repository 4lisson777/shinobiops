"use client"
import { createContext, useContext, useCallback, useRef } from "react"
import { useSSE } from "@/hooks/use-sse"
import type { ShinobiEvent } from "@/lib/sse-emitter"

type Subscriber = (event: ShinobiEvent) => void

interface SSEContextValue {
  subscribe: (fn: Subscriber) => () => void
}

const SSEContext = createContext<SSEContextValue | null>(null)

export function SSEProvider({ children }: { children: React.ReactNode }) {
  const subscribersRef = useRef<Set<Subscriber>>(new Set())

  const handleEvent = useCallback((event: ShinobiEvent) => {
    subscribersRef.current.forEach((fn) => fn(event))
  }, [])

  useSSE(handleEvent)

  const subscribe = useCallback((fn: Subscriber) => {
    subscribersRef.current.add(fn)
    return () => subscribersRef.current.delete(fn)
  }, [])

  return (
    <SSEContext.Provider value={{ subscribe }}>{children}</SSEContext.Provider>
  )
}

export function useSSEContext() {
  const ctx = useContext(SSEContext)
  if (!ctx) throw new Error("useSSEContext must be used inside SSEProvider")
  return ctx
}
