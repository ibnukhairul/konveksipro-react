import * as XLSX from 'xlsx'

export const exportService = {
  // Export proyek ke Excel (sudah ada)
  exportProyekToExcel(proyekList, filename = 'laporan_proyek') {
    if (!proyekList || proyekList.length === 0) {
      throw new Error('Tidak ada data untuk diexport')
    }

    const exportData = proyekList.map(proyek => {
      const statusBayarMap = {
        'belum_dp': 'Belum DP',
        'dp_30': 'DP 30%',
        'dp_50': 'DP 50%',
        'lunas': 'Lunas'
      }
      const statusProduksiMap = {
        'antri': 'Antri',
        'proses': 'Proses',
        'qc': 'QC',
        'dikirim': 'Dikirim',
        'selesai': 'Selesai'
      }

      const sisaTagihan = (proyek.total_harga || 0) - (proyek.dp_dibayar || 0)

      return {
        'Tanggal Order': this.formatDate(proyek.tanggal_order),
        'Client': proyek.nama_client || '-',
        'No WhatsApp': proyek.no_wa || '-',
        'Proyek': proyek.nama_proyek || '-',
        'Brand': proyek.brand || 'SERAGAMAN',
        'Total Harga': proyek.total_harga || 0,
        'DP Dibayar': proyek.dp_dibayar || 0,
        'Sisa Tagihan': sisaTagihan,
        'Status Pembayaran': statusBayarMap[proyek.status_bayar] || proyek.status_bayar,
        'Status Produksi': statusProduksiMap[proyek.status_produksi] || proyek.status_produksi,
        'Sumber Info': proyek.sumber_info || '-',
        'Instansi': proyek.instansi || '-',
        'Organisasi': proyek.organisasi || '-',
        'Jabatan': proyek.jabatan || '-',
        'Catatan': proyek.catatan || '-'
      }
    })

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Proyek')
    
    // Sheet Ringkasan
    const summaryData = [
      { 'Info': 'Total Proyek', 'Nilai': proyekList.length },
      { 'Info': 'Total Pemasukan (DP)', 'Nilai': proyekList.reduce((sum, p) => sum + (p.dp_dibayar || 0), 0) },
      { 'Info': 'Total Tagihan', 'Nilai': proyekList.reduce((sum, p) => sum + (p.total_harga || 0), 0) },
      { 'Info': 'Total Piutang', 'Nilai': proyekList.reduce((sum, p) => sum + ((p.total_harga || 0) - (p.dp_dibayar || 0)), 0) },
      { 'Info': 'Proyek Aktif', 'Nilai': proyekList.filter(p => p.status_produksi !== 'selesai').length },
      { 'Info': 'Proyek Selesai', 'Nilai': proyekList.filter(p => p.status_produksi === 'selesai').length }
    ]
    const summarySheet = XLSX.utils.json_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan')
    
    const today = new Date()
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
    XLSX.writeFile(workbook, `${filename}_${dateStr}.xlsx`)
  },

  // 🔥 TAMBAHKAN: Export Laporan Keuangan Lengkap
  async exportLaporanKeuangan(proyekList, pengeluaranList, monthlyIncome, monthlyExpense, piutangData) {
    const workbook = XLSX.utils.book_new()
    const tanggal = new Date().toLocaleDateString('id-ID')
    
    // ========== SHEET 1: RINGKASAN KESELURUHAN ==========
    const totalPemasukan = proyekList.reduce((sum, p) => sum + (p.dp_dibayar || 0), 0)
    const totalPengeluaran = pengeluaranList.reduce((sum, p) => sum + (p.jumlah || 0), 0)
    const totalTagihan = proyekList.reduce((sum, p) => sum + (p.total_harga || 0), 0)
    const totalPiutang = totalTagihan - totalPemasukan
    const labaBersih = totalPemasukan - totalPengeluaran
    
    const summaryData = [
      { 'Item': '📊 LAPORAN KEUANGAN KONVEKSIPRO', 'Nilai': tanggal },
      { 'Item': '', 'Nilai': '' },
      { 'Item': '💰 TOTAL PEMASUKAN (DP)', 'Nilai': this.formatRupiahExcel(totalPemasukan) },
      { 'Item': '💸 TOTAL PENGELUARAN', 'Nilai': this.formatRupiahExcel(totalPengeluaran) },
      { 'Item': '📈 LABA BERSIH', 'Nilai': this.formatRupiahExcel(labaBersih) },
      { 'Item': '', 'Nilai': '' },
      { 'Item': '📋 TOTAL TAGIHAN', 'Nilai': this.formatRupiahExcel(totalTagihan) },
      { 'Item': '⚠️ TOTAL PIUTANG', 'Nilai': this.formatRupiahExcel(totalPiutang) },
      { 'Item': '📦 TOTAL PROYEK', 'Nilai': proyekList.length },
      { 'Item': '🔄 PROYEK AKTIF', 'Nilai': proyekList.filter(p => p.status_produksi !== 'selesai').length },
      { 'Item': '✅ PROYEK SELESAI', 'Nilai': proyekList.filter(p => p.status_produksi === 'selesai').length },
      { 'Item': '📝 TOTAL TRANSAKSI PENGELUARAN', 'Nilai': pengeluaranList.length }
    ]
    const summarySheet = XLSX.utils.json_to_sheet(summaryData)
    summarySheet['!cols'] = [{ wch: 30 }, { wch: 20 }]
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan')
    
    // ========== SHEET 2: PEMASUKAN VS PENGELUARAN PER BULAN ==========
    const incomeVsExpenseData = monthlyIncome.map((inc, idx) => ({
      'Bulan': inc.label,
      'Pemasukan (Rp)': inc.total || 0,
      'Pengeluaran (Rp)': monthlyExpense[idx]?.total || 0,
      'Laba/Rugi (Rp)': (inc.total || 0) - (monthlyExpense[idx]?.total || 0)
    }))
    const incomeSheet = XLSX.utils.json_to_sheet(incomeVsExpenseData)
    incomeSheet['!cols'] = [{ wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 20 }]
    XLSX.utils.book_append_sheet(workbook, incomeSheet, 'Pemasukan vs Pengeluaran')
    
    // ========== SHEET 3: DETAIL PENGELUARAN ==========
    const kategoriMap = {
      'Bahan Baku': '🧵 Bahan Baku',
      'Sablon': '🖨️ Sablon',
      'Ongkos Jahit': '✂️ Ongkos Jahit',
      'Packaging': '📦 Packaging',
      'Transport': '🚚 Transport',
      'Operasional': '📝 Operasional',
      'Marketing': '📢 Marketing',
      'Lainnya': '📌 Lainnya'
    }
    
    const pengeluaranData = pengeluaranList.map(p => ({
      'Tanggal': this.formatDate(p.tanggal),
      'Kategori': kategoriMap[p.kategori] || p.kategori,
      'Deskripsi': p.deskripsi || '-',
      'Jumlah (Rp)': p.jumlah || 0
    }))
    const pengeluaranSheet = XLSX.utils.json_to_sheet(pengeluaranData)
    pengeluaranSheet['!cols'] = [{ wch: 12 }, { wch: 20 }, { wch: 40 }, { wch: 18 }]
    XLSX.utils.book_append_sheet(workbook, pengeluaranSheet, 'Detail Pengeluaran')
    
    // ========== SHEET 4: REKAP PENGELUARAN PER KATEGORI ==========
    const kategoriRekap = {}
    for (const p of pengeluaranList) {
      const kategori = p.kategori || 'Lainnya'
      if (!kategoriRekap[kategori]) kategoriRekap[kategori] = 0
      kategoriRekap[kategori] += p.jumlah || 0
    }
    
    const kategoriData = Object.entries(kategoriRekap)
      .map(([kategori, total]) => ({
        'Kategori': kategoriMap[kategori] || kategori,
        'Total Pengeluaran (Rp)': total,
        'Persentase': ((total / totalPengeluaran) * 100).toFixed(1) + '%'
      }))
      .sort((a, b) => b['Total Pengeluaran (Rp)'] - a['Total Pengeluaran (Rp)'])
    
    const kategoriSheet = XLSX.utils.json_to_sheet(kategoriData)
    kategoriSheet['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 12 }]
    XLSX.utils.book_append_sheet(workbook, kategoriSheet, 'Rekap Kategori')
    
    // ========== SHEET 5: DETAIL PIUTANG ==========
    const piutangDataFormatted = piutangData.map(p => ({
      'Client': p.client,
      'Sisa Tagihan (Rp)': p.sisa,
      'Status Pembayaran': p.status === 'belum_dp' ? 'Belum DP' : 
                           (p.status === 'lunas' ? 'Lunas' : 
                           (p.status === 'dp_30' ? 'DP 30%' :
                           (p.status === 'dp_50' ? 'DP 50%' : p.status)))
    }))
    const piutangSheet = XLSX.utils.json_to_sheet(piutangDataFormatted)
    piutangSheet['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 15 }]
    XLSX.utils.book_append_sheet(workbook, piutangSheet, 'Detail Piutang')
    
    // ========== SHEET 6: DETAIL PEMASUKAN (PROYEK) ==========
    const pemasukanData = proyekList.map(p => ({
      'Tanggal Order': this.formatDate(p.tanggal_order),
      'Client': p.nama_client,
      'Proyek': p.nama_proyek,
      'Total Harga': p.total_harga || 0,
      'DP Dibayar': p.dp_dibayar || 0,
      'Sisa Tagihan': (p.total_harga || 0) - (p.dp_dibayar || 0),
      'Status': p.status_bayar === 'belum_dp' ? 'Belum DP' : 
                (p.status_bayar === 'lunas' ? 'Lunas' :
                (p.status_bayar === 'dp_30' ? 'DP 30%' :
                (p.status_bayar === 'dp_50' ? 'DP 50%' : p.status_bayar)))
    }))
    const pemasukanSheet = XLSX.utils.json_to_sheet(pemasukanData)
    pemasukanSheet['!cols'] = [{ wch: 12 }, { wch: 25 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }]
    XLSX.utils.book_append_sheet(workbook, pemasukanSheet, 'Detail Pemasukan')
    
    // Generate file
    const today = new Date()
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
    XLSX.writeFile(workbook, `laporan_keuangan_lengkap_${dateStr}.xlsx`)
    
    return true
  },

  formatRupiahExcel(num) {
    return `Rp ${Math.round(num || 0).toLocaleString('id-ID')}`
  },

  formatDate(dateString) {
    if (!dateString) return '-'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return '-'
      return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
    } catch {
      return '-'
    }
  }
}