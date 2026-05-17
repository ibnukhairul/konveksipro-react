import * as XLSX from 'xlsx'

export const exportService = {
  // Export proyek ke Excel
  exportProyekToExcel(proyekList, filename = 'laporan_proyek') {
    if (!proyekList || proyekList.length === 0) {
      throw new Error('Tidak ada data untuk diexport')
    }

    // Mapping data ke format yang rapi
    const exportData = proyekList.map(proyek => {
      // Konversi status pembayaran
      const statusBayarMap = {
        'belum_dp': 'Belum DP',
        'dp_30': 'DP 30%',
        'dp_50': 'DP 50%',
        'lunas': 'Lunas'
      }
      
      // Konversi status produksi
      const statusProduksiMap = {
        'antri': 'Antri',
        'proses': 'Proses',
        'qc': 'QC',
        'dikirim': 'Dikirim',
        'selesai': 'Selesai'
      }

      // Hitung sisa tagihan
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

    // Buat worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData)
    
    // Atur lebar kolom
    const colWidths = [
      { wch: 12 }, // Tanggal Order
      { wch: 25 }, // Client
      { wch: 15 }, // No WhatsApp
      { wch: 25 }, // Proyek
      { wch: 12 }, // Brand
      { wch: 15 }, // Total Harga
      { wch: 15 }, // DP Dibayar
      { wch: 15 }, // Sisa Tagihan
      { wch: 15 }, // Status Pembayaran
      { wch: 12 }, // Status Produksi
      { wch: 20 }, // Sumber Info
      { wch: 20 }, // Instansi
      { wch: 20 }, // Organisasi
      { wch: 15 }, // Jabatan
      { wch: 30 }  // Catatan
    ]
    worksheet['!cols'] = colWidths

    // Format angka ke Rupiah (opsional, tapi Excel bisa format sendiri)
    // Untuk kolom harga, biarkan sebagai number agar Excel bisa diformat
    
    // Buat workbook
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Proyek')
    
    // Tambahkan sheet ringkasan (opsional)
    const summaryData = [
      { 'Info': 'Total Proyek', 'Nilai': proyekList.length },
      { 'Info': 'Total Pemasukan (DP)', 'Nilai': proyekList.reduce((sum, p) => sum + (p.dp_dibayar || 0), 0) },
      { 'Info': 'Total Tagihan', 'Nilai': proyekList.reduce((sum, p) => sum + (p.total_harga || 0), 0) },
      { 'Info': 'Total Piutang', 'Nilai': proyekList.reduce((sum, p) => sum + ((p.total_harga || 0) - (p.dp_dibayar || 0)), 0) },
      { 'Info': 'Proyek Aktif', 'Nilai': proyekList.filter(p => p.status_produksi !== 'selesai').length },
      { 'Info': 'Proyek Selesai', 'Nilai': proyekList.filter(p => p.status_produksi === 'selesai').length }
    ]
    const summarySheet = XLSX.utils.json_to_sheet(summaryData)
    summarySheet['!cols'] = [{ wch: 20 }, { wch: 20 }]
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan')
    
    // Generate file dengan tanggal
    const today = new Date()
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
    XLSX.writeFile(workbook, `${filename}_${dateStr}.xlsx`)
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