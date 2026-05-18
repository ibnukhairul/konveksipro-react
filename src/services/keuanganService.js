import { supabase } from './supabase'
import { pengeluaranService } from './pengeluaranService'

export const keuanganService = {
  async getAllProyek() {
    const { data, error } = await supabase
      .from('proyek')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  // 🔥 TAMBAHKAN: Ambil semua pengeluaran untuk export
  async getAllPengeluaran() {
    const { data, error } = await supabase
      .from('pengeluaran')
      .select('*')
      .order('tanggal', { ascending: false })
    if (error) throw error
    return data || []
  },

  getRekap(proyekList) {
    let totalPemasukan = 0
    let totalTagihan = 0
    let proyekAktif = 0
    const piutangData = []

    for (const proyek of proyekList) {
      totalPemasukan += proyek.dp_dibayar || 0
      totalTagihan += proyek.total_harga || 0
      if (proyek.status_produksi !== 'selesai') proyekAktif++

      const sisaTagihan = (proyek.total_harga || 0) - (proyek.dp_dibayar || 0)
      if (sisaTagihan > 0) {
        piutangData.push({
          client: proyek.nama_client,
          sisa: sisaTagihan,
          status: proyek.status_bayar
        })
      }
    }

    const totalPiutang = totalTagihan - totalPemasukan

    return {
      totalPemasukan,
      totalTagihan,
      totalPiutang,
      proyekAktif,
      piutangData
    }
  },

  async getMonthlyIncome() {
    const { data: proyekList, error } = await supabase
      .from('proyek')
      .select('dp_dibayar, created_at')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Monthly income error:', error)
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

  async getMonthlyExpense() {
    const now = new Date()
    const months = []
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const year = d.getFullYear()
      const month = d.getMonth() + 1
      const monthStr = String(month).padStart(2, '0')
      const key = `${year}-${monthStr}`
      const label = d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
      months.push({ key, label, total: 0, year, month })
    }

    const { data: pengeluaranList, error } = await supabase
      .from('pengeluaran')
      .select('tanggal, jumlah')

    if (error) {
      console.error('Monthly expense error:', error)
      return months
    }

    for (const item of (pengeluaranList || [])) {
      if (!item.tanggal) continue
      const date = new Date(item.tanggal)
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      const monthStr = String(month).padStart(2, '0')
      const key = `${year}-${monthStr}`
      
      const monthData = months.find(m => m.key === key)
      if (monthData) {
        monthData.total += item.jumlah || 0
      }
    }

    return months
  },

  async getIncomeVsExpense() {
    const income = await this.getMonthlyIncome()
    const expense = await this.getMonthlyExpense()
    
    const result = income.map((inc, idx) => ({
      bulan: inc.label,
      pemasukan: inc.total,
      pengeluaran: expense[idx]?.total || 0
    }))
    
    return result
  },

  async getTotalPengeluaran() {
    const { data, error } = await supabase
      .from('pengeluaran')
      .select('jumlah')
    
    if (error) {
      console.error('Total pengeluaran error:', error)
      return 0
    }
    
    const total = (data || []).reduce((sum, item) => sum + (item.jumlah || 0), 0)
    return total
  }
}