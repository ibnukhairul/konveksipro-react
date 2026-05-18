import { supabase } from './supabase'

export const pengeluaranService = {
  // Ambil semua pengeluaran
  async getAll(filters = {}) {
    let query = supabase.from('pengeluaran').select('*').order('tanggal', { ascending: false })

    if (filters.tanggalMulai && filters.tanggalSelesai) {
      query = query.gte('tanggal', filters.tanggalMulai).lte('tanggal', filters.tanggalSelesai)
    }
    if (filters.kategori && filters.kategori !== '') {
      query = query.eq('kategori', filters.kategori)
    }
    if (filters.search && filters.search.trim() !== '') {
      query = query.ilike('deskripsi', `%${filters.search}%`)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  // Ambil detail pengeluaran by ID
  async getById(id) {
    const { data, error } = await supabase
      .from('pengeluaran')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  // Tambah pengeluaran
  async create(payload, userId) {
    const { data, error } = await supabase
      .from('pengeluaran')
      .insert({
        tanggal: payload.tanggal,
        kategori: payload.kategori,
        deskripsi: payload.deskripsi,
        jumlah: payload.jumlah,
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    if (error) throw error
    return data
  },

  // Update pengeluaran
  async update(id, payload) {
    const { data, error } = await supabase
      .from('pengeluaran')
      .update({
        tanggal: payload.tanggal,
        kategori: payload.kategori,
        deskripsi: payload.deskripsi,
        jumlah: payload.jumlah,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  // Hapus pengeluaran
  async delete(id) {
    const { error } = await supabase.from('pengeluaran').delete().eq('id', id)
    if (error) throw error
  },

  // Rekap pengeluaran per kategori (untuk chart)
  async getRekapPerKategori(tanggalMulai, tanggalSelesai) {
    let query = supabase.from('pengeluaran').select('kategori, jumlah')
    if (tanggalMulai && tanggalSelesai) {
      query = query.gte('tanggal', tanggalMulai).lte('tanggal', tanggalSelesai)
    }
    const { data, error } = await query
    if (error) throw error

    const rekap = {}
    for (const item of (data || [])) {
      if (!rekap[item.kategori]) {
        rekap[item.kategori] = 0
      }
      rekap[item.kategori] += item.jumlah
    }
    return Object.entries(rekap).map(([kategori, total]) => ({ kategori, total }))
  },

  // Rekap pengeluaran per bulan (untuk chart keuangan)
  async getRekapPerBulan(tahun = null) {
    const year = tahun || new Date().getFullYear()
    const { data, error } = await supabase
      .from('pengeluaran')
      .select('tanggal, jumlah')
      .gte('tanggal', `${year}-01-01`)
      .lte('tanggal', `${year}-12-31`)
    if (error) throw error

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
    const rekap = months.map((label, i) => ({
      label,
      bulan: i + 1,
      total: 0
    }))

    for (const item of (data || [])) {
      const bulan = new Date(item.tanggal).getMonth()
      rekap[bulan].total += item.jumlah
    }
    return rekap
  },

  // Total pengeluaran periode tertentu
  async getTotalPengeluaran(tanggalMulai, tanggalSelesai) {
    let query = supabase.from('pengeluaran').select('jumlah')
    if (tanggalMulai && tanggalSelesai) {
      query = query.gte('tanggal', tanggalMulai).lte('tanggal', tanggalSelesai)
    }
    const { data, error } = await query
    if (error) return 0
    return (data || []).reduce((sum, item) => sum + (item.jumlah || 0), 0)
  }
}