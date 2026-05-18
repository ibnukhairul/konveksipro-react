import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import DashboardLayout from './layouts/DashboardLayout'
import PriceListPage from './pages/PriceListPage'  
import StokPage from './pages/StokPage'
import ProyekPage from './pages/ProyekPage'
import KeuanganPage from './pages/KeuanganPage'
import NotifikasiPage from './pages/NotifikasiPage'
import AkunPage from './pages/AkunPage'
import TeamPage from './pages/TeamPage'
import BakupPage from './pages/BackupPage'
import AdminPriceListPage from './pages/AdminPriceListPage'
import DashboardPage from './pages/DashboardPage'
import './styles/login.css'
import './styles/pengeluaran.css'
import ResetPasswordPage from './pages/ResetPasswordPage'
import PengeluaranPage from './pages/PengeluaranPage'

// Placeholder halaman lainnya (tidak termasuk PriceListPage)
// const DashboardPage = () => <div className="kpro-card"><div className="kpro-card-body">Dashboard Page</div></div>
// const StokPage = () => <div className="kpro-card"><div className="kpro-card-body">Stok Page</div></div>
// const ProyekPage = () => <div className="kpro-card"><div className="kpro-card-body">Proyek Page</div></div>
// const PriceListPage = ...   // ← SUDAH DIHAPUS
// const KeuanganPage = () => <div className="kpro-card"><div className="kpro-card-body">Keuangan Page</div></div>
// const NotifikasiPage = () => <div className="kpro-card"><div className="kpro-card-body">Notifikasi Page</div></div>
// const AkunPage = () => <div className="kpro-card"><div className="kpro-card-body">Akun Page</div></div>
// const TeamPage = () => <div className="kpro-card"><div className="kpro-card-body">Team Page</div></div>
// const BackupPage = () => <div className="kpro-card"><div className="kpro-card-body">Backup Page</div></div>
// const AdminPriceListPage = () => <div className="kpro-card"><div className="kpro-card-body">Admin PriceList Page</div></div>

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <div className="kpro-empty">Memuat...</div>
  if (!user) return <Navigate to="/login" />
  return children
}

function AppRoutes() {
  const { profile } = useAuth()
  const role = profile?.role || 'team'

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to={role === 'team' ? '/stok' : '/dashboard'} />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="stok" element={<StokPage />} />
        <Route path="proyek" element={<ProyekPage />} />
        <Route path="pricelist" element={<PriceListPage />} />   {/* ✅ menggunakan komponen asli */}
        <Route path="keuangan" element={<KeuanganPage />} />
        <Route path="notifikasi" element={<NotifikasiPage />} />
        <Route path="akun" element={<AkunPage />} />
        <Route path="team" element={<TeamPage />} />
        <Route path="backup" element={<BakupPage />} />
        <Route path="admin-pricelist" element={<AdminPriceListPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path='pengeluaran' element={<PengeluaranPage/>}/>
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}