import { supabase } from './supabase'
import { pengeluaranService } from './pengeluaranService'
import { keuanganService } from './keuanganService'

export const dashboardService = {
  async getRingkasan() {
    try {
      const { data: stokData, error: stokError } = await supabase
        .from('stok_barang')
        .select('stok_saat_ini, min_stok')
      if (stokError) throw stokError

      const { data: proyekData, error: proyekError } = await supabase
        .from('proyek')
        .select('total_harga, dp_dibayar, status_produksi, created_at')
      if (proyekError) throw proyekError

      const now = new Date()
      const bulanIni = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      const tanggalMulai = `${bulanIni}-01`
      const tanggalSelesai = `${bulanIni}-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}`
      
      // 🔥 PERBAIKI: Panggil dengan parameter yang benar
      const pengeluaranBulanIni = await pengeluaranService.getTotalPengeluaran(tanggalMulai, tanggalSelesai)

      const stokList = stokData || []
      const stokKritis = stokList.filter(s => (s.stok_saat_ini || 0) < (s.min_stok || 0)).length
      const totalStok = stokList.reduce((sum, s) => sum + (s.stok_saat_ini || 0), 0)

      const proyekList = proyekData || []
      let totalPemasukan = 0
      let totalTagihan = 0
      let proyekAktif = 0

      for (const proyek of proyekList) {
        totalPemasukan += proyek.dp_dibayar || 0
        totalTagihan += proyek.total_harga || 0
        if (proyek.status_produksi !== 'selesai') proyekAktif++
      }

      const piutang = totalTagihan - totalPemasukan
      const labaKotor = totalPemasukan - pengeluaranBulanIni

      const omzetBulanIni = proyekList
        .filter(p => p.created_at?.startsWith(bulanIni))
        .reduce((sum, p) => sum + (p.dp_dibayar || 0), 0)

      return {
        totalStok,
        stokKritis,
        proyekAktif,
        omzetBulanIni,
        piutang,
        pengeluaranBulanIni,
        labaKotor
      }
    } catch (err) {
      console.error('Dashboard ringkasan error:', err)
      return { totalStok: 0, stokKritis: 0, proyekAktif: 0, omzetBulanIni: 0, piutang: 0, pengeluaranBulanIni: 0, labaKotor: 0 }
    }
  },

  async getOmzetPerBulan() {
    const { data: proyekList, error } = await supabase
      .from('proyek')
      .select('dp_dibayar, created_at')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Omzet per bulan error:', error)
      return []
    }

    const now = new Date()
    const months = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
      months.push({ key, label, total: 0 })
    }

    for (const proyek of (proyekList || [])) {
      const key = proyek.created_at?.substring(0, 7)
      const month = months.find(m => m.key === key)
      if (month) month.total += proyek.dp_dibayar || 0
    }

    return months
  },

  // 🔥 TAMBAHKAN: Fungsi getIncomeVsExpense untuk Dashboard
  async getIncomeVsExpense() {
    try {
      // Ambil 6 bulan terakhir pemasukan
      const income = await this.getOmzetPerBulan()
      
      // Ambil 6 bulan terakhir pengeluaran
      const now = new Date()
      const expenseMonths = []
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const year = d.getFullYear()
        const month = d.getMonth() + 1
        const monthStr = String(month).padStart(2, '0')
        const key = `${year}-${monthStr}`
        const startDate = `${key}-01`
        const endDate = `${key}-${new Date(year, month, 0).getDate()}`
        const total = await pengeluaranService.getTotalPengeluaran(startDate, endDate)
        expenseMonths.push({ key, total })
      }
      
      // Gabungkan
      const result = income.map((inc, idx) => ({
        bulan: inc.label,
        pemasukan: inc.total,
        pengeluaran: expenseMonths[idx]?.total || 0
      }))
      
      return result
    } catch (err) {
      console.error('getIncomeVsExpense error:', err)
      return []
    }
  },

  async getProyekAktif(limit = 4) {
    const { data, error } = await supabase
      .from('proyek')
      .select('id, nama_client, nama_proyek, status_produksi, total_harga, dp_dibayar')
      .in('status_produksi', ['antri', 'proses', 'qc', 'dikirim'])
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Proyek aktif error:', error)
      return []
    }

    const result = []
    for (const proyek of (data || [])) {
      const { data: produkData } = await supabase
        .from('proyek_produk')
        .select('nama_produk')
        .eq('proyek_id', proyek.id)
        .limit(1)
        .maybeSingle()
      
      result.push({
        ...proyek,
        produk_pertama: produkData?.nama_produk || 'Produk'
      })
    }
    return result
  },

  async getStokKritis(limit = 5) {
    const { data, error } = await supabase
      .from('stok_barang')
      .select('id, nama_bahan, stok_saat_ini, min_stok, satuan')
      .order('stok_saat_ini', { ascending: true })

    if (error) {
      console.error('Stok kritis error:', error)
      return []
    }

    const stokKritis = (data || []).filter(item => 
      (item.stok_saat_ini || 0) < (item.min_stok || 0)
    ).slice(0, limit)

    return stokKritis
  }
}