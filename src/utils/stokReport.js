// src/utils/stokReport.js
export function generateStokReport(stokList, recentLogs) {
  // Buat map produk yang baru diambil (untuk penanda 🔵)
  const recentTakenMap = new Map()
  for (const log of recentLogs) {
    if (log.stok_barang) {
      const key = getProductKey(log.stok_barang)
      recentTakenMap.set(key, true)
    }
  }

  // Pisahkan stok kaos dan merchandise
  const stokKaos = stokList.filter(item => isKaos(item) && item.stok_saat_ini > 0)
  const stokMerchandise = stokList.filter(item => !isKaos(item) && item.stok_saat_ini > 0)

  let laporan = ''

  // Bagian 1: STOK KAOS
  laporan += generateKaosReport(stokKaos, recentTakenMap)

  // Bagian 2: STOK MERCHANDISE
  laporan += generateMerchandiseReport(stokMerchandise, recentTakenMap)

  laporan += `\n_🔵 = Stok yang diambil dalam 12 jam terakhir_\n`
  laporan += '\n' + getFullFormattedDate()

  return laporan
}

// Helper functions (salin dari kpro.js asli)
function getProductKey(item) {
  const nama = (item.nama_bahan || '').toLowerCase().trim()
  const ukuran = (item.size || '').toUpperCase().trim()
  const gramasi = (item.gramasi || '').toLowerCase().trim()
  return `${nama}|${ukuran}|${gramasi}`
}

function isKaos(item) {
  const nama = (item.nama_bahan || '').toLowerCase()
  const kategori = (item.kategori || '').toLowerCase()
  const merchandiseKeywords = ['totebag', 'belacu', 'drill', 'canvas', 'sponbound', 'pouch', 'lanyard', 'frame', 'tali cocard', 'bolpen', 'pulpen', 'topi', 'rimba', 'trucker', 'kartu', 'voucher', 'plastik', 'stiker', 'jersey']
  for (const kw of merchandiseKeywords) {
    if (nama.includes(kw)) return false
  }
  const kaosKeywords = ['kaos', 'kemeja', 'shirt', 'jersey kaos', 'poloshirt', 'polo', 't-shirt', 'tshirt']
  const kaosKategori = ['markas kaos polos', 'kaos polos']
  for (const kw of kaosKeywords) if (nama.includes(kw)) return true
  for (const kat of kaosKategori) if (kategori.includes(kat)) return true
  return false
}

function generateKaosReport(stokKaos, recentTakenMap) {
  // Kelompokkan berdasarkan warna
  const byWarna = {}
  for (const item of stokKaos) {
    const warna = extractWarna(item.nama_bahan)
    const tipe = determineTipe(item)
    const ukuran = normalizeUkuran(item.size)
    const jumlah = item.stok_saat_ini
    const productKey = getProductKey(item)
    const isRecentlyTaken = recentTakenMap.has(productKey)
    if (!byWarna[warna]) byWarna[warna] = { pendek: {}, panjang: {}, takenMark: {} }
    if (tipe === 'pendek') {
      byWarna[warna].pendek[ukuran] = (byWarna[warna].pendek[ukuran] || 0) + jumlah
      if (isRecentlyTaken) byWarna[warna].takenMark[`pendek_${ukuran}`] = true
    } else {
      byWarna[warna].panjang[ukuran] = (byWarna[warna].panjang[ukuran] || 0) + jumlah
      if (isRecentlyTaken) byWarna[warna].takenMark[`panjang_${ukuran}`] = true
    }
  }

  let laporan = ''
  const urutanWarna = ['HITAM', 'PUTIH', 'MERAH', 'BIRU', 'HIJAU', 'KUNING', 'ORANGE', 'UNGU', 'COKLAT', 'ABU-ABU', 'CREAM', 'NAVY', 'MARUN', 'PINK', 'SALEM', 'KREM', 'BURGUNDY', 'KHAKI', 'TOSCA', 'DONKER', 'MAROON', 'COKELAT', 'LAINNYA']
  const ukuranOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '4XL', '5XL']

  for (const warna of urutanWarna) {
    const data = byWarna[warna]
    if (!data) continue
    const totalPendek = sumObjValues(data.pendek)
    const totalPanjang = sumObjValues(data.panjang)
    if (totalPendek + totalPanjang === 0) continue
    if (warna === 'LAINNYA') laporan += `STOK LAINNYA MARKAS 2 NGRUKI \n\n`
    else laporan += `STOK ${warna} MARKAS 2 NGRUKI \n\n`
    if (totalPendek > 0) {
      laporan += `Pendek \n`
      for (const ukuran of ukuranOrder) {
        if (data.pendek[ukuran]) {
          const mark = data.takenMark[`pendek_${ukuran}`] ? ' 🔵' : ''
          laporan += `${ukuran} = ${data.pendek[ukuran]}${mark}\n`
        }
      }
      laporan += `Total Pendek ${totalPendek} pcs \n\n`
    }
    if (totalPanjang > 0) {
      laporan += `Panjang \n`
      for (const ukuran of ukuranOrder) {
        if (data.panjang[ukuran]) {
          const mark = data.takenMark[`panjang_${ukuran}`] ? ' 🔵' : ''
          laporan += `${ukuran} = ${data.panjang[ukuran]}${mark}\n`
        }
      }
      laporan += `Total Panjang ${totalPanjang} pcs \n\n`
    }
    laporan += `TOTAL ${warna === 'LAINNYA' ? 'LAINNYA' : warna} ALL SIZE ${totalPendek + totalPanjang} PCS \n\n`
  }
  return laporan
}

