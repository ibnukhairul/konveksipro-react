import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

const getPageTitle = (pathname) => {
  const titles = {
    '/dashboard': 'Dashboard',
    '/stok': 'Kelola Stok',
    '/proyek': 'Manajemen Proyek',
    '/pricelist': 'Price List',
    '/keuangan': 'Rekap Keuangan',
    '/notifikasi': 'Notifikasi',
    '/akun': 'Pengaturan Akun',
    '/team': 'Anggota Tim',
    '/backup': 'Backup & Restore',
    '/admin-pricelist': 'Setting Price List'
  }
  return titles[pathname] || 'KonveksiPro'
}

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const pageTitle = getPageTitle(location.pathname)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setSidebarOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="kpro-app">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div 
        className="sidebar-blue-overlay" 
        style={{ display: sidebarOpen ? 'block' : 'none' }} 
        onClick={() => setSidebarOpen(false)}
      />
      
      <div className="kpro-main">
        <Topbar title={pageTitle} onMenuToggle={() => setSidebarOpen(prev => !prev)} />
        <main className="kpro-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}