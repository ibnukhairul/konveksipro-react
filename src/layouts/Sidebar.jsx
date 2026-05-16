import { useAuth } from '../contexts/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'

const MENU_ITEMS = {
  owner: [
    { path: '/dashboard', label: 'Dashboard', icon: '⊞', roleNote: 'owner' },
    { path: '/stok', label: 'Kelola Stok', icon: '◫' },
    { path: '/proyek', label: 'Proyek', icon: '◈', roleNote: 'owner' },
    { path: '/pricelist', label: 'Price List', icon: '💰' },
    { path: '/keuangan', label: 'Rekap Keuangan', icon: '◑', roleNote: 'owner' },
    { path: '/notifikasi', label: 'Notifikasi', icon: '◍' },
    { path: '/akun', label: 'Akun', icon: '◯' },
    { path: '/team', label: 'Tim', icon: '👥', roleNote: 'owner' },
    { path: '/backup', label: 'Backup & Restore', icon: '💾', roleNote: 'owner' },
    { path: '/admin-pricelist', label: 'Pengaturan Price List', icon: '⚙️', roleNote: 'owner' }
  ],
  team: [
    { path: '/stok', label: 'Kelola Stok', icon: '◫' },
    { path: '/pricelist', label: 'Price List', icon: '💰' },
    { path: '/notifikasi', label: 'Notifikasi', icon: '◍' },
    { path: '/akun', label: 'Akun', icon: '◯' },
    { path: '/team', label: 'Tim', icon: '👥' }
  ]
}

export default function Sidebar({ isOpen, onClose }) {
  const { profile, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const role = profile?.role === 'owner' || profile?.role === 'developer' ? 'owner' : 'team'
  const menu = MENU_ITEMS[role]
  const userName = profile?.nama_lengkap || profile?.email?.split('@')[0] || 'User'
  const userInitial = userName.charAt(0).toUpperCase()
  const roleLabel = role === 'owner' ? 'Owner' : 'Team'

  const handleNavigate = (path) => {
    navigate(path)
    if (window.innerWidth <= 768) onClose()  // tutup sidebar di mobile
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <aside className={`kpro-sidebar ${isOpen ? 'is-open' : ''}`}>
      <div className="kpro-sidebar-logo">
        <div className="kpro-sidebar-logo-icon">KP</div>
        <div>
          <div className="kpro-sidebar-logo-name">KonveksiPro</div>
          <div className="kpro-sidebar-logo-sub">Management System</div>
        </div>
      </div>

      <nav className="kpro-sidebar-body">
        <div className="kpro-sidebar-section">Utama</div>
        {menu.map(item => (
          <div
            key={item.path}
            className={`kpro-nav-item ${location.pathname === item.path ? 'is-active' : ''}`}
            onClick={() => handleNavigate(item.path)}
          >
            <i className="kpro-nav-icon">{item.icon}</i>
            {item.label}
            {item.roleNote && <span style={{ fontSize: '9px', marginLeft: 'auto' }}>{item.roleNote}</span>}
          </div>
        ))}
      </nav>

      <div className="kpro-sidebar-footer">
        <div className="kpro-avatar kpro-avatar-md kpro-avatar-blue">{userInitial}</div>
        <div>
          <div className="kpro-sidebar-user-name">{userName}</div>
          <div className="kpro-sidebar-user-role">{roleLabel}</div>
        </div>
        <button onClick={handleLogout} className="kpro-btn kpro-btn-ghost kpro-btn-sm kpro-ml-auto" style={{ fontSize: '11px' }}>
          ⏻ Logout
        </button>
      </div>
    </aside>
  )
}