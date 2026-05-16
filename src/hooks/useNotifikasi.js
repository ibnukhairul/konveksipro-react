import { useState, useEffect, useCallback, useRef } from 'react'
import { notifikasiService } from '../services/notifikasiService'
import { useAuth } from '../contexts/AuthContext'

export function useNotifikasi() {
  const { user } = useAuth()
  const [notifikasi, setNotifikasi] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const channelRef = useRef(null)
  const subscribedRef = useRef(false)

  const loadData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await notifikasiService.getAll(user.id)
      setNotifikasi(data)
      const count = await notifikasiService.getUnreadCount(user.id)
      setUnreadCount(count)
    } catch (err) {
      console.error('Load notifikasi error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Setup realtime subscription
  useEffect(() => {
    if (!user) return
    if (subscribedRef.current) return

    const handleNewNotifikasi = (newNotif) => {
      console.log('Notifikasi baru masuk:', newNotif)
      // Notifikasi baru default is_read = false
      setNotifikasi(prev => [{ ...newNotif, is_read: false }, ...prev])
      setUnreadCount(prev => prev + 1)
    }

    console.log('Membuat subscription notifikasi...')
    channelRef.current = notifikasiService.subscribe(handleNewNotifikasi)
    subscribedRef.current = true

    return () => {
      if (channelRef.current) {
        console.log('Membersihkan subscription...')
        channelRef.current.unsubscribe()
        channelRef.current = null
        subscribedRef.current = false
      }
    }
  }, [user])

  // ✅ PERBAIKAN: Tandai satu notifikasi sebagai sudah dibaca
  const markAsRead = async (notifikasiId) => {
    if (!user) return
    try {
      await notifikasiService.markAsRead(notifikasiId, user.id)
      // Update state lokal
      setNotifikasi(prev =>
        prev.map(n => n.id === notifikasiId ? { ...n, is_read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Gagal tandai baca:', err)
    }
  }

  // ✅ PERBAIKAN: Tandai semua notifikasi sebagai sudah dibaca
  const markAllRead = async () => {
    if (!user) return
    try {
      await notifikasiService.markAllRead(user.id)
      // Update semua state lokal jadi sudah dibaca
      setNotifikasi(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Gagal tandai semua baca:', err)
    }
  }

  const refresh = () => loadData()

  return {
    notifikasi,
    loading,
    error,
    unreadCount,
    markAsRead,
    markAllRead,
    refresh
  }
}