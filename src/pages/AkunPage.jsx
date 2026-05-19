import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { akunService } from '../services/akunService'

export default function AkunPage() {
  const { user, profile, logout, refreshProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })
  const [form, setForm] = useState({
    nama_lengkap: '',
    no_hp: '',
    alamat: ''
  })
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  })

  // Load data ke form
  useEffect(() => {
    if (profile) {
      setForm({
        nama_lengkap: profile.nama_lengkap || '',
        no_hp: profile.no_hp || '',
        alamat: profile.alamat || ''
      })
    }
  }, [profile])

  const getRoleLabel = (role) => {
    const labels = {
      owner: 'Owner',
      developer: 'Developer',
      team: 'Team'
    }
    return labels[role] || role
  }

  const getRoleClass = (role) => {
    const classes = {
      owner: 'kpro-badge-warning',
      developer: 'kpro-badge-primary',
      team: 'kpro-badge-gray'
    }
    return classes[role] || 'kpro-badge-gray'
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    if (!form.nama_lengkap.trim()) {
      setMessage({ text: 'Nama lengkap wajib diisi', type: 'error' })
      return
    }

    setLoading(true)
    setMessage({ text: '', type: '' })
    try {
      await akunService.updateProfile(user.id, form)
      await refreshProfile()
      setMessage({ text: '✅ Profil berhasil diperbarui', type: 'success' })
    } catch (err) {
      setMessage({ text: '❌ Gagal update profil: ' + err.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    if (!passwordForm.newPassword) {
      setMessage({ text: 'Password baru wajib diisi', type: 'error' })
      return
    }
    if (passwordForm.newPassword.length < 6) {
      setMessage({ text: 'Password minimal 6 karakter', type: 'error' })
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ text: 'Konfirmasi password tidak cocok', type: 'error' })
      return
    }

    setLoading(true)
    setMessage({ text: '', type: '' })
    try {
      await akunService.updatePassword(passwordForm.newPassword)
      setMessage({ text: '✅ Password berhasil diubah', type: 'success' })
      setPasswordForm({ newPassword: '', confirmPassword: '' })
    } catch (err) {
      setMessage({ text: '❌ Gagal ubah password: ' + err.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
  }

  const userInitial = (form.nama_lengkap || user?.email || 'U').charAt(0).toUpperCase()

  return (
    <div>
      <div className="kpro-page-header">
        <div>
          <h2 className="kpro-page-title">Pengaturan Akun</h2>
          <p className="kpro-page-subtitle">Kelola profil dan informasi akun Anda</p>
        </div>
      </div>

      {/* Alert message */}
      {message.text && (
        <div className={`kpro-alert kpro-alert-${message.type === 'success' ? 'success' : 'danger'} kpro-mb-4`}>
          <span className="kpro-alert-icon">{message.type === 'success' ? '✓' : '✕'}</span>
          <div>{message.text}</div>
        </div>
      )}

      <div className="kpro-row">
        {/* Kolom kiri: Profil */}
        <div className="kpro-col-6">
          <div className="kpro-card">
            <div className="kpro-card-header">
              <span className="kpro-card-title">Profil Pengguna</span>
            </div>
            <div className="kpro-card-body">
              <div className="kpro-d-flex kpro-align-center kpro-gap-4 kpro-mb-5">
                <div className="kpro-avatar kpro-avatar-xl kpro-avatar-blue" style={{ fontSize: '28px' }}>
                  {userInitial}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '18px' }}>{form.nama_lengkap || user?.email?.split('@')[0]}</div>
                  <div className="kpro-text-muted kpro-text-sm">{user?.email}</div>
                  <span className={`kpro-badge ${getRoleClass(profile?.role)} kpro-mt-2`} style={{ display: 'inline-block', marginTop: '8px' }}>
                    {getRoleLabel(profile?.role)}
                  </span>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile}>
                <div className="kpro-form-group">
                  <label className="kpro-label kpro-label-required">Nama Lengkap</label>
                  <input
                    type="text"
                    className="kpro-input"
                    value={form.nama_lengkap}
                    onChange={(e) => setForm({ ...form, nama_lengkap: e.target.value })}
                    placeholder="Nama lengkap Anda"
                  />
                </div>
                <div className="kpro-form-group">
                  <label className="kpro-label">Nomor HP / WhatsApp</label>
                  <input
                    type="tel"
                    className="kpro-input"
                    value={form.no_hp}
                    onChange={(e) => setForm({ ...form, no_hp: e.target.value })}
                    placeholder="08123456789"
                  />
                </div>
                <div className="kpro-form-group">
                  <label className="kpro-label">Alamat</label>
                  <textarea
                    className="kpro-textarea"
                    rows="3"
                    value={form.alamat}
                    onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                    placeholder="Alamat lengkap"
                  />
                </div>
                <button type="submit" className="kpro-btn kpro-btn-primary" disabled={loading}>
                  {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Kolom kanan: Keamanan & Logout */}
        <div className="kpro-col-6">
          {/* Keamanan */}
          <div className="kpro-card">
            <div className="kpro-card-header">
              <span className="kpro-card-title">Keamanan Akun</span>
            </div>
            <div className="kpro-card-body">
              <form onSubmit={handleUpdatePassword}>
                <div className="kpro-form-group">
                  <label className="kpro-label">Password Baru</label>
                  <input
                    type="password"
                    className="kpro-input"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="Minimal 6 karakter"
                  />
                </div>
                <div className="kpro-form-group">
                  <label className="kpro-label">Konfirmasi Password Baru</label>
                  <input
                    type="password"
                    className="kpro-input"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="Ketik ulang password baru"
                  />
                </div>
                <button type="submit" className="kpro-btn kpro-btn-outline-primary" disabled={loading}>
                  {loading ? 'Memproses...' : 'Ubah Password'}
                </button>
              </form>
            </div>
          </div>

          {/* Sesi & Logout */}
          <div className="kpro-card kpro-mt-4">
            <div className="kpro-card-header">
              <span className="kpro-card-title">Sesi & Keamanan</span>
            </div>
            <div className="kpro-card-body">
              <button onClick={handleLogout} className="kpro-btn kpro-btn-danger kpro-btn-block">
                ⏻ Logout dari Semua Perangkat
              </button>
              <p className="kpro-form-hint kpro-text-center kpro-mt-3">
                Setelah logout, Anda perlu login kembali untuk mengakses sistem.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}