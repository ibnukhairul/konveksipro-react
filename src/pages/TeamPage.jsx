import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { teamService } from '../services/teamService'
import { useToast } from '../hooks/useToast'

export default function TeamPage() {
  const { user, profile } = useAuth()
  const toast = useToast()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filteredMembers, setFilteredMembers] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)
  const [modalType, setModalType] = useState('') // 'role' or 'status'

  const currentUserRole = profile?.role || 'team'
  const isAdmin = currentUserRole === 'owner' || currentUserRole === 'developer'

  // Load data anggota
  const loadMembers = async () => {
    setLoading(true)
    try {
      const data = await teamService.getAll()
      setMembers(data)
      setFilteredMembers(data)
    } catch (err) {
      toast.error('Gagal memuat data: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMembers()
  }, [])

  // Filter berdasarkan pencarian
  useEffect(() => {
    if (!search.trim()) {
      setFilteredMembers(members)
    } else {
      const lowerSearch = search.toLowerCase()
      const filtered = members.filter(m => 
        (m.nama_lengkap && m.nama_lengkap.toLowerCase().includes(lowerSearch)) ||
        (m.email && m.email.toLowerCase().includes(lowerSearch)) ||
        (m.no_hp && m.no_hp.toLowerCase().includes(lowerSearch))
      )
      setFilteredMembers(filtered)
    }
  }, [search, members])

  // Update role
  const handleUpdateRole = async (userId, newRole) => {
    try {
      await teamService.updateRole(userId, newRole)
      toast.success('Role berhasil diperbarui')
      loadMembers()
      setModalOpen(false)
    } catch (err) {
      toast.error(err.message)
    }
  }

  // Toggle aktif/nonaktif
  const handleToggleActive = async (userId, isActive) => {
    const action = isActive ? 'mengaktifkan' : 'menonaktifkan'
    if (!window.confirm(`Yakin ingin ${action} akun ini?`)) return

    try {
      await teamService.toggleActive(userId, isActive)
      toast.success(`Akun berhasil ${isActive ? 'diaktifkan' : 'dinonaktifkan'}`)
      
      // Jika menonaktifkan akun sendiri, logout
      if (!isActive && userId === user?.id) {
        toast.warning('Akun Anda dinonaktifkan. Akan logout...')
        setTimeout(() => {
          window.location.href = '/login'
        }, 2000)
      }
      loadMembers()
      setModalOpen(false)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const getRoleLabel = (role) => {
    const labels = {
      owner: '👑 Owner',
      developer: '💻 Developer',
      team: '👥 Team'
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

  const getStatusBadge = (isActive) => {
    if (isActive === false) {
      return <span className="kpro-badge kpro-badge-danger">Nonaktif</span>
    }
    return <span className="kpro-badge kpro-badge-success">Aktif</span>
  }

  const openRoleModal = (member) => {
    setSelectedMember(member)
    setModalType('role')
    setModalOpen(true)
  }

  const openStatusModal = (member) => {
    setSelectedMember(member)
    setModalType('status')
    setModalOpen(true)
  }

  if (loading) {
    return (
      <div>
        <div className="kpro-page-header">
          <div><h2 className="kpro-page-title">👥 Anggota Tim</h2><p className="kpro-page-subtitle">Daftar semua anggota yang terdaftar</p></div>
        </div>
        <div className="kpro-card">
          <div className="kpro-empty">🔄 Memuat data anggota...</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="kpro-page-header">
        <div>
          <h2 className="kpro-page-title">👥 Anggota Tim</h2>
          <p className="kpro-page-subtitle">
            {members.length} anggota terdaftar
            {!isAdmin && ' (Anda hanya bisa melihat)'}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="kpro-card kpro-mb-4">
        <div className="kpro-d-flex kpro-justify-between kpro-align-center" style={{ flexWrap: 'wrap', gap: '12px', padding: '16px 20px' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div className="kpro-input-group">
              <span className="kpro-input-addon">🔍</span>
              <input
                type="text"
                className="kpro-input"
                placeholder="Cari nama, email, atau nomor HP..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ borderLeft: 'none', borderRadius: '0 8px 8px 0' }}
              />
            </div>
          </div>
          <div>
            <span className="kpro-badge kpro-badge-info">Total: {members.length} anggota</span>
          </div>
        </div>
      </div>

      {/* Tabel Anggota */}
      <div className="kpro-card">
        <div className="kpro-table-wrap">
          <table className="kpro-table" id="team-table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Email</th>
                <th>No. HP</th>
                <th>Alamat</th>
                <th>Role</th>
                <th>Status</th>
                {isAdmin && <th>Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length === 0 ? (
                <tr><td colSpan={isAdmin ? 7 : 6} style={{ textAlign: 'center', padding: '40px' }}>
                  Tidak ada anggota yang ditemukan
                </td></tr>
              ) : (
                filteredMembers.map(member => {
                  const isCurrentUser = member.id === user?.id
                  return (
                    <tr key={member.id} className={isCurrentUser ? 'team-current-user' : ''}>
                      <td>
                        <div className="team-user-info">
                          <div className="team-user-avatar">
                            {(member.nama_lengkap || member.email || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div className="team-user-name">
                            {member.nama_lengkap || '-'}
                            {isCurrentUser && <span className="kpro-badge kpro-badge-primary" style={{ marginLeft: '8px', fontSize: '10px' }}>Anda</span>}
                          </div>
                        </div>
                      </td>
                      <td>{member.email || '-'}</td>
                      <td>{member.no_hp || '-'}</td>
                      <td style={{ maxWidth: '200px' }}>{member.alamat || '-'}</td>
                      <td>
                        <span className={`kpro-badge ${getRoleClass(member.role)}`}>
                          {getRoleLabel(member.role)}
                        </span>
                      </td>
                      <td>{getStatusBadge(member.is_active)}</td>
                      {isAdmin && (
                        <td>
                          <div className="kpro-d-flex kpro-gap-2" style={{ gap: '8px' }}>
                            <button
                              className="kpro-btn kpro-btn-sm kpro-btn-outline-primary"
                              onClick={() => openRoleModal(member)}
                              disabled={member.role === 'owner' && !isCurrentUser}
                              title={member.role === 'owner' && !isCurrentUser ? 'Tidak bisa mengubah role Owner lain' : ''}
                            >
                              🔄 Role
                            </button>
                            <button
                              className={`kpro-btn kpro-btn-sm ${member.is_active !== false ? 'kpro-btn-warning' : 'kpro-btn-success'}`}
                              onClick={() => openStatusModal(member)}
                              disabled={member.role === 'owner' && !isCurrentUser}
                            >
                              {member.is_active !== false ? '🔒 Nonaktifkan' : '✅ Aktifkan'}
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Ganti Role */}
      {modalOpen && modalType === 'role' && selectedMember && (
        <div className="kpro-modal-overlay is-open" onClick={() => setModalOpen(false)}>
          <div className="kpro-modal" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="kpro-modal-header">
              <h3>Ubah Role</h3>
              <button className="kpro-modal-close" onClick={() => setModalOpen(false)}>✕</button>
            </div>
            <div className="kpro-modal-body">
              <p>Ubah role untuk <strong>{selectedMember.nama_lengkap || selectedMember.email}</strong></p>
              <div className="kpro-form-group kpro-mt-4">
                <label className="kpro-label">Role Baru</label>
                <select
                  className="kpro-select"
                  defaultValue={selectedMember.role}
                  onChange={(e) => handleUpdateRole(selectedMember.id, e.target.value)}
                >
                  <option value="owner">👑 Owner</option>
                  <option value="developer">💻 Developer</option>
                  <option value="team">👥 Team</option>
                </select>
              </div>
            </div>
            <div className="kpro-modal-footer">
              <button className="kpro-btn kpro-btn-secondary" onClick={() => setModalOpen(false)}>Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Aktif/Nonaktif */}
      {modalOpen && modalType === 'status' && selectedMember && (
        <div className="kpro-modal-overlay is-open" onClick={() => setModalOpen(false)}>
          <div className="kpro-modal" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="kpro-modal-header">
              <h3>Konfirmasi</h3>
              <button className="kpro-modal-close" onClick={() => setModalOpen(false)}>✕</button>
            </div>
            <div className="kpro-modal-body">
              <p>
                Apakah Anda yakin ingin <strong>{selectedMember.is_active !== false ? 'menonaktifkan' : 'mengaktifkan'}</strong> 
                akun <strong>{selectedMember.nama_lengkap || selectedMember.email}</strong>?
              </p>
              {selectedMember.is_active !== false && (
                <div className="kpro-alert kpro-alert-warning kpro-mt-3">
                  <span className="kpro-alert-icon">⚠</span>
                  <div>User tidak akan bisa login setelah dinonaktifkan.</div>
                </div>
              )}
            </div>
            <div className="kpro-modal-footer">
              <button className="kpro-btn kpro-btn-secondary" onClick={() => setModalOpen(false)}>Batal</button>
              <button
                className={`kpro-btn ${selectedMember.is_active !== false ? 'kpro-btn-danger' : 'kpro-btn-success'}`}
                onClick={() => handleToggleActive(selectedMember.id, selectedMember.is_active === false)}
              >
                {selectedMember.is_active !== false ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .team-user-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .team-user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--kpro-primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
        }
        .team-user-name {
          font-weight: 600;
          font-size: 14px;
        }
        .team-current-user {
          background: #EFF6FF;
        }
        @media (max-width: 768px) {
          .team-user-info {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  )
}