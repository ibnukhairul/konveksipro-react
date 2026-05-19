import { useState, useEffect } from 'react'
import { stokService } from '../../services/stokService'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../hooks/useToast'
import SearchBar from './SearchBar'  // ← import komponen baru

export default function StokTable({ stok, loading, onRefresh, onSearch, onSort, sortField, sortOrder }) {
  const { user } = useAuth()
  const toast = useToast()
  const [selectedStok, setSelectedStok] = useState(null)
  const [modalAksi, setModalAksi] = useState(false)
  const [modalTambahStok, setModalTambahStok] = useState(false)
  const [modalAmbilStok, setModalAmbilStok] = useState(false)
  const [modalHapus, setModalHapus] = useState(false)
  const [jumlah, setJumlah] = useState(1)
  const [catatan, setCatatan] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [modalLaporan, setModalLaporan] = useState(false)
  const [laporanText, setLaporanText] = useState('')
  const [generatingReport, setGeneratingReport] = useState(false)
  
  const [submittingTambah, setSubmittingTambah] = useState(false)
  const [submittingAmbil, setSubmittingAmbil] = useState(false)
  const [submittingHapus, setSubmittingHapus] = useState(false)

  // 🔥 Simpan nilai search di localStorage
  useEffect(() => {
    const saved = localStorage.getItem('stokSearch')
    if (saved) setSearchKeyword(saved)
  }, [])

  useEffect(() => {
    localStorage.setItem('stokSearch', searchKeyword)
  }, [searchKeyword])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onSearch) onSearch(searchKeyword)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchKeyword, onSearch])

  // Fungsi status badge
  const statusBadge = (stok, min) => {
    if (stok < min) return <span className="kpro-badge kpro-badge-danger">Kritis</span>
    if (stok < min * 1.5) return <span className="kpro-badge kpro-badge-warning">Hampir Habis</span>
    return <span className="kpro-badge kpro-badge-success">Aman</span>
  }

  // Handler row click
  const handleRowClick = (item) => {
    setSelectedStok(item)
    setModalAksi(true)
  }

  // Handler tambah stok (popup aksi)
  const handleTambahStok = async () => {
    if (!selectedStok) return
    if (submittingTambah) return
    
    setSubmittingTambah(true)
    try {
      await stokService.tambahStok(selectedStok.id, jumlah, user?.id, catatan)
      toast.success(`✅ ${selectedStok.nama_bahan} +${jumlah} unit`)
      setModalTambahStok(false)
      setJumlah(1)
      setCatatan('')
      onRefresh()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmittingTambah(false)
    }
  }

  const handleAmbilStok = async () => {
    if (!selectedStok) return
    if (submittingAmbil) return
    
    setSubmittingAmbil(true)
    try {
      await stokService.ambilStok(selectedStok.id, jumlah, user?.id, catatan)
      toast.success(`✅ ${selectedStok.nama_bahan} -${jumlah} unit`)
      setModalAmbilStok(false)
      setJumlah(1)
      setCatatan('')
      onRefresh()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmittingAmbil(false)
    }
  }

  const handleHapusStok = async () => {
    if (!selectedStok) return
    if (submittingHapus) return
    if (!window.confirm(`⚠️ Yakin ingin menghapus stok "${selectedStok.nama_bahan}"?`)) return
    
    setSubmittingHapus(true)
    try {
      await stokService.hapusBahan(selectedStok.id, user?.id, catatan)
      toast.warning(`🗑 ${selectedStok.nama_bahan} dihapus`)
      setModalHapus(false)
      setCatatan('')
      onRefresh()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmittingHapus(false)
    }
  }

  // ========== LAPORAN STOK ==========
  const getProductKey = (item) => {
    const nama = (item.nama_bahan || '').toLowerCase().trim()
    const ukuran = (item.size || '').toUpperCase().trim()
    const gramasi = (item.gramasi || '').toLowerCase().trim()
    return `${nama}|${ukuran}|${gramasi}`
  }

  const isKaos = (item) => {
    const nama = (item.nama_bahan || '').toLowerCase()
    const kategori = (item.kategori || '').toLowerCase()
    const merchandiseKeywords = ['totebag', 'belacu', 'drill', 'canvas', 'sponbound', 'pouch', 'lanyard', 'frame', 'tali cocard', 'bolpen', 'pulpen', 'topi', 'rimba', 'trucker', 'kartu', 'voucher', 'plastik', 'stiker', 'jersey']
    for (const kw of merchandiseKeywords) if (nama.includes(kw)) return false
    const kaosKeywords = ['kaos', 'kemeja', 'shirt', 'jersey kaos', 'poloshirt', 'polo', 't-shirt', 'tshirt']
    const kaosKategori = ['markas kaos polos', 'kaos polos']
    for (const kw of kaosKeywords) if (nama.includes(kw)) return true
    for (const kat of kaosKategori) if (kategori.includes(kat)) return true
    return false
  }

  const extractWarna = (namaBahan) => {
    if (!namaBahan) return 'LAINNYA'
    const warnaList = ['HITAM', 'PUTIH', 'MERAH', 'BIRU', 'HIJAU', 'KUNING', 'ORANGE', 'UNGU', 'COKLAT', 'ABU-ABU', 'CREAM', 'NAVY', 'MARUN', 'PINK', 'SALEM', 'KREM', 'BURGUNDY', 'KHAKI', 'TOSCA', 'DONKER', 'MAROON', 'COKELAT']
    const upper = namaBahan.toUpperCase()
    for (const w of warnaList) if (upper.includes(w)) return w === 'ABU-ABU' ? 'ABU-ABU' : (w === 'DONKER' ? 'DONKER' : w)
    if (upper.includes('ABU')) return 'ABU-ABU'
    if (upper.includes('COKELAT')) return 'COKLAT'
    return 'LAINNYA'
  }

  const determineTipe = (item) => {
    const nama = (item.nama_bahan || '').toLowerCase()
    const gramasi = (item.gramasi || '').toUpperCase()
    if (nama.includes('panjang') || nama.includes('long')) return 'panjang'
    if (nama.includes('pendek') || nama.includes('short')) return 'pendek'
    if (gramasi.includes('30S') || gramasi.includes('24S') || gramasi.includes('20S') || gramasi.includes('DRYFIT') || gramasi.includes('PE')) return 'pendek'
    return 'pendek'
  }

  const normalizeUkuran = (size) => {
    if (!size) return 'ALL SIZE'
    const upper = size.toUpperCase()
    const map = { 'XS': 'XS', 'S': 'S', 'M': 'M', 'L': 'L', 'XL': 'XL', 'XXL': 'XXL', 'XXXL': 'XXXL', '2XL': 'XXL', '3XL': 'XXXL', '4XL': '4XL', '5XL': '5XL' }
    return map[upper] || upper
  }

  const generateKaosReport = (stokKaos, recentTakenMap) => {
    const byWarna = {}
    for (const item of stokKaos) {
      const warna = extractWarna(item.nama_bahan)
      const tipe = determineTipe(item)
      const ukuran = normalizeUkuran(item.size)
      const jumlah = item.stok_saat_ini
      const key = getProductKey(item)
      const isRecent = recentTakenMap.has(key)
      if (!byWarna[warna]) byWarna[warna] = { pendek: {}, panjang: {}, takenMark: {} }
      if (tipe === 'pendek') {
        byWarna[warna].pendek[ukuran] = (byWarna[warna].pendek[ukuran] || 0) + jumlah
        if (isRecent) byWarna[warna].takenMark[`pendek_${ukuran}`] = true
      } else {
        byWarna[warna].panjang[ukuran] = (byWarna[warna].panjang[ukuran] || 0) + jumlah
        if (isRecent) byWarna[warna].takenMark[`panjang_${ukuran}`] = true
      }
    }
    let laporan = ''
    const urutanWarna = ['HITAM', 'PUTIH', 'MERAH', 'BIRU', 'HIJAU', 'KUNING', 'ORANGE', 'UNGU', 'COKLAT', 'ABU-ABU', 'CREAM', 'NAVY', 'MARUN', 'PINK', 'SALEM', 'KREM', 'BURGUNDY', 'KHAKI', 'TOSCA', 'DONKER', 'MAROON', 'COKELAT', 'LAINNYA']
    const ukuranOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '4XL', '5XL']
    for (const warna of urutanWarna) {
      const data = byWarna[warna]
      if (!data) continue
      const totalPendek = Object.values(data.pendek).reduce((a,b)=>a+b,0)
      const totalPanjang = Object.values(data.panjang).reduce((a,b)=>a+b,0)
      const totalAll = totalPendek + totalPanjang
      if (totalAll === 0) continue
      laporan += warna === 'LAINNYA' ? `STOK LAINNYA MARKAS 2 NGRUKI \n\n` : `STOK ${warna} MARKAS 2 NGRUKI \n\n`
      if (totalPendek > 0) {
        laporan += `Pendek \n`
        for (const ukuran of ukuranOrder) if (data.pendek[ukuran]) laporan += `${ukuran} = ${data.pendek[ukuran]}${data.takenMark[`pendek_${ukuran}`] ? ' 🔵' : ''}\n`
        laporan += `Total Pendek ${totalPendek} pcs \n\n`
      }
      if (totalPanjang > 0) {
        laporan += `Panjang \n`
        for (const ukuran of ukuranOrder) if (data.panjang[ukuran]) laporan += `${ukuran} = ${data.panjang[ukuran]}${data.takenMark[`panjang_${ukuran}`] ? ' 🔵' : ''}\n`
        laporan += `Total Panjang ${totalPanjang} pcs \n\n`
      }
      laporan += `TOTAL ${warna === 'LAINNYA' ? 'LAINNYA' : warna} ALL SIZE ${totalAll} PCS \n\n`
    }
    return laporan
  }

  const determineMerchandiseCategory = (item) => {
    const nama = (item.nama_bahan || '').toLowerCase()
    if (nama.includes('pouch')) return 'POUCH'
    if (nama.includes('lanyard') || nama.includes('frame') || nama.includes('tali cocard')) return 'LANYARD'
    if (nama.includes('bolpen') || nama.includes('pulpen')) return 'BOLPEN'
    if (nama.includes('topi') || nama.includes('rimba') || nama.includes('trucker')) return 'TOPI'
    if (nama.includes('kartu nama')) return 'KARTU NAMA'
    if (nama.includes('voucher')) return 'KARTU VOUCHER'
    if (nama.includes('plastik') || nama.includes('stiker')) return 'PLASTIK JERSEY'
    if (nama.includes('totebag') || nama.includes('belacu') || nama.includes('drill') || nama.includes('canvas') || nama.includes('sponbound')) return 'TOTEBAG'
    return 'LAINNYA'
  }

  const generateMerchandiseReport = (stokMerchandise, recentTakenMap) => {
    const categories = { 'TOTEBAG': [], 'POUCH': [], 'LANYARD': [], 'BOLPEN': [], 'TOPI': [], 'KARTU NAMA': [], 'KARTU VOUCHER': [], 'PLASTIK JERSEY': [], 'LAINNYA': [] }
    for (const item of stokMerchandise) {
      const kategori = determineMerchandiseCategory(item)
      const key = getProductKey(item)
      const isRecent = recentTakenMap.has(key)
      categories[kategori].push({ ...item, isRecent })
    }
    let laporan = 'STOCK MERCHANDISE NGRUKI\n\n'
    const categoryOrder = ['TOTEBAG', 'POUCH', 'LANYARD', 'BOLPEN', 'TOPI', 'KARTU NAMA', 'KARTU VOUCHER', 'PLASTIK JERSEY', 'LAINNYA']
    const labelMap = { 'TOTEBAG': 'A. TOTEBAG', 'POUCH': 'C. POUCH', 'LANYARD': 'D. LANYARD', 'BOLPEN': 'E. BOLPEN', 'TOPI': 'F. TOPI', 'KARTU NAMA': 'G. KARTU NAMA', 'KARTU VOUCHER': 'H. KARTU VOUCHER', 'PLASTIK JERSEY': 'I. PLASTIK JERSEY', 'LAINNYA': 'Z. LAINNYA' }
    for (const cat of categoryOrder) {
      if (categories[cat].length === 0) continue
      laporan += `${labelMap[cat]}\n`
      categories[cat].sort((a,b) => a.nama_bahan.localeCompare(b.nama_bahan))
      for (const item of categories[cat]) {
        let nama = item.nama_bahan
        const jumlah = item.stok_saat_ini
        const mark = item.isRecent ? ' 🔵' : ''
        if (!nama.toLowerCase().includes('markas 2 ngruki')) {
          if (cat === 'KARTU NAMA' || cat === 'KARTU VOUCHER') nama = `${nama} (Markas 2 Ngruki${cat === 'KARTU NAMA' ? ' (perkiraan)' : ''})`
          else nama = `${nama} (Markas 2 Ngruki)`
        }
        let displayJumlah = jumlah
        if (cat === 'KARTU NAMA' || cat === 'KARTU VOUCHER') displayJumlah = jumlah > 0 ? `+/- ${jumlah.toLocaleString('id-ID')}` : '-'
        else displayJumlah = jumlah > 0 ? jumlah.toLocaleString('id-ID') : '-'
        laporan += `>> ${nama} : ${displayJumlah}${mark}\n`
      }
      laporan += '\n'
    }
    return laporan
  }

  const getFullFormattedDate = () => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
    const today = new Date()
    return `${days[today.getDay()]}, ${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`
  }

  const generateStokReport = async () => {
    setGeneratingReport(true)
    try {
      const semuaStok = await stokService.getAllRaw()
      if (!semuaStok.length) {
        toast.warning('Tidak ada data stok')
        setGeneratingReport(false)
        return
      }
      const recentLogs = await stokService.getRecentAmbilLogs()
      const recentTakenMap = new Map()
      for (const log of recentLogs) {
        if (log.stok_barang) {
          const key = getProductKey(log.stok_barang)
          recentTakenMap.set(key, true)
        }
      }
      const stokKaos = semuaStok.filter(item => isKaos(item) && item.stok_saat_ini > 0)
      const stokMerchandise = semuaStok.filter(item => !isKaos(item) && item.stok_saat_ini > 0)
      let laporan = ''
      laporan += generateKaosReport(stokKaos, recentTakenMap)
      laporan += generateMerchandiseReport(stokMerchandise, recentTakenMap)
      laporan += '\n_🔵 = Stok yang diambil dalam 12 jam terakhir_\n'
      laporan += '\n' + getFullFormattedDate()
      setLaporanText(laporan)
      setModalLaporan(true)
    } catch (err) {
      console.error(err)
      toast.error('Gagal membuat laporan: ' + err.message)
    } finally {
      setGeneratingReport(false)
    }
  }

  const copyLaporanToClipboard = () => {
    navigator.clipboard.writeText(laporanText)
    toast.success('Laporan disalin ke clipboard!')
    setModalLaporan(false)
  }

  
