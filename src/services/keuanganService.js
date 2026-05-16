import { supabase } from './supabase'

export const keuanganService = {
  // Ambil semua proyek untuk keperluan rekap (tanpa filter owner)
  async getAllProyek() {
    const { data, error } = await supabase
      .from('proyek')
      .select('id, nama_client, total_harga, dp_dibayar, status_bayar, status_produksi, created_at')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  // Hitung rekap (total pemasukan, total tagihan, piutang, proyek aktif)
  getRekap(proyekList) {
    let totalPemasukan = 0
    let totalTagihan = 0
    let proyekAktif = 0
    const piutangData = []

    for (const proyek of proyekList) {
      totalPemasukan += proyek.dp_dibayar || 0
      totalTagihan += proyek.total_harga || 0
      if (proyek.status_produksi !== 'selesai') proyekAktif++
      const sisa = (proyek.total_harga || 0) - (proyek.dp_dibayar || 0)
      if (sisa > 0) {
        piutangData.push({
          client: proyek.nama_client,
          sisa: sisa,
          status: proyek.status_bayar
        })
      }
    }
    const totalPiutang = totalTagihan - totalPemasukan
    return { totalPemasukan, totalTagihan, totalPiutang, proyekAktif, piutangData }
  },

  // Data pemasukan per bulan (6 bulan terakhir) untuk chart
  async getMonthlyIncome() {
    const { data, error } = await supabase
      .from('proyek')
      .select('dp_dibayar, created_at')
    if (error) throw error

    const now = new Date()
    const months = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
      months.push({ key, label, total: 0 })
    }

    for (const proyek of data || []) {
      if (proyek.created_at) {
        const date = new Date(proyek.created_at)
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        const month = months.find(m => m.key === key)
        if (month) month.total += proyek.dp_dibayar || 0
      }
    }
    return months
  }
}