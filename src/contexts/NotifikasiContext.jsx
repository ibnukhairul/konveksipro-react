import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { notifikasiService } from '../services/notifikasiService'
import { useAuth } from './AuthContext'

const NotifikasiContext = createContext()

export function NotifikasiProvider({ children }) {
  const { user, profile } = useAuth()
  const [notifikasi, setNotifikasi] = useState([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [urgentNotif, setUrgentNotif] = useState(null)
  const channelRef = useRef(null)

  const loadData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await notifikasiService.getAll(user.id)
      setNotifikasi(data)
      const count = await notifikasiService.getUnreadCount(user.id)
      setUnreadCount(count)
      
      // Cek notifikasi urgent
      const urgent = data.find(n => n.is_urgent && !n.is_read)
      if (urgent) setUrgentNotif(urgent)
    } catch (err) {
      console.error('Load notifikasi error:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Setup realtime subscription (hanya untuk user ini)
  useEffect(() => {
    if (!user) return
    if (channelRef.current) {
      channelRef.current.unsubscribe()
    }

    const handleNewNotifikasi = (newNotif) => {
      console.log('🔔 Notifikasi baru:', newNotif)
      setNotifikasi(prev => [{ ...newNotif, is_read: false }, ...prev])
      setUnreadCount(prev => prev + 1)
      
      if (newNotif.is_urgent) {
        setUrgentNotif(newNotif)
        // Bisa tambahkan toast notifikasi urgent
      }
    }

    channelRef.current = notifikasiService.subscribe(user.id, handleNewNotifikasi)

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe()
        channelRef.current = null
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
      if (urgentNotif?.id === notifikasiId) setUrgentNotif(null)
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
    setUrgentNotif(null)
  } catch (err) {
    console.error('Gagal tandai semua baca:', err)
  }
}

  const refresh = () => loadData()
  const clearUrgent = () => setUrgentNotif(null)

  return (
    <NotifikasiContext.Provider value={{
      notifikasi,
      loading,
      unreadCount,
      urgentNotif,
      markAsRead,
      markAllRead,
      refresh,
      clearUrgent
    }}>
      {children}
    </NotifikasiContext.Provider>
  )
}

export const useNotifikasi = () => {
  const context = useContext(NotifikasiContext)
  if (!context) {
    throw new Error('useNotifikasi harus digunakan di dalam NotifikasiProvider')
  }
  return context
}