import { supabase } from './supabase'

export const dashboardService = {
  // Ambil ringkasan data dashboard
  async getRingkasan() {
    try {
      // Ambil semua stok
      const { data: stokData, error: stokError } = await supabase
        .from('stok_barang')
        .select('stok_saat_ini, min_stok')
      if (stokError) throw stokError

      // Ambil semua proyek untuk rekap keuangan
      const { data: proyekData, error: proyekError } = await supabase
        .from('proyek')
        .select('total_harga, dp_dibayar, status_produksi, created_at')
      if (proyekError) throw proyekError

      // Hitung stok kritis
      const stokList = stokData || []
      const stokKritis = stokList.filter(s => (s.stok_saat_ini || 0) < (s.min_stok || 0)).length
      const totalStok = stokList.reduce((sum, s) => sum + (s.stok_saat_ini || 0), 0)

      // Hitung rekap keuangan
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

      // Hitung omzet bulan ini
      const now = new Date()
      const bulanIni = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      const omzetBulanIni = proyekList
        .filter(p => p.created_at?.startsWith(bulanIni))
        .reduce((sum, p) => sum + (p.dp_dibayar || 0), 0)

      return {
        totalStok,
        stokKritis,
        proyekAktif,
        omzetBulanIni,
        piutang
      }
    } catch (err) {
      console.error('Dashboard ringkasan error:', err)
      return { totalStok: 0, stokKritis: 0, proyekAktif: 0, omzetBulanIni: 0, piutang: 0 }
    }
  },

  // Ambil data omzet per bulan (6 bulan terakhir)
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

  // Ambil proyek aktif untuk progress bar
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

    // Ambil produk pertama untuk setiap proyek (opsional)
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

  // 🔥 PERBAIKAN: Ambil stok kritis tanpa supabase.raw
  async getStokKritis(limit = 5) {
    // Ambil semua stok, lalu filter di JavaScript
    const { data, error } = await supabase
      .from('stok_barang')
      .select('id, nama_bahan, stok_saat_ini, min_stok, satuan')
      .order('stok_saat_ini', { ascending: true })

    if (error) {
      console.error('Stok kritis error:', error)
      return []
    }

    // Filter stok yang stok_saat_ini < min_stok
    const stokKritis = (data || []).filter(item => 
      (item.stok_saat_ini || 0) < (item.min_stok || 0)
    ).slice(0, limit)

    return stokKritis
  }
}