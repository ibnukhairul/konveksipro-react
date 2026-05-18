import { useAuth } from '../contexts/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  FolderKanban,
  Tag,
  BarChart3,
  Bell,
  User,
  Users,
  Database,
  Settings,
  LogOut,
  Wallet
} from 'lucide-react'

const MENU_ITEMS = {
  owner: [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roleNote: 'owner' },
    { path: '/stok', label: 'Kelola Stok', icon: Package },
    { path: '/proyek', label: 'Proyek', icon: FolderKanban, roleNote: 'owner' },
    { path: '/pricelist', label: 'Price List', icon: Tag },
    { path: '/keuangan', label: 'Rekap Keuangan', icon: BarChart3, roleNote: 'owner' },
    // Di MENU_ITEMS.owner, tambahkan:
    { path: '/pengeluaran', label: 'Pengeluaran', icon: Wallet, roleNote: 'owner' },
    { path: '/notifikasi', label: 'Notifikasi', icon: Bell },
    { path: '/akun', label: 'Akun', icon: User },
    { path: '/team', label: 'Tim', icon: Users, roleNote: 'owner' },
    { path: '/backup', label: 'Backup & Restore', icon: Database, roleNote: 'owner' },
    { path: '/admin-pricelist', label: 'Pengaturan Price List', icon: Settings, roleNote: 'owner' }
  ],
  team: [
    { path: '/stok', label: 'Kelola Stok', icon: Package },
    { path: '/pricelist', label: 'Price List', icon: Tag },
    { path: '/notifikasi', label: 'Notifikasi', icon: Bell },
    { path: '/akun', label: 'Akun', icon: User },
    { path: '/team', label: 'Tim', icon: Users }
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
    if (window.innerWidth <= 768) onClose()
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <aside className={`sidebar-blue ${isOpen ? 'is-open' : ''}`}>
      <div className="sidebar-blue-logo">
        <div className="sidebar-blue-logo-icon">
          <span>KP</span>
        </div>
        <div>
          <div className="sidebar-blue-logo-name">KonveksiPro</div>
          <div className="sidebar-blue-logo-sub">Management System</div>
        </div>
      </div>

      <nav className="sidebar-blue-nav">
        {menu.map(item => {
          const isActive = location.pathname === item.path
          const Icon = item.icon
          return (
            <div
              key={item.path}
              className={`sidebar-blue-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => handleNavigate(item.path)}
            >
              <div className="sidebar-blue-nav-icon">
                <Icon size={20} strokeWidth={1.75} />
              </div>
              <span className="sidebar-blue-nav-label">{item.label}</span>
              {item.roleNote && <span className="sidebar-blue-nav-badge">{item.roleNote}</span>}
            </div>
          )
        })}
      </nav>

      <div className="sidebar-blue-footer">
        <div className="sidebar-blue-user">
          <div className="sidebar-blue-user-avatar">
            {userInitial}
          </div>
          <div className="sidebar-blue-user-info">
            <div className="sidebar-blue-user-name">{userName}</div>
            <div className="sidebar-blue-user-role">{roleLabel}</div>
          </div>
          <button onClick={handleLogout} className="sidebar-blue-logout-btn" title="Logout">
            <LogOut size={18} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </aside>
  )
}