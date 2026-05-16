import { useState } from 'react'
import { useStok } from '../hooks/useStok'
import StokTable from '../components/stok/StokTable'
import { stokService } from '../services/stokService'

export default function StokPage() {
  const { stok, loading, refresh, search, sortField, sortOrder, handleSort } = useStok()
  const [modalTambahBaru, setModalTambahBaru] = useState(false)
  const [form, setForm] = useState({
    nama_bahan: '', kategori: 'Markas Kaos Polos', gramasi: '', size: '',
    satuan: 'PCS', stok_saat_ini: 0, min_stok: 10, catatan: ''
  })

  const handleTambahBaru = async () => {
    if (!form.nama_bahan) return alert('Nama bahan wajib diisi')
    try {
      await stokService.tambahBahan(form)
      alert('✅ Stok berhasil ditambahkan')
      setModalTambahBaru(false)
      refresh()
      setForm({ nama_bahan: '', kategori: 'Markas Kaos Polos', gramasi: '', size: '', satuan: 'PCS', stok_saat_ini: 0, min_stok: 10, catatan: '' })
    } catch (err) {
      alert('❌ ' + err.message)
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
          <button className="kpro-btn kpro-btn-primary" onClick={() => setModalTambahBaru(true)}>
            + Tambah Stok
          </button>
        </div>
      </div>

      {/* HANYA SATU StokTable, jangan dobel */}
      <div className="kpro-card">
        <StokTable
          stok={stok}
          loading={loading}
          onRefresh={refresh}
          onSearch={search}
          onSort={handleSort}
          sortField={sortField}
          sortOrder={sortOrder}
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
              <div className="kpro-form-group">
                <label>Nama Bahan <span style={{ color: 'red' }}>*</span></label>
                <input className="kpro-input" value={form.nama_bahan} onChange={e => setForm({...form, nama_bahan: e.target.value})} />
              </div>
              <div className="kpro-form-row">
                <div className="kpro-form-group">
                  <label>Gramasi</label>
                  <input className="kpro-input" value={form.gramasi} onChange={e => setForm({...form, gramasi: e.target.value})} />
                </div>
                <div className="kpro-form-group">
                  <label>Ukuran</label>
                  <input className="kpro-input" value={form.size} onChange={e => setForm({...form, size: e.target.value})} />
                </div>
              </div>
              <div className="kpro-form-row">
                <div className="kpro-form-group">
                  <label>Kategori</label>
                  <select className="kpro-select" value={form.kategori} onChange={e => setForm({...form, kategori: e.target.value})}>
                    <option>Markas Kaos Polos</option>
                    <option>Sisa Projek</option>
                    <option>Merchandise</option>
                    <option>Bonus</option>
                    <option>Lain Lain</option>
                  </select>
                </div>
                <div className="kpro-form-group">
                  <label>Satuan</label>
                  <select className="kpro-select" value={form.satuan} onChange={e => setForm({...form, satuan: e.target.value})}>
                    <option>PCS</option>
                    <option>Meter</option>
                  </select>
                </div>
              </div>
              <div className="kpro-form-row">
                <div className="kpro-form-group">
                  <label>Stok Awal</label>
                  <input type="number" className="kpro-input" value={form.stok_saat_ini} onChange={e => setForm({...form, stok_saat_ini: parseInt(e.target.value) || 0})} />
                </div>
                <div className="kpro-form-group">
                  <label>Min Stok (Peringatan)</label>
                  <input type="number" className="kpro-input" value={form.min_stok} onChange={e => setForm({...form, min_stok: parseInt(e.target.value) || 0})} />
                </div>
              </div>
              <div className="kpro-form-group">
                <label>Catatan</label>
                <input className="kpro-input" value={form.catatan} onChange={e => setForm({...form, catatan: e.target.value})} />
              </div>
            </div>
            <div className="kpro-modal-footer">
              <button className="kpro-btn kpro-btn-secondary" onClick={() => setModalTambahBaru(false)}>Batal</button>
              <button className="kpro-btn kpro-btn-primary" onClick={handleTambahBaru}>Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}