import { useState, useEffect } from 'react'
import { useProyek } from '../hooks/useProyek'
import ProyekTable from '../components/proyek/ProyekTable'
import { proyekService } from '../services/proyekService'
import { exportService } from '../services/exportService'
import { useToast } from '../hooks/useToast'
import {
 
  Download
  
} from 'lucide-react'
import { Chart, registerables } from 'chart.js'

const formatRupiah = (num) => `Rp ${Math.round(num || 0).toLocaleString('id-ID')}`

export default function ProyekPage() {
  const { proyek, loading, refresh, setSearch, setStatusBayar, setStatusProduksi, resetFilters, sortField, sortOrder, sort } = useProyek()
  const toast = useToast()
  const [modalTambah, setModalTambah] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [submitting, setSubmitting] = useState(false) // 🔥 Cegah spam klik tambah proyek
  const [form, setForm] = useState({
    nama_client: '', no_wa: '', tanggal_order: new Date().toISOString().split('T')[0],
    sumber_info: '', instansi: '', organisasi: '', jabatan: '',
    nama_proyek: '', brand: 'SERAGAMAN', status_bayar: 'belum_dp', catatan: ''
  })
  const [produkList, setProdukList] = useState([{ id: Date.now(), nama_produk: '', jumlah_pcs: 0, harga_satuan: 0, subtotal: 0 }])
  const [dpDibayar, setDpDibayar] = useState(0)

  // 🔥 UPDATE BRAND SEMUA PRODUK SAAT FORM BRAND BERUBAH
  useEffect(() => {
    setProdukList(prev => prev.map(p => ({ ...p, brand: form.brand })))
  }, [form.brand])

  const hitungTotalHarga = (list) => list.reduce((sum, p) => sum + (p.jumlah_pcs * p.harga_satuan), 0)

  const getStatusBayarFromDp = (dp, total) => {
    if (total === 0) return 'belum_dp'
    const percent = Math.round((dp / total) * 100)
    if (percent === 0) return 'belum_dp'
    if (percent === 100) return 'lunas'
    return `dp_${percent}`
  }

  const handleDpChange = (value) => {
    const dp = parseInt(value) || 0
    const total = hitungTotalHarga(produkList)
    const newStatus = getStatusBayarFromDp(dp, total)
    setDpDibayar(dp)
    setForm(prev => ({ ...prev, status_bayar: newStatus }))
  }

  const handleStatusBayarChange = (selectedStatus) => {
    const total = hitungTotalHarga(produkList)
    let dp = 0
    if (selectedStatus === 'lunas') dp = total
    else if (selectedStatus === 'dp_50') dp = Math.round(total * 0.5)
    else if (selectedStatus === 'dp_30') dp = Math.round(total * 0.3)
    else if (selectedStatus === 'belum_dp') dp = 0
    else if (selectedStatus.startsWith('dp_')) {
      const percent = parseInt(selectedStatus.split('_')[1])
      dp = Math.round(total * percent / 100)
    }
    setDpDibayar(dp)
    setForm(prev => ({ ...prev, status_bayar: selectedStatus }))
  }

  const updateProduk = (idx, field, value) => {
    const newList = [...produkList]
    if (field === 'jumlah_pcs' || field === 'harga_satuan') {
      newList[idx][field] = parseInt(value) || 0
      newList[idx].subtotal = newList[idx].jumlah_pcs * newList[idx].harga_satuan
    } else {
      newList[idx][field] = value
    }
    setProdukList(newList)
    const totalBaru = hitungTotalHarga(newList)
    if (dpDibayar > 0) {
      const newStatus = getStatusBayarFromDp(dpDibayar, totalBaru)
      setForm(prev => ({ ...prev, status_bayar: newStatus }))
    }
  }

  const handleExportExcel = async () => {
    if (proyek.length === 0) {
      toast.warning('Tidak ada data proyek untuk diexport')
      return
    }
    if (exporting) return // 🔥 Cegah spam klik export
    
    setExporting(true)
    try {
      const allProyek = await proyekService.getAll({})
      exportService.exportProyekToExcel(allProyek, 'laporan_proyek')
      toast.success(`Berhasil mengeksport ${allProyek.length} data proyek`)
    } catch (err) {
      toast.error('Gagal export: ' + err.message)
    } finally {
      setExporting(false)
    }
  }

  const resetForm = () => {
    setForm({
      nama_client: '',
      no_wa: '',
      tanggal_order: new Date().toISOString().split('T')[0],
      sumber_info: '',
      instansi: '',
      organisasi: '',
      jabatan: '',
      nama_proyek: '',
      brand: 'SERAGAMAN',
      status_bayar: 'belum_dp',
      catatan: ''
    })
    setProdukList([{ id: Date.now(), nama_produk: '', jumlah_pcs: 0, harga_satuan: 0, subtotal: 0 }])
    setDpDibayar(0)
  }

  const tambahProduk = () => {
    setProdukList([...produkList, { id: Date.now(), nama_produk: '', jumlah_pcs: 0, harga_satuan: 0, subtotal: 0 }])
  }

  const hapusProduk = (idx) => {
    if (produkList.length === 1) return toast.warning('Minimal 1 produk')
    const newList = produkList.filter((_, i) => i !== idx)
    setProdukList(newList)
    const totalBaru = hitungTotalHarga(newList)
    if (dpDibayar > 0) {
      const newStatus = getStatusBayarFromDp(dpDibayar, totalBaru)
      setForm(prev => ({ ...prev, status_bayar: newStatus }))
    }
  }

  // 🔥 PERBAIKI: handleSimpan dengan cegah spam klik
  const handleSimpan = async () => {
    if (!form.nama_client) return toast.warning('Nama client wajib diisi')
    if (!form.nama_proyek) return toast.warning('Nama proyek wajib diisi')
    if (produkList.some(p => !p.nama_produk || p.jumlah_pcs <= 0 || p.harga_satuan <= 0)) {
      return toast.warning('Semua produk harus diisi lengkap dengan jumlah dan harga > 0')
    }
    if (submitting) return // 🔥 Cegah spam klik

    const totalHarga = hitungTotalHarga(produkList)
    let statusBayar = form.status_bayar
    if (dpDibayar >= totalHarga) statusBayar = 'lunas'
    else if (dpDibayar >= totalHarga * 0.5) statusBayar = 'dp_50'
    else if (dpDibayar >= totalHarga * 0.3) statusBayar = 'dp_30'
    else statusBayar = 'belum_dp'

    const notaNumber = `INV-${Date.now()}`

    setSubmitting(true)
    try {
      await proyekService.buat({
        ...form,
        total_harga: totalHarga,
        dp_dibayar: dpDibayar,
        status_bayar: statusBayar,
        nota_number: notaNumber,
        brand: form.brand
      }, produkList.map(p => ({
        nama_produk: p.nama_produk,
        jumlah_pcs: p.jumlah_pcs,
        harga_satuan: p.harga_satuan
      })))

      toast.success('Proyek berhasil ditambahkan')
      setModalTambah(false)
      refresh()
      resetForm()
    } catch (err) {
      toast.error('Gagal simpan: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="kpro-page-header">
        <div><h2 className="kpro-page-title">Manajemen Proyek</h2><p className="kpro-page-subtitle">Semua order & pesanan client</p></div>
        <div className="kpro-page-actions">
          <button 
            className="keu-export-btn" 
            onClick={handleExportExcel} 
            disabled={exporting}
          ><Download size={15} />
            {exporting ? '⏳ Mengexport...' : ' Export ke Excel'}
          </button>
          <button 
            className="kpro-btn kpro-btn-primary" 
            onClick={() => setModalTambah(true)} 
            disabled={submitting}
          >
            {submitting ? 'Memproses...' : '+ Tambah Proyek'}
          </button>
        </div>
      </div>

      {/* Filter Bar - sama seperti sebelumnya */}
      <div className="kpro-card kpro-mb-4">
        <div className="kpro-d-flex kpro-justify-between kpro-align-center" style={{ flexWrap: 'wrap', gap: '12px', padding: '16px 20px' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div className="kpro-input-group">
              
              <input type="text" className="kpro-input" placeholder="Cari client, proyek..." onChange={e => setSearch(e.target.value)} style={{ borderRadius: '8px 8px 8px 8px' }} />
            </div>
          </div>
          <div className="kpro-d-flex kpro-gap-2">
            <select className="kpro-select" onChange={e => setStatusBayar(e.target.value)} style={{ width: '140px' }}>
              <option value="">Semua Pembayaran</option>
              <option value="belum_dp">Belum DP</option>
              <option value="dp_30">DP 30%</option>
              <option value="dp_50">DP 50%</option>
              <option value="lunas">Lunas</option>
            </select>
            <select className="kpro-select" onChange={e => setStatusProduksi(e.target.value)} style={{ width: '140px' }}>
              <option value="">Semua Produksi</option>
              <option value="antri">Antri</option>
              <option value="proses">Proses</option>
              <option value="qc">QC</option>
              <option value="dikirim">Dikirim</option>
              <option value="selesai">Selesai</option>
            </select>
            <button className="kpro-btn kpro-btn-ghost" onClick={resetFilters}>↺ Reset</button>
          </div>
        </div>
      </div>

      {/* Tabel Proyek */}
      <div className="kpro-card">
        <ProyekTable proyek={proyek} loading={loading} onRefresh={refresh} onSort={sort} sortField={sortField} sortOrder={sortOrder} />
      </div>

      {/* Modal Tambah Proyek - 🔥 dengan disabled button */}
      {modalTambah && (
        <div className="kpro-modal-overlay is-open" onClick={() => !submitting && setModalTambah(false)}>
          <div className="kpro-modal" style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="kpro-modal-header">
              <h3>Tambah Proyek Baru</h3>
              <button className="kpro-modal-close" onClick={() => !submitting && setModalTambah(false)} disabled={submitting}>✕</button>
            </div>
            <div className="kpro-modal-body">
              {/* Client info - semua input disabled saat submitting */}
              <div className="kpro-card kpro-mb-4"><div className="kpro-card-header">👤 Informasi Client</div><div className="kpro-card-body">
                <div className="kpro-form-group"><label>Nama Client *</label><input className="kpro-input" value={form.nama_client} onChange={e => setForm({ ...form, nama_client: e.target.value })} disabled={submitting} /></div>
                <div className="kpro-form-row"><div className="kpro-form-group"><label>No. WhatsApp</label><input className="kpro-input" value={form.no_wa} onChange={e => setForm({ ...form, no_wa: e.target.value })} disabled={submitting} /></div><div className="kpro-form-group"><label>Tanggal Order</label><input type="date" className="kpro-input" value={form.tanggal_order} onChange={e => setForm({ ...form, tanggal_order: e.target.value })} disabled={submitting} /></div></div>
              </div></div>
              
              {/* Proyek detail */}
              <div className="kpro-card kpro-mb-4"><div className="kpro-card-header">📦 Detail Proyek</div><div className="kpro-card-body">
                <div className="kpro-form-group"><label>Nama Proyek *</label><input className="kpro-input" value={form.nama_proyek} onChange={e => setForm({ ...form, nama_proyek: e.target.value })} disabled={submitting} /></div>
                <div className="kpro-form-group"><label>Brand</label><select className="kpro-select" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} disabled={submitting}>
                  <option>SERAGAMAN</option><option>CLOTHINGWELL</option><option>KAMPUS APPAREL</option>
                </select></div>
              </div></div>
              
              {/* Daftar Produk */}
              <div className="kpro-card kpro-mb-4"><div className="kpro-card-header">🛍️ Daftar Produk</div><div className="kpro-card-body">
                {produkList.map((p, idx) => (
                  <div key={p.id} style={{ background: '#F8FAFC', borderRadius: '12px', padding: '12px', marginBottom: '12px' }}>
                    <div className="kpro-form-row"><div className="kpro-form-group" style={{ flex: 2 }}><label>Nama Produk</label><input className="kpro-input" value={p.nama_produk} onChange={e => updateProduk(idx, 'nama_produk', e.target.value)} disabled={submitting} /></div></div>
                    <div className="kpro-form-row">
                      <div className="kpro-form-group"><label>Jumlah (pcs)</label><input type="text" inputMode="numeric" className="kpro-input" value={p.jumlah_pcs} onChange={e => updateProduk(idx, 'jumlah_pcs', e.target.value)} disabled={submitting} /></div>
                      <div className="kpro-form-group"><label>Harga Satuan</label><input type="text" inputMode="numeric" className="kpro-input" value={p.harga_satuan} onChange={e => updateProduk(idx, 'harga_satuan', e.target.value)} disabled={submitting} /></div>
                      <div className="kpro-form-group"><label>Subtotal</label><input className="kpro-input" readOnly value={formatRupiah(p.jumlah_pcs * p.harga_satuan)} style={{ background: '#f5f5f5' }} /></div>
                      <div className="kpro-form-group"><button className="kpro-btn kpro-btn-danger kpro-btn-sm" onClick={() => !submitting && hapusProduk(idx)} disabled={submitting}>🗑</button></div>
                    </div>
                  </div>
                ))}
                <button className="kpro-btn kpro-btn-outline-primary kpro-btn-sm" onClick={() => !submitting && tambahProduk()} disabled={submitting}>+ Tambah Produk</button>
              </div></div>
              
              {/* Keuangan */}
              <div className="kpro-card kpro-mb-4"><div className="kpro-card-header">💰 Total & Pembayaran</div><div className="kpro-card-body">
                <div className="kpro-form-group"><label>Total Keseluruhan</label><input className="kpro-input" readOnly value={formatRupiah(hitungTotalHarga(produkList))} style={{ background: '#EFF6FF', fontWeight: 'bold' }} /></div>
                <div className="kpro-form-row">
                  <div className="kpro-form-group"><label>Status Pembayaran</label>
                    <select className="kpro-select" value={form.status_bayar} onChange={e => handleStatusBayarChange(e.target.value)} disabled={submitting}>
                      <option value="belum_dp">Belum DP</option>
                      <option value="dp_30">DP 30%</option>
                      <option value="dp_50">DP 50%</option>
                      <option value="lunas">Lunas</option>
                    </select>
                  </div>
                  <div className="kpro-form-group"><label>DP Dibayar (Rp)</label><input type="text" inputMode="numeric" className="kpro-input" value={dpDibayar} onChange={e => handleDpChange(e.target.value)} disabled={submitting} /></div>
                </div>
              </div></div>
              
              {/* Informasi Tambahan Client */}
              <div className="kpro-card kpro-mb-4"><div className="kpro-card-header">ℹ️ Informasi Tambahan Client</div><div className="kpro-card-body">
                <div className="kpro-form-group"><label>Sumber Info</label><input className="kpro-input" value={form.sumber_info} onChange={e => setForm({ ...form, sumber_info: e.target.value })} disabled={submitting} /></div>
                <div className="kpro-form-row"><div className="kpro-form-group"><label>Instansi</label><input className="kpro-input" value={form.instansi} onChange={e => setForm({ ...form, instansi: e.target.value })} disabled={submitting} /></div><div className="kpro-form-group"><label>Organisasi</label><input className="kpro-input" value={form.organisasi} onChange={e => setForm({ ...form, organisasi: e.target.value })} disabled={submitting} /></div></div>
                <div className="kpro-form-group"><label>Jabatan</label><input className="kpro-input" value={form.jabatan} onChange={e => setForm({ ...form, jabatan: e.target.value })} disabled={submitting} /></div>
                <div className="kpro-form-group"><label>Catatan</label><textarea className="kpro-textarea" rows="2" value={form.catatan} onChange={e => setForm({ ...form, catatan: e.target.value })} disabled={submitting} /></div>
              </div></div>
            </div>
            <div className="kpro-modal-footer">
              <button className="kpro-btn kpro-btn-secondary" onClick={() => !submitting && setModalTambah(false)} disabled={submitting}>Batal</button>
              <button className="kpro-btn kpro-btn-primary" onClick={handleSimpan} disabled={submitting}>
                {submitting ? 'Menyimpan...' : 'Simpan Proyek'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}