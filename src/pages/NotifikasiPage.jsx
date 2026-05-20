import { useNotifikasi } from '../contexts/NotifikasiContext'
import { useEffect, useState, useRef } from 'react'
import { Bell, CheckCheck, RefreshCw, User } from 'lucide-react'

export default function NotifikasiPage() {
  const { notifikasi, loading, unreadCount, markAsRead, markAllRead, refresh } = useNotifikasi()
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const hasAutoMarkedRef = useRef(false) // 🔥 Gunakan ref, bukan state

  // 🔥 Auto mark as read hanya jika halaman notifikasi aktif dan data sudah selesai dimuat
  useEffect(() => {
    if (!loading && notifikasi.length > 0 && unreadCount > 0 && !hasAutoMarkedRef.current) {
      console.log('📖 Auto mark all read di halaman notifikasi')
      hasAutoMarkedRef.current = true
      markAllRead()
    }
  }, [loading, notifikasi.length, unreadCount, markAllRead])

  // Reset auto mark ketika pindah halaman (optional)
  useEffect(() => {
    return () => {
      hasAutoMarkedRef.current = false
    }
  }, [])

  // Polling setiap 10 detik
  useEffect(() => {
    const interval = setInterval(() => {
      console.log(' Auto refresh notifikasi (polling)...')
      refresh()
      setLastUpdate(new Date())
    }, 10000)
    return () => clearInterval(interval)
  }, [refresh])

  // Refresh saat halaman aktif kembali
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ Halaman aktif, refresh notifikasi...')
        refresh()
        setLastUpdate(new Date())
        // Reset auto mark flag saat halaman aktif kembali
        hasAutoMarkedRef.current = false
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [refresh])

  const formatRelativeTime = (isoDate) => {
    if (!isoDate) return '-'
    const diff = Date.now() - new Date(isoDate).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'Baru saja'
    if (minutes < 60) return `${minutes} menit lalu`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} jam lalu`
    const days = Math.floor(hours / 24)
    if (days === 1) return 'Kemarin'
    if (days < 7) return `${days} hari lalu`
    return new Date(isoDate).toLocaleDateString('id-ID')
  }

  const getTipeClass = (tipe, isUrgent) => {
    if (isUrgent) return 'notif-urgent'
    if (tipe === 'success') return 'notif-success'
    if (tipe === 'danger') return 'notif-danger'
    if (tipe === 'warning') return 'notif-warning'
    return 'notif-info'
  }

  const getTipeIcon = (tipe, isUrgent) => {
    if (isUrgent) return ''
    if (tipe === 'success') return ''
    if (tipe === 'danger') return ''
    if (tipe === 'warning') return ''
    return ''
  }

  if (loading && notifikasi.length === 0) {
    return (
      <div>
        <div className="kpro-page-header">
          <div><h2 className="kpro-page-title">Notifikasi</h2><p className="kpro-page-subtitle">Riwayat aktivitas</p></div>
        </div>
        <div className="kpro-card">
          <div className="kpro-notif-item"><div className="kpro-notif-text kpro-text-muted">Memuat notifikasi...</div></div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="kpro-page-header">
        <div>
          <h2 className="kpro-page-title">Notifikasi</h2>
          <p className="kpro-page-subtitle">
            {unreadCount > 0 ? `${unreadCount} notifikasi belum dibaca` : 'Semua notifikasi sudah dibaca'}
          </p>
        </div>
        <div className="kpro-page-actions">
          <button className="kpro-btn kpro-btn-secondary" onClick={markAllRead}>
            <CheckCheck size={16} style={{ marginRight: '6px' }} />
            Tandai semua dibaca
          </button>
          <button className="kpro-btn kpro-btn-ghost" onClick={refresh}>
            <RefreshCw size={16} style={{ marginRight: '6px' }} />
            Refresh
          </button>
        </div>
      </div>
      <div className="kpro-card">
        {notifikasi.length === 0 ? (
          <div className="kpro-notif-item">
            <div className="kpro-notif-text kpro-text-muted" style={{ padding: '16px', textAlign: 'center' }}>
              <Bell size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
              <div>Belum ada notifikasi.</div>
            </div>
          </div>
        ) : (
          notifikasi.map(notif => {
            const isRead = notif.is_read || false
            const isUrgent = notif.is_urgent || false
            
            let displayPesan = notif.pesan || ''
            if (notif.created_by_name && notif.pesan && !notif.pesan.includes(notif.created_by_name)) {
              displayPesan = `${notif.created_by_name} ${notif.pesan}`
            }
            
            return (
              <div 
                key={notif.id} 
                className={`kpro-notif-item ${!isRead ? 'unread' : ''}`}
                style={{ cursor: 'pointer', opacity: isRead ? 0.7 : 1, background: isUrgent && !isRead ? '#FEF2F2' : 'transparent' }}
                onClick={() => markAsRead(notif.id)}
              >
                <div className={`kpro-notif-dot ${getTipeClass(notif.tipe, isUrgent)}`}></div>
                <div style={{ flex: 1 }}>
                  <div className="kpro-notif-text">
                    <strong>
                      {getTipeIcon(notif.tipe, isUrgent)} {notif.judul}
                    </strong>
                    {!isRead && <span className="kpro-badge kpro-badge-info" style={{ marginLeft: '8px', fontSize: '10px' }}>Baru</span>}
                    {isUrgent && !isRead && <span className="kpro-badge kpro-badge-danger" style={{ marginLeft: '8px', fontSize: '10px' }}>Penting</span>}
                    <br />
                    {displayPesan}
                  </div>
                  <div className="kpro-notif-time">
                    {notif.created_by_name && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginRight: '12px' }}>
                        <User size={10} /> {notif.created_by_name}
                      </span>
                    )}
                    {formatRelativeTime(notif.created_at)}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}