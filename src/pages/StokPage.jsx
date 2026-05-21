import { useState, useEffect } from 'react'
import { useStok } from '../hooks/useStok'
import StokTable from '../components/stok/StokTable'
import { stokService } from '../services/stokService'
import { useToast } from '../hooks/useToast'
import { Search } from 'lucide-react'

export default function StokPage() {
  const { stok, loading, refresh, search, sortField, sortOrder, handleSort } = useStok()
  const toast = useToast()
  const [modalTambahBaru, setModalTambahBaru] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [form, setForm] = useState({
    nama_bahan: '', kategori: 'Markas Kaos Polos', gramasi: '', size: '',
    satuan: 'PCS', stok_saat_ini: 0, min_stok: 10, catatan: ''
  })

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      search(searchKeyword)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchKeyword, search])

  const handleTambahBaru = async () => {
    if (!form.nama_bahan) {
      toast.warning('Nama bahan wajib diisi')
      return
    }
    if (submitting) return
    
    setSubmitting(true)
    try {
      await stokService.tambahBahan(form)
      toast.success('✅ Stok berhasil ditambahkan')
      setModalTambahBaru(false)
      refresh()
      setForm({ nama_bahan: '', kategori: 'Markas Kaos Polos', gramasi: '', size: '', satuan: 'PCS', stok_saat_ini: 0, min_stok: 10, catatan: '' })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="kpro-page-header">
        <div>
          <h2 className="kpro-page-title">Kelola Stok</h2>
          <p className="kpro-page-subtitle">Manajemen stok bahan baku & merchandise</p>
        </div>
        <div className="kpro-page-actions">
          <button className="kpro-btn kpro-btn-primary" onClick={() => setModalTambahBaru(true)} disabled={submitting}>
            {submitting ? 'Memproses...' : '+ Tambah Stok'}
          </button>
        </div>
      </div>

      {/* 🔥 SEARCH BAR - Dipindahkan ke sini (konsisten dengan halaman lain) */}
      <div className="kpro-card kpro-mb-4">
        <div className="kpro-d-flex kpro-justify-between kpro-align-center" style={{ flexWrap: 'wrap', gap: '12px', padding: '16px 20px' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div className="kpro-input-group">
             
              <input
                type="text"
                className="kpro-input"
                placeholder="Cari nama bahan, kategori, gramasi, ukuran..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                style={{  borderRadius: '8px 8px 8px 8px' }}
              />
            </div>
          </div>
          <div>
            <button 
              className="kpro-btn kpro-btn-secondary" 
              onClick={() => {
                // Trigger laporan stok (nanti bisa dipanggil dari sini)
                const stokTableComponent = document.querySelector('.stok-table-ref')
                if (stokTableComponent && stokTableComponent.__triggerReport) {
                  stokTableComponent.__triggerReport()
                } else {
                  toast.info('Fitur laporan stok tersedia di dalam tabel')
                }
              }}
            >
            Laporkan Stok
            </button>
          </div>
        </div>
      </div>

      <div className="kpro-card">
        <StokTable
          stok={stok}
          loading={loading}
          onRefresh={refresh}
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={handleSort}
        />
      </div>

      {/* Modal Tambah Stok Baru */}
      {modalTambahBaru && (
        <div className="kpro-modal-overlay is-open" onClick={() => setModalTambahBaru(false)}>
          <div className="kpro-modal" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="kpro-modal-header">
              <h3>Tambah Stok Baru</h3>
              <button className="kpro-modal-close" onClick={() => setModalTambahBaru(false)}>✕</button>
            </div>
            <div className="kpro-modal-body">
              {/* ... form tambah stok sama seperti sebelumnya ... */}
            </div>
            <div className="kpro-modal-footer">
              <button className="kpro-btn kpro-btn-secondary" onClick={() => setModalTambahBaru(false)} disabled={submitting}>Batal</button>
              <button className="kpro-btn kpro-btn-primary" onClick={handleTambahBaru} disabled={submitting}>
                {submitting ? 'Menyimpan...' : 'Simpan Stok'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}