if (loading && stok.length === 0) {
    return (
      <>
        <div className="kpro-d-flex kpro-justify-between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--kpro-border)' }}>
          <SearchBar 
            value={searchKeyword}
            onChange={setSearchKeyword}
            placeholder="Cari nama bahan, kategori, gramasi, ukuran..."
            disabled={false}
          />
          <button className="kpro-btn kpro-btn-secondary" disabled>Laporkan Stok</button>
        </div>
        <div className="kpro-empty">Memuat data stok...</div>
      </>
    )
  }

  return (
    <>
      {/* BARIS PENCARIAN - tetap tampil meskipun loading */}
      <div className="kpro-d-flex kpro-justify-between kpro-align-center" style={{ padding: '16px 20px', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--kpro-border)', backgroundColor: 'var(--kpro-bg-surface)' }}>
        <SearchBar 
          value={searchKeyword}
          onChange={setSearchKeyword}
          placeholder="Cari nama bahan, kategori, gramasi, ukuran..."
          disabled={false}  // ← TIDAK PERNAH DISABLED
        />
        <div>
          <button className="kpro-btn kpro-btn-secondary" onClick={generateStokReport} disabled={generatingReport}>
            {generatingReport ? 'Membuat laporan...' : 'Laporkan Stok Terbaru'}
          </button>
        </div>
      </div>

      {/* Tabel Stok */}
      <div className="kpro-table-wrap">
        <table className="kpro-table" id="stok-table">
          <thead>
            <tr>
              <th style={{ cursor: 'pointer' }} onClick={() => onSort('nama_bahan')}>Nama {sortField === 'nama_bahan' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
              <th style={{ cursor: 'pointer' }} onClick={() => onSort('size')}>Ukuran {sortField === 'size' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
              <th style={{ cursor: 'pointer' }} onClick={() => onSort('stok_saat_ini')}>Stok {sortField === 'stok_saat_ini' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
              <th style={{ cursor: 'pointer' }} onClick={() => onSort('kategori')}>Kategori {sortField === 'kategori' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
              <th style={{ cursor: 'pointer' }} onClick={() => onSort('gramasi')}>Gramasi {sortField === 'gramasi' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
              <th style={{ cursor: 'pointer' }} onClick={() => onSort('satuan')}>Satuan {sortField === 'satuan' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
              <th style={{ cursor: 'pointer' }} onClick={() => onSort('catatan')}>Catatan {sortField === 'catatan' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {stok.length === 0 && !loading ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>Tidak ada data stok</td></tr>
            ) : (
              stok.map(item => (
                <tr key={item.id} style={{ cursor: 'pointer' }} onClick={() => handleRowClick(item)}>
                  <td style={{ fontWeight: 600 }}>{item.nama_bahan}</td>
                  <td>{item.size || '-'}</td>
                  <td>{item.stok_saat_ini}</td>
                  <td>{item.kategori}</td>
                  <td>{item.gramasi || '-'}</td>
                  <td>{item.satuan}</td>
                  <td>{item.catatan || '-'}</td>
                  <td>{statusBadge(item.stok_saat_ini, item.min_stok)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Aksi */}
      {modalAksi && selectedStok && (
        <div className="kpro-modal-overlay is-open" onClick={() => setModalAksi(false)}>
          <div className="kpro-modal" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="kpro-modal-header"><h3>Aksi Stok</h3><button className="kpro-modal-close" onClick={() => setModalAksi(false)}>✕</button></div>
            <div className="kpro-modal-body">
              <div><strong>{selectedStok.nama_bahan}</strong> {selectedStok.size && `(${selectedStok.size})`}</div>
              <div>Stok saat ini: {selectedStok.stok_saat_ini}</div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexDirection: 'column' }}>
                <button 
                  className="kpro-btn kpro-btn-primary" 
                  onClick={() => { setModalAksi(false); setModalTambahStok(true); }}
                  disabled={submittingTambah}
                >
                  {submittingTambah ? 'Memproses...' : 'Tambah Stok'}
                </button>
                <button 
                  className="kpro-btn kpro-btn-warning" 
                  onClick={() => { setModalAksi(false); setModalAmbilStok(true); }}
                  disabled={submittingAmbil}
                >
                  {submittingAmbil ? 'Memproses...' : 'Ambil Stok'}
                </button>
                <button 
                  className="kpro-btn kpro-btn-danger" 
                  onClick={() => { setModalAksi(false); setModalHapus(true); }}
                  disabled={submittingHapus}
                >
                  {submittingHapus ? 'Memproses...' : 'Hapus Stok'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Stok - 🔥 dengan disabled */}
      {modalTambahStok && (
        <div className="kpro-modal-overlay is-open" onClick={() => setModalTambahStok(false)}>
          <div className="kpro-modal" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="kpro-modal-header"><h3>Tambah Stok</h3><button className="kpro-modal-close" onClick={() => setModalTambahStok(false)}>✕</button></div>
            <div className="kpro-modal-body">
              <div className="kpro-form-group"><label>Jumlah</label><input type="text" inputMode="numeric" className="kpro-input" value={jumlah} onChange={e => setJumlah(parseInt(e.target.value) || 0)} disabled={submittingTambah} /></div>
              <div className="kpro-form-group"><label>Catatan (opsional)</label><input type="text" className="kpro-input" value={catatan} onChange={e => setCatatan(e.target.value)} disabled={submittingTambah} /></div>
            </div>
            <div className="kpro-modal-footer">
              <button className="kpro-btn kpro-btn-secondary" onClick={() => setModalTambahStok(false)} disabled={submittingTambah}>Batal</button>
              <button className="kpro-btn kpro-btn-primary" onClick={handleTambahStok} disabled={submittingTambah}>
                {submittingTambah ? 'Memproses...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ambil Stok - 🔥 dengan disabled */}
      {modalAmbilStok && (
        <div className="kpro-modal-overlay is-open" onClick={() => setModalAmbilStok(false)}>
          <div className="kpro-modal" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="kpro-modal-header"><h3>Ambil Stok</h3><button className="kpro-modal-close" onClick={() => setModalAmbilStok(false)}>✕</button></div>
            <div className="kpro-modal-body">
              <div className="kpro-form-group"><label>Jumlah</label><input type="text" inputMode="numeric" className="kpro-input" value={jumlah} onChange={e => setJumlah(parseInt(e.target.value) || 0)} disabled={submittingAmbil} /></div>
              <div className="kpro-form-group"><label>Catatan (opsional)</label><input type="text" className="kpro-input" value={catatan} onChange={e => setCatatan(e.target.value)} disabled={submittingAmbil} /></div>
            </div>
            <div className="kpro-modal-footer">
              <button className="kpro-btn kpro-btn-secondary" onClick={() => setModalAmbilStok(false)} disabled={submittingAmbil}>Batal</button>
              <button className="kpro-btn kpro-btn-primary" onClick={handleAmbilStok} disabled={submittingAmbil}>
                {submittingAmbil ? 'Memproses...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Hapus Stok */}
      {modalHapus && (
        <div className="kpro-modal-overlay is-open" onClick={() => setModalHapus(false)}>
          <div className="kpro-modal" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="kpro-modal-header"><h3>Hapus Stok</h3><button className="kpro-modal-close" onClick={() => setModalHapus(false)}>✕</button></div>
            <div className="kpro-modal-body">
              <p>Yakin ingin menghapus stok ini?</p>
              <div className="kpro-form-group"><label>Catatan (opsional)</label><input type="text" className="kpro-input" value={catatan} onChange={e => setCatatan(e.target.value)} disabled={submittingHapus} /></div>
            </div>
            <div className="kpro-modal-footer">
              <button className="kpro-btn kpro-btn-secondary" onClick={() => setModalHapus(false)} disabled={submittingHapus}>Batal</button>
              <button className="kpro-btn kpro-btn-danger" onClick={handleHapusStok} disabled={submittingHapus}>
                {submittingHapus ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Laporan */}
      {modalLaporan && (
        <div className="kpro-modal-overlay is-open" onClick={() => setModalLaporan(false)}>
          <div className="kpro-modal" style={{ maxWidth: '550px' }} onClick={e => e.stopPropagation()}>
            <div className="kpro-modal-header"><h3>📋 Laporan Stok untuk WhatsApp</h3><button className="kpro-modal-close" onClick={() => setModalLaporan(false)}>✕</button></div>
            <div className="kpro-modal-body">
              <textarea readOnly value={laporanText} rows={20} style={{ width: '100%', fontFamily: 'monospace', fontSize: '12px', padding: '12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px' }} />
            </div>
            <div className="kpro-modal-footer" style={{ justifyContent: 'space-between' }}>
              <button className="kpro-btn kpro-btn-secondary" onClick={() => setModalLaporan(false)}>Tutup</button>
              <button className="kpro-btn kpro-btn-primary" onClick={copyLaporanToClipboard}>📋 Salin ke WhatsApp</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}