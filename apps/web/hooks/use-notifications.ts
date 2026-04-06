"use client"
import { useState, useEffect, useCallback } from "react"
import { useSSEContext } from "@/lib/sse-context"

export interface AppNotification {
  id: string
  type: string
  title: string
  body: string
  ticketId: string | null
  ticket: { publicId: string } | null
  isRead: boolean
  createdAt: string
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const { subscribe } = useSSEContext()

  async function fetchNotifications() {
    const res = await fetch("/api/notifications?limit=20")
    if (!res.ok) return
    const data = await res.json() as { notifications: AppNotification[]; unreadCount: number }
    setNotifications(data.notifications)
    setUnreadCount(data.unreadCount)
  }

  useEffect(() => {
    void fetchNotifications().finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    return subscribe((event) => {
      if (event.type === "notification:new") {
        const n = event.payload as unknown as AppNotification
        setNotifications((prev) => [n, ...prev].slice(0, 20))
        setUnreadCount((c) => c + 1)
      }
    })
  }, [subscribe])

  const markRead = useCallback(async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" })
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    )
    setUnreadCount((c) => Math.max(0, c - 1))
  }, [])

  const markAllRead = useCallback(async () => {
    await fetch("/api/notifications/read-all", { method: "PATCH" })
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setUnreadCount(0)
  }, [])

  return {
    notifications,
    unreadCount,
    isLoading,
    markRead,
    markAllRead,
    refetch: fetchNotifications,
  }
}
