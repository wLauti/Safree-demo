'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './useAuth'
import type { NotificationType } from '@/lib/supabase/types'

export interface AppNotification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string | null
  ref_type: string | null
  ref_id: string | null
  is_read: boolean
  created_at: string
}

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()

  const fetchNotifications = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
        const rows = (data ?? []) as any as AppNotification[]
    setNotifications(rows)
    setUnreadCount(rows.filter(n => !n.is_read).length)
  }, [user])

  useEffect(() => {
    fetchNotifications()
    if (!user) return

    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, () => fetchNotifications())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user, fetchNotifications])

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true } as never).eq('id', id)
    fetchNotifications()
  }

  const markAllRead = async () => {
    if (!user) return
    await supabase.from('notifications').update({ is_read: true } as never).eq('user_id', user.id)
    fetchNotifications()
  }

  return { notifications, unreadCount, markRead, markAllRead }
}


