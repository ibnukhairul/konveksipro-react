import { useAuth } from '../contexts/AuthContext'
import { useNotifikasi } from '../contexts/NotifikasiContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { 
  Bell, 
  User, 
  LogOut, 
  Menu,
  ChevronDown,
  Settings
} from 'lucide-react'

export default function Topbar({ title, onMenuToggle }) {
  const { profile, user, logout } = useAuth()
  const { unreadCount, refresh } = useNotifikasi()
  const navigate = useNavigate()
  const location = useLocation()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  const userName = profile?.nama_lengkap || user?.email?.split('@')[0] || 'User'
  const userInitial = userName.charAt(0).toUpperCase()
  const userRole = profile?.role === 'owner' ? 'Owner' : profile?.role === 'developer' ? 'Developer' : 'Team'

  // 🔥 Refresh notifikasi saat pindah halaman (terutama saat masuk ke halaman notifikasi)
 useEffect(() => {
  if (location.pathname !== '/notifikasi') {
    // Hanya refresh sekali saat mount, tidak perlu setiap ganti halaman
    refresh()
  }
}, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const getRoleBadgeColor = () => {
    if (profile?.role === 'owner') return '#f97316'
    if (profile?.role === 'developer') return '#3b82f6'
    return '#64748b'
  }

  return (
    <header className="topbar-modern">
      <div className="topbar-modern-left">
        <button className="topbar-modern-menu-btn" onClick={onMenuToggle}>
          <Menu size={20} />
        </button>
        <div className="topbar-modern-title">
          <h1>{title}</h1>
        </div>
      </div>

      <div className="topbar-modern-right">
        {/* Notification Button */}
        <button 
          className="topbar-modern-notif-btn" 
          onClick={() => navigate('/notifikasi')}
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="topbar-modern-notif-badge">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* User Dropdown */}
        <div className="topbar-modern-dropdown" ref={dropdownRef}>
          <button 
            className="topbar-modern-dropdown-toggle"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <div className="topbar-modern-avatar">
              {userInitial}
            </div>
            <div className="topbar-modern-user-info">
              <span className="topbar-modern-user-name">{userName}</span>
              <span className="topbar-modern-user-role" style={{ color: getRoleBadgeColor() }}>
                {userRole}
              </span>
            </div>
            <ChevronDown size={16} className={`dropdown-arrow ${dropdownOpen ? 'rotated' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="topbar-modern-dropdown-menu">
              <div className="topbar-modern-dropdown-header">
                <div className="topbar-modern-dropdown-avatar">
                  {userInitial}
                </div>
                <div>
                  <div className="topbar-modern-dropdown-name">{userName}</div>
                  <div className="topbar-modern-dropdown-email">{user?.email}</div>
                </div>
              </div>
              <div className="topbar-modern-dropdown-divider" />
              <button 
                className="topbar-modern-dropdown-item"
                onClick={() => {
                  setDropdownOpen(false)
                  navigate('/akun')
                }}
              >
                <User size={16} />
                <span>Profil Saya</span>
              </button>
              {/* <button 
                className="topbar-modern-dropdown-item"
                onClick={() => {
                  setDropdownOpen(false)
                  navigate('/akun')
                }}
              >
                <Settings size={16} />
                <span>Pengaturan</span>
              </button> */}
              <div className="topbar-modern-dropdown-divider" />
              <button 
                className="topbar-modern-dropdown-item logout"
                onClick={handleLogout}
              >
                <LogOut size={16} />
                <span>Keluar</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}