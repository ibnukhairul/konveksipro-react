import { useNotifikasi } from '../contexts/NotifikasiContext'  // ← pindah dari hooks

export default function NotifikasiPage() {
  const { notifikasi, loading, unreadCount, markAsRead, markAllRead, refresh } = useNotifikasi()  // ← dari context

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

  const getTipeClass = (tipe) => {
    if (tipe === 'success') return 'kpro-notif-dot-green'
    if (tipe === 'danger') return 'kpro-notif-dot-red'
    if (tipe === 'warning') return 'kpro-notif-dot-amber'
    return 'kpro-notif-dot-blue'
  }

  if (loading) {
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
            Tandai semua dibaca
          </button>
          <button className="kpro-btn kpro-btn-ghost" onClick={refresh}>
            🔄 Refresh
          </button>
        </div>
      </div>
      <div className="kpro-card">
        {notifikasi.length === 0 ? (
          <div className="kpro-notif-item">
            <div className="kpro-notif-text kpro-text-muted" style={{ padding: '16px' }}>
              Belum ada notifikasi.
            </div>
          </div>
        ) : (
          notifikasi.map(notif => {
            const isRead = notif.is_read !== undefined ? notif.is_read : false
            return (
              <div 
                key={notif.id} 
                className="kpro-notif-item" 
                style={{ cursor: 'pointer', opacity: isRead ? 0.6 : 1 }}
                onClick={() => markAsRead(notif.id)}
              >
                <div className={`kpro-notif-dot ${getTipeClass(notif.tipe)}`}></div>
                <div style={{ flex: 1 }}>
                  <div className="kpro-notif-text">
                    <strong>{notif.judul}</strong>
                    <br />
                    {notif.pesan}
                  </div>
                  <div className="kpro-notif-time">{formatRelativeTime(notif.created_at)}</div>
                </div>
                {!isRead && (
                  <div style={{ fontSize: '10px', color: '#2563EB' }}>Baru</div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}