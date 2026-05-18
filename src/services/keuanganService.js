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

  // 🔥 Filter proyek berdasarkan periode
  filterProyekByPeriode(proyekList, periode, bulan, tahun) {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1

    return proyekList.filter(proyek => {
      const tanggal = new Date(proyek.tanggal_order || proyek.created_at)
      const tahunProyek = tanggal.getFullYear()
      const bulanProyek = tanggal.getMonth() + 1

      if (periode === 'bulan_ini') {
        return tahunProyek === currentYear && bulanProyek === currentMonth
      } else if (periode === 'tahun_ini') {
        return tahunProyek === currentYear
      } else if (periode === 'all_time') {
        return true
      } else if (periode === 'all_time_full_year') {
        return true
      } else if (periode === 'custom_bulan') {
        return tahunProyek === tahun && bulanProyek === bulan
      } else if (periode === 'custom_tahun') {
        return tahunProyek === tahun
      }
      return true
    })
  },

  // 🔥 Filter pengeluaran berdasarkan periode
  filterPengeluaranByPeriode(pengeluaranList, periode, bulan, tahun) {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1

    return pengeluaranList.filter(item => {
      const tanggal = new Date(item.tanggal)
      const tahunItem = tanggal.getFullYear()
      const bulanItem = tanggal.getMonth() + 1

      if (periode === 'bulan_ini') {
        return tahunItem === currentYear && bulanItem === currentMonth
      } else if (periode === 'tahun_ini') {
        return tahunItem === currentYear
      } else if (periode === 'all_time') {
        return true
      } else if (periode === 'all_time_full_year') {
        return true
      } else if (periode === 'custom_bulan') {
        return tahunItem === tahun && bulanItem === bulan
      } else if (periode === 'custom_tahun') {
        return tahunItem === tahun
      }
      return true
    })
  },

  // 🔥 Hitung total berdasarkan periode
  async getStatistikPerPeriode(periode, bulan = null, tahun = null) {
    const proyekList = await this.getAllProyek()
    const pengeluaranList = await this.getAllPengeluaran()

    const filteredProyek = this.filterProyekByPeriode(proyekList, periode, bulan, tahun)
    const filteredPengeluaran = this.filterPengeluaranByPeriode(pengeluaranList, periode, bulan, tahun)

    const totalPemasukan = filteredProyek.reduce((sum, p) => sum + (p.dp_dibayar || 0), 0)
    const totalPengeluaran = filteredPengeluaran.reduce((sum, p) => sum + (p.jumlah || 0), 0)
    const totalTagihan = filteredProyek.reduce((sum, p) => sum + (p.total_harga || 0), 0)
    const laba = totalPemasukan - totalPengeluaran
    const piutang = totalTagihan - totalPemasukan

    return {
      totalPemasukan,
      totalPengeluaran,
      totalTagihan,
      laba,
      piutang,
      jumlahProyek: filteredProyek.length,
      jumlahTransaksiPengeluaran: filteredPengeluaran.length
    }
  },

  // 🔥 Ambil data untuk grafik (bulanan dalam setahun)
  async getMonthlyDataForYear(tahun) {
    const proyekList = await this.getAllProyek()
    const pengeluaranList = await this.getAllPengeluaran()

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
    const result = []

    for (let i = 0; i < 12; i++) {
      const bulan = i + 1
      const filteredProyek = proyekList.filter(p => {
        const tanggal = new Date(p.tanggal_order || p.created_at)
        return tanggal.getFullYear() === tahun && tanggal.getMonth() + 1 === bulan
      })
      const filteredPengeluaran = pengeluaranList.filter(p => {
        const tanggal = new Date(p.tanggal)
        return tanggal.getFullYear() === tahun && tanggal.getMonth() + 1 === bulan
      })

      const pemasukan = filteredProyek.reduce((sum, p) => sum + (p.dp_dibayar || 0), 0)
      const pengeluaran = filteredPengeluaran.reduce((sum, p) => sum + (p.jumlah || 0), 0)

      result.push({
        bulan: months[i],
        pemasukan,
        pengeluaran,
        laba: pemasukan - pengeluaran
      })
    }

    return result
  },

  // 🔥 Ambil ringkasan tahunan untuk chart line multi-tahun
  async getYearlySummary() {
    const proyekList = await this.getAllProyek()
    const pengeluaranList = await this.getAllPengeluaran()

    const tahunMap = new Map()

    for (const proyek of proyekList) {
      const tahun = new Date(proyek.tanggal_order || proyek.created_at).getFullYear()
      if (!tahunMap.has(tahun)) {
        tahunMap.set(tahun, { pemasukan: 0, pengeluaran: 0 })
      }
      tahunMap.get(tahun).pemasukan += proyek.dp_dibayar || 0
    }

    for (const item of pengeluaranList) {
      const tahun = new Date(item.tanggal).getFullYear()
      if (!tahunMap.has(tahun)) {
        tahunMap.set(tahun, { pemasukan: 0, pengeluaran: 0 })
      }
      tahunMap.get(tahun).pengeluaran += item.jumlah || 0
    }

    const result = []
    for (const [tahun, data] of tahunMap) {
      result.push({
        tahun,
        pemasukan: data.pemasukan,
        pengeluaran: data.pengeluaran,
        laba: data.pemasukan - data.pengeluaran
      })
    }

    return result.sort((a, b) => a.tahun - b.tahun)
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