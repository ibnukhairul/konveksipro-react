import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { notifikasiService } from '../services/notifikasiService'
import { useAuth } from './AuthContext'

const NotifikasiContext = createContext()

export function NotifikasiProvider({ children }) {
  const { user } = useAuth()
  const [notifikasi, setNotifikasi] = useState([])
  const [loading, setLoading] = useState(true)
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
      setNotifikasi(prev => [{ ...newNotif, is_read: false }, ...prev])
      setUnreadCount(prev => prev + 1)
    }

    channelRef.current = notifikasiService.subscribe(handleNewNotifikasi)
    subscribedRef.current = true

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe()
        channelRef.current = null
        subscribedRef.current = false
      }
    }
  }, [user])

  const markAsRead = async (notifikasiId) => {
    if (!user) return
    try {
      await notifikasiService.markAsRead(notifikasiId, user.id)
      setNotifikasi(prev =>
        prev.map(n => n.id === notifikasiId ? { ...n, is_read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Gagal tandai baca:', err)
    }
  }

  const markAllRead = async () => {
    if (!user) return
    try {
      await notifikasiService.markAllRead(user.id)
      setNotifikasi(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Gagal tandai semua baca:', err)
    }
  }

  const refresh = () => loadData()

  return (
    <NotifikasiContext.Provider value={{
      notifikasi,
      loading,
      unreadCount,
      markAsRead,
      markAllRead,
      refresh
    }}>
      {children}
    </NotifikasiContext.Provider>
  )
}

export function useNotifikasi() {
  const context = useContext(NotifikasiContext)
  if (!context) {
    throw new Error('useNotifikasi harus digunakan di dalam NotifikasiProvider')
  }
  return context
}