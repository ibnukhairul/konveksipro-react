import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { pengeluaranService } from '../services/pengeluaranService'
import { useToast } from '../hooks/useToast'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  Search, 
  Filter,
  Calendar,
  Tag,
  FileText,
  DollarSign,
  MoreHorizontal,
  X
} from 'lucide-react'

const KATEGORI = [
  { value: 'Bahan Baku', label: 'Bahan Baku', color: '#3b82f6' },
  { value: 'Sablon', label: 'Sablon', color: '#10b981' },
  { value: 'Ongkos Jahit', label: 'Ongkos Jahit', color: '#f59e0b' },
  { value: 'Packaging', label: 'Packaging', color: '#8b5cf6' },
  { value: 'Transport', label: 'Transport', color: '#ef4444' },
  { value: 'Operasional', label: 'Operasional', color: '#64748b' },
  { value: 'Marketing', label: 'Marketing', color: '#ec4899' },
  { value: 'Lainnya', label: 'Lainnya', color: '#94a3b8' }
]

const formatRupiah = (num) => `Rp ${Math.round(num || 0).toLocaleString('id-ID')}`

export default function PengeluaranPage() {
  const { profile } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [pengeluaran, setPengeluaran] = useState([])
  const [totalPengeluaran, setTotalPengeluaran] = useState(0)
  const [rekapKategori, setRekapKategori] = useState([])
  
  // Filter states
  const [tanggalMulai, setTanggalMulai] = useState('')
  const [tanggalSelesai, setTanggalSelesai] = useState('')
  const [filterKategori, setFilterKategori] = useState('')
  const [search, setSearch] = useState('')
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    kategori: 'Bahan Baku',
    deskripsi: '',
    jumlah: ''
  })
  const [formLoading, setFormLoading] = useState(false)
  
  // 🔥 Popup Aksi states
  const [selectedItem, setSelectedItem] = useState(null)
  const [popupOpen, setPopupOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const isAdmin = profile?.role === 'owner' || profile?.role === 'developer'

  const loadData = async () => {
    setLoading(true)
    try {
      const filters = {}
      if (tanggalMulai && tanggalSelesai) {
        filters.tanggalMulai = tanggalMulai
        filters.tanggalSelesai = tanggalSelesai
      }
      if (filterKategori) filters.kategori = filterKategori
      if (search) filters.search = search
      
      const data = await pengeluaranService.getAll(filters)
      setPengeluaran(data)
      
      const total = data.reduce((sum, item) => sum + (item.jumlah || 0), 0)
      setTotalPengeluaran(total)
      
      const rekap = {}
      for (const item of data) {
        if (!rekap[item.kategori]) rekap[item.kategori] = 0
        rekap[item.kategori] += item.jumlah
      }
      const rekapArray = Object.entries(rekap).map(([kategori, total]) => ({ kategori, total }))
      rekapArray.sort((a, b) => b.total - a.total)
      setRekapKategori(rekapArray)
    } catch (err) {
      toast.error('Gagal memuat data: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) loadData()
  }, [tanggalMulai, tanggalSelesai, filterKategori, search, isAdmin])

  const resetFilters = () => {
    setTanggalMulai('')
    setTanggalSelesai('')
    setFilterKategori('')
    setSearch('')
  }

  const openAddModal = () => {
    setEditingId(null)
    setForm({
      tanggal: new Date().toISOString().split('T')[0],
      kategori: 'Bahan Baku',
      deskripsi: '',
      jumlah: ''
    })
    setModalOpen(true)
  }

  const openEditModal = (item) => {
    setEditingId(item.id)
    setForm({
      tanggal: item.tanggal,
      kategori: item.kategori,
      deskripsi: item.deskripsi || '',
      jumlah: item.jumlah.toString()
    })
    setModalOpen(true)
    setPopupOpen(false)
  }

  const handleSave = async () => {
    if (!form.tanggal) return toast.warning('Tanggal wajib diisi')
    if (!form.kategori) return toast.warning('Kategori wajib diisi')
    if (!form.deskripsi) return toast.warning('Deskripsi wajib diisi')
    if (!form.jumlah || parseInt(form.jumlah) <= 0) return toast.warning('Jumlah harus lebih dari 0')

    setFormLoading(true)
    try {
      const payload = {
        tanggal: form.tanggal,
        kategori: form.kategori,
        deskripsi: form.deskripsi,
        jumlah: parseInt(form.jumlah)
      }
      
      if (editingId) {
        await pengeluaranService.update(editingId, payload)
        toast.success('Pengeluaran berhasil diupdate')
      } else {
        await pengeluaranService.create(payload, profile.id)
        toast.success('Pengeluaran berhasil ditambahkan')
      }
      
      setModalOpen(false)
      loadData()
    } catch (err) {
      toast.error('Gagal menyimpan: ' + err.message)
    } finally {
      setFormLoading(false)
    }
  }

  // 🔥 Handle delete dari popup
  const handleDelete = async () => {
    if (!selectedItem) return
    if (!window.confirm(`Hapus pengeluaran "${selectedItem.deskripsi}"?`)) return
    
    setSubmitting(true)
    try {
      await pengeluaranService.delete(selectedItem.id)
      toast.success('Pengeluaran dihapus')
      setPopupOpen(false)
      setSelectedItem(null)
      loadData()
    } catch (err) {
      toast.error('Gagal hapus: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // 🔥 Buka popup aksi saat row diklik
  const handleRowClick = (item) => {
    setSelectedItem(item)
    setPopupOpen(true)
  }

  const handleExport = async () => {
    try {
      const data = await pengeluaranService.getAll({})
      alert('Fitur export akan segera hadir')
    } catch (err) {
      toast.error('Gagal export: ' + err.message)
    }
  }

  const getKategoriLabel = (kategori) => {
    const found = KATEGORI.find(k => k.value === kategori)
    return found ? found.label : kategori
  }

  const getKategoriColor = (kategori) => {
    const found = KATEGORI.find(k => k.value === kategori)
    return found?.color || '#94a3b8'
  }

  if (!isAdmin) {
    return (
      <div className="pengeluaran-page">
        <div className="pengeluaran-header">
          <h1 className="pengeluaran-title">Manajemen Pengeluaran</h1>
        </div>
        <div className="pengeluaran-card">
          <div className="pengeluaran-empty">
            <div className="pengeluaran-empty-icon">🔒</div>
            <div className="pengeluaran-empty-title">Akses Ditolak</div>
            <div className="pengeluaran-empty-desc">Halaman ini hanya untuk Owner dan Developer</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pengeluaran-page">
      <div className="pengeluaran-header">
        <div>
          <h1 className="pengeluaran-title">Manajemen Pengeluaran</h1>
          <p className="pengeluaran-subtitle">Catat semua belanja, biaya produksi, dan operasional</p>
        </div>
        <div className="pengeluaran-actions">
          <button className="pengeluaran-add-btn" onClick={openAddModal}>
            <Plus size={16} />
            Tambah Pengeluaran
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="pengeluaran-stats">
        <div className="pengeluaran-stat-card">
          <div className="pengeluaran-stat-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}>
            <DollarSign size={22} />
          </div>
          <div className="pengeluaran-stat-content">
            <span className="pengeluaran-stat-title">Total Pengeluaran</span>
            <span className="pengeluaran-stat-value">{formatRupiah(totalPengeluaran)}</span>
            <span className="pengeluaran-stat-change">{pengeluaran.length} transaksi</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="pengeluaran-filter-bar">
        <div className="pengeluaran-filter-group">
          <Calendar size={16} />
          <input 
            type="date" 
            className="pengeluaran-filter-input"
            value={tanggalMulai}
            onChange={(e) => setTanggalMulai(e.target.value)}
            placeholder="Dari tanggal"
          />
          <span>-</span>
          <input 
            type="date" 
            className="pengeluaran-filter-input"
            value={tanggalSelesai}
            onChange={(e) => setTanggalSelesai(e.target.value)}
            placeholder="Sampai tanggal"
          />
        </div>
        
        <div className="pengeluaran-filter-group">
          <Tag size={16} />
          <select 
            className="pengeluaran-filter-select"
            value={filterKategori}
            onChange={(e) => setFilterKategori(e.target.value)}
          >
            <option value="">Semua Kategori</option>
            {KATEGORI.map(k => (
              <option key={k.value} value={k.value}>{k.label}</option>
            ))}
          </select>
        </div>
        
        <div className="pengeluaran-filter-group">
          <Search size={16} />
          <input 
            type="text" 
            className="pengeluaran-filter-input"
            placeholder="Cari deskripsi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <button className="pengeluaran-filter-reset" onClick={resetFilters}>
          Reset
        </button>
      </div>

      {/* Tabel Pengeluaran - dengan row click */}
      <div className="pengeluaran-card">
        <div className="pengeluaran-table-wrapper">
          <table className="pengeluaran-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Kategori</th>
                <th>Deskripsi</th>
                <th>Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" className="pengeluaran-table-loading">Memuat data...</td></tr>
              ) : pengeluaran.length === 0 ? (
                <tr><td colSpan="4" className="pengeluaran-table-empty">Belum ada data pengeluaran</td></tr>
              ) : (
                pengeluaran.map(item => (
                  <tr 
                    key={item.id} 
                    className="pengeluaran-table-row"
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleRowClick(item)}
                  >
                    <td className="pengeluaran-tanggal">{new Date(item.tanggal).toLocaleDateString('id-ID')}</td>
                    <td>
                      <span 
                        className="pengeluaran-badge" 
                        style={{ 
                          backgroundColor: getKategoriColor(item.kategori) + '20', 
                          color: getKategoriColor(item.kategori) 
                        }}
                      >
                        {getKategoriLabel(item.kategori)}
                      </span>
                    </td>
                    <td className="pengeluaran-deskripsi">{item.deskripsi}</td>
                    <td className="pengeluaran-jumlah">{formatRupiah(item.jumlah)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🔥 Modal Popup Aksi */}
      {popupOpen && selectedItem && (
        <div className="kpro-modal-overlay is-open" onClick={() => setPopupOpen(false)}>
          <div className="kpro-modal" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="kpro-modal-header" style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' }}>
              <h3 className="kpro-modal-title" style={{ color: 'white' }}>⚡ Aksi Pengeluaran</h3>
              <button className="kpro-modal-close" onClick={() => setPopupOpen(false)} style={{ color: 'white' }}>
                <X size={18} />
              </button>
            </div>
            <div className="kpro-modal-body" style={{ padding: '24px' }}>
              <div style={{ background: '#F8FAFC', borderRadius: '16px', padding: '16px', marginBottom: '24px' }}>
                <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '4px' }}>
                  {selectedItem.deskripsi}
                </div>
                <div style={{ fontSize: '13px', color: '#64748B', marginBottom: '8px' }}>
                  {getKategoriLabel(selectedItem.kategori)}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid #E2E8F0' }}>
                  <span>Tanggal:</span>
                  <span style={{ fontWeight: 600 }}>{new Date(selectedItem.tanggal).toLocaleDateString('id-ID')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                  <span>Jumlah:</span>
                  <span style={{ fontWeight: 700, color: '#ef4444' }}>{formatRupiah(selectedItem.jumlah)}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button 
                  className="kpro-btn" 
                  style={{ background: '#7C3AED', color: 'white', padding: '14px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} 
                  onClick={() => openEditModal(selectedItem)}
                >
                  <Edit size={16} />
                  Edit Pengeluaran
                </button>
                <button 
                  className="kpro-btn" 
                  style={{ background: '#EF4444', color: 'white', padding: '14px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} 
                  onClick={handleDelete}
                  disabled={submitting}
                >
                  <Trash2 size={16} />
                  {submitting ? 'Menghapus...' : 'Hapus Pengeluaran'}
                </button>
              </div>
            </div>
            <div className="kpro-modal-footer" style={{ justifyContent: 'center' }}>
              <button className="kpro-btn kpro-btn-secondary" onClick={() => setPopupOpen(false)} style={{ width: '100%' }}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah/Edit */}
      {modalOpen && (
        <div className="pengeluaran-modal-overlay" onClick={() => !formLoading && setModalOpen(false)}>
          <div className="pengeluaran-modal" onClick={e => e.stopPropagation()}>
            <div className="pengeluaran-modal-header">
              <h3>{editingId ? 'Edit Pengeluaran' : 'Tambah Pengeluaran'}</h3>
              <button className="pengeluaran-modal-close" onClick={() => !formLoading && setModalOpen(false)} disabled={formLoading}>✕</button>
            </div>
            <div className="pengeluaran-modal-body">
              <div className="pengeluaran-form-group">
                <label>Tanggal</label>
                <input 
                  type="date" 
                  className="pengeluaran-form-input"
                  value={form.tanggal}
                  onChange={(e) => setForm({...form, tanggal: e.target.value})}
                  disabled={formLoading}
                />
              </div>
              <div className="pengeluaran-form-group">
                <label>Kategori</label>
                <select 
                  className="pengeluaran-form-select"
                  value={form.kategori}
                  onChange={(e) => setForm({...form, kategori: e.target.value})}
                  disabled={formLoading}
                >
                  {KATEGORI.map(k => (
                    <option key={k.value} value={k.value}>{k.label}</option>
                  ))}
                </select>
              </div>
              <div className="pengeluaran-form-group">
                <label>Deskripsi</label>
                <input 
                  type="text" 
                  className="pengeluaran-form-input"
                  placeholder="Contoh: Beli kain katun 50 yard"
                  value={form.deskripsi}
                  onChange={(e) => setForm({...form, deskripsi: e.target.value})}
                  disabled={formLoading}
                />
              </div>
              <div className="pengeluaran-form-group">
                <label>Jumlah (Rp)</label>
                <input 
                  type="number" 
                  className="pengeluaran-form-input"
                  placeholder="0"
                  value={form.jumlah}
                  onChange={(e) => setForm({...form, jumlah: e.target.value})}
                  disabled={formLoading}
                />
              </div>
            </div>
            <div className="pengeluaran-modal-footer">
              <button className="pengeluaran-modal-cancel" onClick={() => !formLoading && setModalOpen(false)} disabled={formLoading}>Batal</button>
              <button className="pengeluaran-modal-save" onClick={handleSave} disabled={formLoading}>
                {formLoading ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}