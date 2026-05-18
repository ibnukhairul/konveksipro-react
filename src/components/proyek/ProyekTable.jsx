import { useState } from 'react'
import { proyekService } from '../../services/proyekService'
import { useToast } from '../../hooks/useToast'
import NotaModal from '../NotaModal'

import {
  Eye,
  Printer,
  Trash2,
  X,
  User,
  Phone,
  Calendar,
  Package,
  Tag,
  DollarSign,
  CreditCard,
  Settings,
  Info,
  FileText,
  Save,
  ShoppingBag,
  Plus,
  Building,
  Users,
  Briefcase,
  AlertCircle
} from 'lucide-react'

export default function ProyekTable({ proyek, loading, onRefresh, onSort, sortField, sortOrder }) {
  const toast = useToast()
  const [selectedProyek, setSelectedProyek] = useState(null)
  const [modalAksi, setModalAksi] = useState(false)
  const [modalDetail, setModalDetail] = useState(false)
  const [modalHapus, setModalHapus] = useState(false)
  const [detailData, setDetailData] = useState(null)
  const [formData, setFormData] = useState({})
  const [produkList, setProdukList] = useState([])
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [notaModalOpen, setNotaModalOpen] = useState(false)
  const [selectedProyekForNota, setSelectedProyekForNota] = useState(null)
  const [submittingUpdate, setSubmittingUpdate] = useState(false)
  const [submittingDelete, setSubmittingDelete] = useState(false)

  const formatRupiah = (num) => `Rp ${Math.round(num || 0).toLocaleString('id-ID')}`

  // Format tanggal untuk display
  const formatTanggal = (dateString) => {
    if (!dateString) return '-'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return '-'
      return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
    } catch {
      return '-'
    }
  }

  const handleCetakNota = async () => {
    setModalAksi(false)
    try {
      const detail = await proyekService.getById(selectedProyek.id)
      console.log('📄 Data untuk nota:', { nama: detail.nama_proyek, brand: detail.brand })
      setSelectedProyekForNota(detail)
      setNotaModalOpen(true)
    } catch (err) {
      toast.error('Gagal memuat data nota: ' + err.message)
    }
  }

  const statusBayarBadge = (status) => {
    if (status === 'belum_dp') return <span className="kpro-badge kpro-badge-gray">Belum DP</span>
    if (status === 'lunas') return <span className="kpro-badge kpro-badge-success">Lunas</span>
    if (status === 'dp_30') return <span className="kpro-badge kpro-badge-warning">DP 30%</span>
    if (status === 'dp_50') return <span className="kpro-badge kpro-badge-warning">DP 50%</span>
    if (status && status.startsWith('dp_')) {
      const percent = status.split('_')[1]
      return <span className="kpro-badge kpro-badge-info">DP {percent}%</span>
    }
    return <span className="kpro-badge kpro-badge-gray">{status || 'Belum DP'}</span>
  }

  const statusProduksiBadge = (status) => {
    const badges = {
      antri: <span className="kpro-badge kpro-badge-gray">Antri</span>,
      proses: <span className="kpro-badge kpro-badge-info">Proses</span>,
      qc: <span className="kpro-badge kpro-badge-info">QC</span>,
      dikirim: <span className="kpro-badge kpro-badge-primary">Dikirim</span>,
      selesai: <span className="kpro-badge kpro-badge-success">Selesai</span>
    }
    return badges[status] || status
  }

  const getStatusBayarFromDp = (dp, total) => {
    if (total === 0) return 'belum_dp'
    const percent = Math.round((dp / total) * 100)
    if (percent === 0) return 'belum_dp'
    if (percent === 100) return 'lunas'
    return `dp_${percent}`
  }

  const handleDpChange = (value) => {
    const dp = parseInt(value) || 0
    const total = formData.total_harga || 0
    const newStatus = getStatusBayarFromDp(dp, total)
    setFormData(prev => ({ ...prev, dp_dibayar: dp, sisa_tagihan: total - dp, status_bayar: newStatus }))
  }

  const handleStatusBayarChange = (selectedStatus) => {
    const total = formData.total_harga || 0
    let dp = 0
    if (selectedStatus === 'lunas') dp = total
    else if (selectedStatus === 'dp_50') dp = Math.round(total * 0.5)
    else if (selectedStatus === 'dp_30') dp = Math.round(total * 0.3)
    else if (selectedStatus === 'belum_dp') dp = 0
    else if (selectedStatus.startsWith('dp_')) {
      const percent = parseInt(selectedStatus.split('_')[1])
      dp = Math.round(total * percent / 100)
    }
    setFormData(prev => ({ ...prev, status_bayar: selectedStatus, dp_dibayar: dp, sisa_tagihan: total - dp }))
  }

  const hitungTotalHarga = (list) => {
    const total = list.reduce((sum, p) => sum + (p.jumlah_pcs * p.harga_satuan), 0)
    setFormData(prev => ({ ...prev, total_harga: total, sisa_tagihan: total - (prev.dp_dibayar || 0) }))
    return total
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
    hitungTotalHarga(newList)
  }

  const tambahProduk = () => {
    setProdukList([...produkList, { id: Date.now(), nama_produk: '', jumlah_pcs: 0, harga_satuan: 0, subtotal: 0 }])
  }

  const hapusProduk = (idx) => {
    if (produkList.length === 1) {
      toast.warning('Minimal 1 produk dalam proyek')
      return
    }
    const newList = produkList.filter((_, i) => i !== idx)
    setProdukList(newList)
    hitungTotalHarga(newList)
  }

  const handleDetail = async () => {
    if (!selectedProyek) return
    setModalAksi(false)
    setLoadingDetail(true)
    setModalDetail(true)
    try {
      const data = await proyekService.getById(selectedProyek.id)
      setDetailData(data)
      const produk = data.produk_list || []
      setProdukList(produk)
      const total = produk.reduce((sum, p) => sum + (p.jumlah_pcs * p.harga_satuan), 0)
      setFormData({
        nama_client: data.nama_client || '',
        no_wa: data.no_wa || '',
        tanggal_order: data.tanggal_order || '',
        sumber_info: data.sumber_info || '',
        instansi: data.instansi || '',
        organisasi: data.organisasi || '',
        jabatan: data.jabatan || '',
        nama_proyek: data.nama_proyek || '',
        status_bayar: data.status_bayar || 'belum_dp',
        status_produksi: data.status_produksi || 'antri',
        dp_dibayar: data.dp_dibayar || 0,
        catatan: data.catatan || '',
        brand: data.brand || 'SERAGAMAN',
        total_harga: total,
        sisa_tagihan: total - (data.dp_dibayar || 0)
      })
    } catch (err) {
      toast.error('Gagal memuat detail: ' + err.message)
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleUpdateProyek = async () => {
    if (!formData.nama_client) return toast.warning('Nama client wajib diisi')
    if (!formData.nama_proyek) return toast.warning('Nama proyek wajib diisi')
    if (produkList.length === 0) return toast.warning('Minimal 1 produk')
    const validProduk = produkList.every(p => p.nama_produk && p.jumlah_pcs > 0 && p.harga_satuan > 0)
    if (!validProduk) return toast.warning('Semua produk harus diisi nama, jumlah > 0, dan harga > 0')
    if (submittingUpdate) return

    const totalHarga = hitungTotalHarga(produkList)
    let statusBayar = formData.status_bayar
    const dp = formData.dp_dibayar || 0
    const calculatedStatus = getStatusBayarFromDp(dp, totalHarga)
    if (calculatedStatus !== statusBayar) statusBayar = calculatedStatus

    setSubmittingUpdate(true)
    try {
      await proyekService.update(selectedProyek.id, {
        ...formData,
        total_harga: totalHarga,
        status_bayar: statusBayar
      }, produkList.map(p => ({
        nama_produk: p.nama_produk,
        jumlah_pcs: p.jumlah_pcs,
        harga_satuan: p.harga_satuan,
        keterangan: p.keterangan || ''
      })))
      toast.success('Proyek berhasil diperbarui')
      setModalDetail(false)
      onRefresh()
    } catch (err) {
      toast.error('Gagal update: ' + err.message)
    } finally {
      setSubmittingUpdate(false)
    }
  }

  const handleHapusProyek = async () => {
    if (!selectedProyek) return
    if (submittingDelete) return

    setSubmittingDelete(true)
    try {
      await proyekService.hapus(selectedProyek.id)
      toast.success('Proyek dihapus')
      setModalHapus(false)
      setModalAksi(false)
      onRefresh()
    } catch (err) {
      toast.error('Gagal hapus: ' + err.message)
    } finally {
      setSubmittingDelete(false)
    }
  }

  const handleRowClick = (item) => {
    setSelectedProyek(item)
    setModalAksi(true)
  }

  if (loading) return <div className="kpro-empty">🔄 Memuat data proyek...</div>

  return (
    <>
      <div className="kpro-table-wrap">
        <table className="kpro-table">
          <thead>
            <tr>
              <th style={{ cursor: 'pointer' }} onClick={() => onSort('nama_client')}>
                Client {sortField === 'nama_client' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => onSort('nama_proyek')}>
                Proyek {sortField === 'nama_proyek' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => onSort('tanggal_order')}>
                Tgl Order {sortField === 'tanggal_order' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => onSort('brand')}>
                Brand {sortField === 'brand' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => onSort('total_harga')}>
                Total {sortField === 'total_harga' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => onSort('status_bayar')}>
                Pembayaran {sortField === 'status_bayar' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => onSort('status_produksi')}>
                Produksi {sortField === 'status_produksi' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
            </tr>
          </thead>
          <tbody>
            {proyek.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>Belum ada proyek</td></tr>
            ) : (
              proyek.map(item => (
                <tr key={item.id} style={{ cursor: 'pointer' }} onClick={() => handleRowClick(item)}>
                  <td style={{ fontWeight: 600 }}>{item.nama_client}</td>
                  <td>{item.nama_proyek}</td>
                  <td>{formatTanggal(item.tanggal_order)}</td>
                  <td>{item.brand || 'SERAGAMAN'}</td>
                  <td><strong>{formatRupiah(item.total_harga)}</strong></td>
                  <td>{statusBayarBadge(item.status_bayar)}</td>
                  <td>{statusProduksiBadge(item.status_produksi)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Aksi Proyek - dengan icon lucide-react */}
      {modalAksi && selectedProyek && (
        <div className="kpro-modal-overlay is-open" onClick={() => setModalAksi(false)}>
          <div className="kpro-modal" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="kpro-modal-header" style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)' }}>
              <h3 className="kpro-modal-title" style={{ color: 'white' }}>⚡ Aksi Proyek</h3>
              <button className="kpro-modal-close" onClick={() => setModalAksi(false)} style={{ color: 'white' }}>
                <X size={18} />
              </button>
            </div>
            <div className="kpro-modal-body" style={{ padding: '24px' }}>
              <div style={{ background: '#F8FAFC', borderRadius: '16px', padding: '16px', marginBottom: '24px' }}>
                <div style={{ fontWeight: 700, fontSize: '16px' }}>{selectedProyek.nama_client}</div>
                <div style={{ fontSize: '13px', color: '#64748B' }}>{selectedProyek.nama_proyek}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #E2E8F0' }}>
                  <span>Total: {formatRupiah(selectedProyek.total_harga)}</span>
                  <span>{statusBayarBadge(selectedProyek.status_bayar)}</span>
                  <span>{statusProduksiBadge(selectedProyek.status_produksi)}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  className="kpro-btn"
                  style={{ background: '#7C3AED', color: 'white', padding: '14px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  onClick={handleDetail}
                >
                  <Eye size={16} />
                  Lihat Detail & Edit
                </button>
                <button
                  className="kpro-btn"
                  style={{ background: '#2563EB', color: 'white', padding: '14px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  onClick={handleCetakNota}
                >
                  <Printer size={16} />
                  Cetak Nota
                </button>
                <button
                  className="kpro-btn"
                  style={{ background: '#EF4444', color: 'white', padding: '14px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  onClick={() => { setModalAksi(false); setModalHapus(true); }}
                >
                  <Trash2 size={16} />
                  Hapus Proyek
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Modal Aksi */}
      {modalAksi && selectedProyek && (
        <div className="kpro-modal-overlay is-open" onClick={() => setModalAksi(false)}>
          <div className="kpro-modal" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="kpro-modal-header" style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)' }}>
              <h3 className="kpro-modal-title" style={{ color: 'white' }}>⚡ Aksi Proyek</h3>
              <button className="kpro-modal-close" onClick={() => setModalAksi(false)} style={{ color: 'white' }}>✕</button>
            </div>
            <div className="kpro-modal-body" style={{ padding: '24px' }}>
              <div style={{ background: '#F8FAFC', borderRadius: '16px', padding: '16px', marginBottom: '24px' }}>
                <div style={{ fontWeight: 700, fontSize: '16px' }}>{selectedProyek.nama_client}</div>
                <div style={{ fontSize: '13px', color: '#64748B' }}>{selectedProyek.nama_proyek}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #E2E8F0' }}>
                  <span>Total: {formatRupiah(selectedProyek.total_harga)}</span>
                  <span>{statusBayarBadge(selectedProyek.status_bayar)}</span>
                  <span>{statusProduksiBadge(selectedProyek.status_produksi)}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button className="kpro-btn" style={{ background: '#7C3AED', color: 'white', padding: '14px', borderRadius: '12px' }} onClick={handleDetail}>📋 Lihat Detail & Edit</button>
                <button className="kpro-btn" style={{ background: '#2563EB', color: 'white', padding: '14px', borderRadius: '12px' }} onClick={handleCetakNota}>⎙ Cetak Nota</button>
                <button className="kpro-btn" style={{ background: '#EF4444', color: 'white', padding: '14px', borderRadius: '12px' }} onClick={() => { setModalAksi(false); setModalHapus(true); }}>🗑 Hapus Proyek</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail & Edit Proyek - dengan icon lucide-react */}
      {modalDetail && (
        <div className="kpro-modal-overlay is-open" onClick={() => setModalDetail(false)}>
          <div className="kpro-modal" style={{ maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="kpro-modal-header">
              <h3>📋 Detail & Edit Proyek</h3>
              <button className="kpro-modal-close" onClick={() => setModalDetail(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="kpro-modal-body">
              {loadingDetail ? <div className="kpro-empty">Memuat detail...</div> : (
                <>
                  {/* Informasi Client */}
                  <div className="kpro-card kpro-mb-4">
                    <div className="kpro-card-header">
                      <span className="kpro-card-title">
                        <User size={16} style={{ marginRight: '8px' }} />
                        Informasi Client
                      </span>
                    </div>
                    <div className="kpro-card-body">
                      <div className="kpro-form-row">
                        <div className="kpro-form-group">
                          <label className="kpro-label">Nama Client *</label>
                          <input className="kpro-input" value={formData.nama_client || ''} onChange={e => setFormData({ ...formData, nama_client: e.target.value })} />
                        </div>
                        <div className="kpro-form-group">
                          <label className="kpro-label">
                            <Phone size={12} style={{ marginRight: '4px' }} />
                            No. WhatsApp
                          </label>
                          <input className="kpro-input" value={formData.no_wa || ''} onChange={e => setFormData({ ...formData, no_wa: e.target.value })} />
                        </div>
                      </div>
                      <div className="kpro-form-group">
                        <label className="kpro-label">
                          <Calendar size={12} style={{ marginRight: '4px' }} />
                          Tanggal Order
                        </label>
                        <input type="date" className="kpro-input" value={formData.tanggal_order || ''} onChange={e => setFormData({ ...formData, tanggal_order: e.target.value })} />
                      </div>
                    </div>
                  </div>

                  {/* Detail Proyek */}
                  <div className="kpro-card kpro-mb-4">
                    <div className="kpro-card-header">
                      <span className="kpro-card-title">
                        <Package size={16} style={{ marginRight: '8px' }} />
                        Detail Proyek
                      </span>
                    </div>
                    <div className="kpro-card-body">
                      <div className="kpro-form-group">
                        <label className="kpro-label">Nama Proyek *</label>
                        <input className="kpro-input" value={formData.nama_proyek || ''} onChange={e => setFormData({ ...formData, nama_proyek: e.target.value })} />
                      </div>
                      <div className="kpro-form-group">
                        <label className="kpro-label">
                          <Tag size={12} style={{ marginRight: '4px' }} />
                          Brand
                        </label>
                        <select className="kpro-select" value={formData.brand || 'SERAGAMAN'} onChange={e => setFormData({ ...formData, brand: e.target.value })}>
                          <option value="SERAGAMAN">🏢 SERAGAMAN</option>
                          <option value="CLOTHINGWELL">👕 CLOTHINGWELL</option>
                          <option value="KAMPUS APPAREL">🎓 KAMPUS APPAREL</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Daftar Produk */}
                  <div className="kpro-card kpro-mb-4">
                    <div className="kpro-card-header">
                      <span className="kpro-card-title">
                        <ShoppingBag size={16} style={{ marginRight: '8px' }} />
                        Daftar Produk
                      </span>
                    </div>
                    <div className="kpro-card-body">
                      {produkList.map((p, idx) => (
                        <div key={p.id || idx} style={{ background: '#F8FAFC', borderRadius: '12px', padding: '12px', marginBottom: '12px' }}>
                          <div className="kpro-form-row">
                            <div className="kpro-form-group" style={{ flex: 2 }}>
                              <label className="kpro-label">Nama Produk</label>
                              <input className="kpro-input" value={p.nama_produk} onChange={e => updateProduk(idx, 'nama_produk', e.target.value)} />
                            </div>
                          </div>
                          <div className="kpro-form-row">
                            <div className="kpro-form-group">
                              <label className="kpro-label">Jumlah (pcs)</label>
                              <input type="text" inputMode="numeric" className="kpro-input" value={p.jumlah_pcs} onChange={e => updateProduk(idx, 'jumlah_pcs', e.target.value)} />
                            </div>
                            <div className="kpro-form-group">
                              <label className="kpro-label">Harga Satuan</label>
                              <input type="text" inputMode="numeric" className="kpro-input" value={p.harga_satuan} onChange={e => updateProduk(idx, 'harga_satuan', e.target.value)} />
                            </div>
                            <div className="kpro-form-group">
                              <label className="kpro-label">Subtotal</label>
                              <input className="kpro-input" readOnly value={formatRupiah(p.jumlah_pcs * p.harga_satuan)} style={{ background: '#f5f5f5' }} />
                            </div>
                            <div className="kpro-form-group">
                              <button className="kpro-btn kpro-btn-danger kpro-btn-sm" onClick={() => hapusProduk(idx)}>
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      <button className="kpro-btn kpro-btn-outline-primary kpro-btn-sm" onClick={tambahProduk}>
                        <Plus size={14} style={{ marginRight: '4px' }} />
                        Tambah Produk
                      </button>
                    </div>
                  </div>

                  {/* Informasi Keuangan */}
                  <div className="kpro-card kpro-mb-4">
                    <div className="kpro-card-header">
                      <span className="kpro-card-title">
                        <DollarSign size={16} style={{ marginRight: '8px' }} />
                        Informasi Keuangan
                      </span>
                    </div>
                    <div className="kpro-card-body">
                      <div className="kpro-form-group">
                        <label className="kpro-label">Total Harga</label>
                        <input className="kpro-input" readOnly value={formatRupiah(formData.total_harga || 0)} style={{ background: '#EFF6FF', fontWeight: 'bold' }} />
                      </div>
                      <div className="kpro-form-row">
                        <div className="kpro-form-group">
                          <label className="kpro-label">
                            <CreditCard size={12} style={{ marginRight: '4px' }} />
                            Status Pembayaran
                          </label>
                          <select className="kpro-select" value={formData.status_bayar} onChange={e => handleStatusBayarChange(e.target.value)}>
                            <option value="belum_dp">Belum DP</option>
                            <option value="dp_30">DP 30%</option>
                            <option value="dp_50">DP 50%</option>
                            <option value="lunas">Lunas</option>
                          </select>
                        </div>
                        <div className="kpro-form-group">
                          <label className="kpro-label">DP Dibayar</label>
                          <input type="text" inputMode="numeric" className="kpro-input" value={formData.dp_dibayar || 0} onChange={e => handleDpChange(e.target.value)} />
                        </div>
                      </div>
                      <div className="kpro-form-group">
                        <label className="kpro-label">Sisa Tagihan</label>
                        <input className="kpro-input" readOnly value={formatRupiah(formData.sisa_tagihan || 0)} style={{ background: '#f5f5f5' }} />
                      </div>
                    </div>
                  </div>

                  {/* Status Produksi */}
                  <div className="kpro-card kpro-mb-4">
                    <div className="kpro-card-header">
                      <span className="kpro-card-title">
                        <Settings size={16} style={{ marginRight: '8px' }} />
                        Status Produksi
                      </span>
                    </div>
                    <div className="kpro-card-body">
                      <select className="kpro-select" value={formData.status_produksi} onChange={e => setFormData({ ...formData, status_produksi: e.target.value })}>
                        <option value="antri">Antri / Menunggu</option>
                        <option value="proses">Proses Produksi</option>
                        <option value="qc">Quality Control (QC)</option>
                        <option value="dikirim">Dikirim ke Client</option>
                        <option value="selesai">Selesai / Siap</option>
                      </select>
                    </div>
                  </div>

                  {/* Informasi Tambahan Client */}
                  <div className="kpro-card kpro-mb-4">
                    <div className="kpro-card-header">
                      <span className="kpro-card-title">
                        <Info size={16} style={{ marginRight: '8px' }} />
                        Informasi Tambahan Client
                      </span>
                    </div>
                    <div className="kpro-card-body">
                      <div className="kpro-form-group">
                        <label className="kpro-label">Sumber Info</label>
                        <input className="kpro-input" value={formData.sumber_info || ''} onChange={e => setFormData({ ...formData, sumber_info: e.target.value })} />
                      </div>
                      <div className="kpro-form-row">
                        <div className="kpro-form-group">
                          <label className="kpro-label">
                            <Building size={12} style={{ marginRight: '4px' }} />
                            Instansi
                          </label>
                          <input className="kpro-input" value={formData.instansi || ''} onChange={e => setFormData({ ...formData, instansi: e.target.value })} />
                        </div>
                        <div className="kpro-form-group">
                          <label className="kpro-label">
                            <Users size={12} style={{ marginRight: '4px' }} />
                            Organisasi
                          </label>
                          <input className="kpro-input" value={formData.organisasi || ''} onChange={e => setFormData({ ...formData, organisasi: e.target.value })} />
                        </div>
                      </div>
                      <div className="kpro-form-group">
                        <label className="kpro-label">
                          <Briefcase size={12} style={{ marginRight: '4px' }} />
                          Jabatan
                        </label>
                        <input className="kpro-input" value={formData.jabatan || ''} onChange={e => setFormData({ ...formData, jabatan: e.target.value })} />
                      </div>
                    </div>
                  </div>

                  {/* Catatan */}
                  <div className="kpro-card">
                    <div className="kpro-card-header">
                      <span className="kpro-card-title">
                        <FileText size={16} style={{ marginRight: '8px' }} />
                        Catatan
                      </span>
                    </div>
                    <div className="kpro-card-body">
                      <textarea className="kpro-textarea" rows="3" value={formData.catatan || ''} onChange={e => setFormData({ ...formData, catatan: e.target.value })} />
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="kpro-modal-footer">
              <button className="kpro-btn kpro-btn-secondary" onClick={() => setModalDetail(false)}>Batal</button>
              <button className="kpro-btn kpro-btn-primary" onClick={handleUpdateProyek} disabled={submittingUpdate}>
                <Save size={16} style={{ marginRight: '8px' }} />
                {submittingUpdate ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Hapus */}
      {modalHapus && selectedProyek && (
        <div className="kpro-modal-overlay is-open" onClick={() => setModalHapus(false)}>
          <div className="kpro-modal" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="kpro-modal-header">
              <h3>
                <AlertCircle size={18} style={{ marginRight: '8px', color: '#EF4444' }} />
                ⚠️ Konfirmasi Hapus
              </h3>
              <button className="kpro-modal-close" onClick={() => setModalHapus(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="kpro-modal-body">
              <p>Apakah Anda yakin ingin menghapus proyek ini?</p>
              <div style={{ background: '#FEF2F2', padding: '12px', borderRadius: '8px', marginTop: '12px' }}>
                <strong>{selectedProyek.nama_client}</strong><br />
                {selectedProyek.nama_proyek}<br />
                Total: {formatRupiah(selectedProyek.total_harga)}
              </div>
            </div>
            <div className="kpro-modal-footer">
              <button className="kpro-btn kpro-btn-secondary" onClick={() => setModalHapus(false)}>Batal</button>
              <button className="kpro-btn kpro-btn-danger" onClick={handleHapusProyek} disabled={submittingDelete}>
                <Trash2 size={16} style={{ marginRight: '8px' }} />
                {submittingDelete ? 'Menghapus...' : 'Ya, Hapus Proyek'}
              </button>
            </div>
          </div>
        </div>
      )}

      <NotaModal isOpen={notaModalOpen} onClose={() => setNotaModalOpen(false)} proyek={selectedProyekForNota} />
    </>
  )
}