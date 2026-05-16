import { useAuth } from '../contexts/AuthContext'
import { useNotifikasi } from '../contexts/NotifikasiContext'  // ← pindah dari hooks
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

export default function Topbar({ title, onMenuToggle }) {
  const { profile, user } = useAuth()
  const { unreadCount } = useNotifikasi()  // ← dari context, bukan hook
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const userName = profile?.nama_lengkap || user?.email?.split('@')[0] || 'User'
  const userInitial = userName.charAt(0).toUpperCase()

  const handleLogout = async () => {
    // Implement logout
  }

  return (
    <header className="kpro-topbar">
      <div className="kpro-topbar-left">
        <button className="kpro-mobile-menu-toggle" onClick={onMenuToggle}>☰</button>
        <h1 className="kpro-topbar-title">{title}</h1>
      </div>
      <div className="kpro-topbar-right">
        <button className="kpro-notif-btn" onClick={() => navigate('/notifikasi')}>
          🔔
          {unreadCount > 0 && (
            <span className="kpro-notif-pip" style={{ display: 'inline-flex' }}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
        <div className={`kpro-dropdown ${dropdownOpen ? 'is-open' : ''}`}>
          <button className="kpro-avatar kpro-avatar-md kpro-avatar-blue" onClick={() => setDropdownOpen(!dropdownOpen)}>
            {userInitial}
          </button>
          <div className="kpro-dropdown-menu">
            <div className="kpro-dropdown-item" onClick={() => navigate('/akun')}>👤 Profil Saya</div>
            <div className="kpro-dropdown-divider"></div>
            <div className="kpro-dropdown-item" onClick={handleLogout}>🚪 Keluar</div>
          </div>
        </div>
      </div>
    </header>
  )
}