function generateMerchandiseReport(stokMerchandise, recentTakenMap) {
  const categories = { 'TOTEBAG': [], 'POUCH': [], 'LANYARD': [], 'BOLPEN': [], 'TOPI': [], 'KARTU NAMA': [], 'KARTU VOUCHER': [], 'PLASTIK JERSEY': [], 'LAINNYA': [] }
  for (const item of stokMerchandise) {
    const kategori = determineMerchandiseCategory(item)
    const productKey = getProductKey(item)
    const isRecentlyTaken = recentTakenMap.has(productKey)
    categories[kategori].push({ ...item, isRecentlyTaken })
  }
  let laporan = 'STOCK MERCHANDISE NGRUKI\n\n'
  const categoryOrder = ['TOTEBAG', 'POUCH', 'LANYARD', 'BOLPEN', 'TOPI', 'KARTU NAMA', 'KARTU VOUCHER', 'PLASTIK JERSEY', 'LAINNYA']
  for (const cat of categoryOrder) {
    if (categories[cat].length === 0) continue
    let categoryLabel = { 'TOTEBAG': 'A. TOTEBAG', 'POUCH': 'C. POUCH', 'LANYARD': 'D. LANYARD', 'BOLPEN': 'E. BOLPEN', 'TOPI': 'F. TOPI', 'KARTU NAMA': 'G. KARTU NAMA', 'KARTU VOUCHER': 'H. KARTU VOUCHER', 'PLASTIK JERSEY': 'I. PLASTIK JERSEY', 'LAINNYA': 'Z. LAINNYA' }[cat]
    laporan += `${categoryLabel}\n`
    categories[cat].sort((a, b) => a.nama_bahan.localeCompare(b.nama_bahan))
    for (const item of categories[cat]) {
      let nama = formatNamaMerchandise(item)
      const jumlah = item.stok_saat_ini
      const mark = item.isRecentlyTaken ? ' 🔵' : ''
      if (!nama.toLowerCase().includes('markas 2 ngruki')) {
        if (cat === 'KARTU NAMA' || cat === 'KARTU VOUCHER') nama = `${nama} (Markas 2 Ngruki (perkiraan))`
        else nama = `${nama} (Markas 2 Ngruki)`
      }
      const displayJumlah = (cat === 'KARTU NAMA' || cat === 'KARTU VOUCHER') ? `+/- ${jumlah.toLocaleString('id-ID')}` : jumlah.toLocaleString('id-ID')
      laporan += `>> ${nama} : ${displayJumlah}${mark}\n`
    }
    laporan += `\n`
  }
  return laporan
}

function extractWarna(namaBahan) {
  if (!namaBahan) return 'LAINNYA'
  const warnaList = ['HITAM', 'PUTIH', 'MERAH', 'BIRU', 'HIJAU', 'KUNING', 'ORANGE', 'UNGU', 'COKLAT', 'ABU-ABU', 'CREAM', 'NAVY', 'MARUN', 'PINK', 'SALEM', 'KREM', 'BURGUNDY', 'KHAKI', 'TOSCA', 'DONKER', 'MAROON', 'COKELAT']
  const upperNama = namaBahan.toUpperCase()
  for (const w of warnaList) if (upperNama.includes(w)) return w === 'ABU-ABU' ? 'ABU-ABU' : (w === 'DONKER' ? 'DONKER' : w)
  if (upperNama.includes('ABU')) return 'ABU-ABU'
  if (upperNama.includes('COKELAT')) return 'COKLAT'
  return 'LAINNYA'
}

function determineTipe(item) {
  const nama = (item.nama_bahan || '').toLowerCase()
  const gramasi = (item.gramasi || '').toUpperCase()
  if (nama.includes('panjang') || nama.includes('long')) return 'panjang'
  if (nama.includes('pendek') || nama.includes('short')) return 'pendek'
  if (gramasi.includes('30S') || gramasi.includes('24S') || gramasi.includes('20S') || gramasi.includes('DRYFIT') || gramasi.includes('PE')) return 'pendek'
  return 'pendek'
}

function normalizeUkuran(size) {
  if (!size) return 'ALL SIZE'
  const upper = size.toUpperCase()
  const mapping = { 'XS': 'XS', 'S': 'S', 'M': 'M', 'L': 'L', 'XL': 'XL', 'XXL': 'XXL', 'XXXL': 'XXXL', '2XL': 'XXL', '3XL': 'XXXL', '4XL': '4XL', '5XL': '5XL' }
  return mapping[upper] || upper
}

function sumObjValues(obj) {
  return Object.values(obj).reduce((a, b) => a + b, 0)
}

function determineMerchandiseCategory(item) {
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

function formatNamaMerchandise(item) {
  let nama = item.nama_bahan || ''
  nama = nama.replace(/^>>\s*/, '')
  nama = nama.replace(/\s*\(Markas 2 Ngruki\)\s*$/i, '')
  nama = nama.replace(/\s*\(Markas 2 Ngruki\s*\(perkiraan\)\)\s*$/i, '')
  if (item.catatan && item.catatan.trim()) {
    const catatanClean = item.catatan.replace(/\s*\(Markas 2 Ngruki\)\s*$/i, '')
    if (!nama.includes(catatanClean)) nama = `${nama} (${catatanClean})`
  }
  return nama.trim()
}

function getFullFormattedDate() {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  const today = new Date()
  return `${days[today.getDay()]}, ${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`
}