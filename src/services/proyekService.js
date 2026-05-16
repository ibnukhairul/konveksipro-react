import { supabase } from './supabase'

export const proyekService = {
  // Ambil semua proyek (untuk tabel list)
  async getAll(filter = {}) {
    let query = supabase.from('proyek').select('*')
    
    if (filter.status_bayar && filter.status_bayar !== '') {
      query = query.eq('status_bayar', filter.status_bayar)
    }
    if (filter.status_produksi && filter.status_produksi !== '') {
      query = query.eq('status_produksi', filter.status_produksi)
    }
    if (filter.search && filter.search.trim() !== '') {
      query = query.ilike('nama_client', `%${filter.search}%`)
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  // Ambil detail proyek + produk
  async getById(id) {
    const { data: proyek, error: proyekError } = await supabase
      .from('proyek')
      .select('*')
      .eq('id', id)
      .single()
    if (proyekError) throw proyekError
    if (!proyek) throw new Error('Proyek tidak ditemukan')

    const { data: produkList, error: produkError } = await supabase
      .from('proyek_produk')
      .select('*')
      .eq('proyek_id', id)
      .order('created_at', { ascending: true })
    if (produkError) throw produkError

    return { ...proyek, produk_list: produkList || [] }
  },

  // Buat proyek baru
  async buat(payload, produkList) {
    const session = await supabase.auth.getSession()
    const ownerId = session.data.session?.user?.id
    if (!ownerId) throw new Error('User tidak ditemukan')

    const proyekPayload = {
      nama_client: payload.nama_client,
      no_wa: payload.no_wa || null,
      tanggal_order: payload.tanggal_order || new Date().toISOString().split('T')[0],
      sumber_info: payload.sumber_info || null,
      instansi: payload.instansi || null,
      organisasi: payload.organisasi || null,
      jabatan: payload.jabatan || null,
      nama_proyek: payload.nama_proyek,
      total_harga: payload.total_harga || 0,
      dp_dibayar: payload.dp_dibayar || 0,
      status_bayar: payload.status_bayar || 'belum_dp',
      status_produksi: payload.status_produksi || 'antri',
      catatan: payload.catatan || '',
      nota_number: payload.nota_number || null,
      owner_id: ownerId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: proyekBaru, error } = await supabase
      .from('proyek')
      .insert(proyekPayload)
      .select()
      .single()
    if (error) throw error

    if (produkList && produkList.length > 0) {
      const produkWithId = produkList.map(p => ({
        proyek_id: proyekBaru.id,
        brand: p.brand,
        nama_produk: p.nama_produk,
        jumlah_pcs: p.jumlah_pcs,
        harga_satuan: p.harga_satuan,
        subtotal: p.jumlah_pcs * p.harga_satuan,
        keterangan: p.keterangan || null
      }))
      const { error: produkError } = await supabase.from('proyek_produk').insert(produkWithId)
      if (produkError) throw produkError
    }

    return proyekBaru
  },

  // Update proyek (termasuk produk)
  async update(id, updates, produkList) {
    // Update tabel proyek
    const allowedFields = [
      'nama_client', 'no_wa', 'tanggal_order', 'sumber_info',
      'instansi', 'organisasi', 'jabatan', 'nama_proyek',
      'total_harga', 'dp_dibayar', 'status_bayar', 'status_produksi', 'catatan'
    ]
    const cleanUpdates = {}
    for (const key of allowedFields) {
      if (updates[key] !== undefined) cleanUpdates[key] = updates[key]
    }
    cleanUpdates.updated_at = new Date().toISOString()

    const { error: updateError } = await supabase
      .from('proyek')
      .update(cleanUpdates)
      .eq('id', id)
    if (updateError) throw updateError

    // Update produk: hapus semua, insert ulang
    if (produkList !== undefined) {
      await supabase.from('proyek_produk').delete().eq('proyek_id', id)
      if (produkList.length > 0) {
        const produkBaru = produkList.map(p => ({
          proyek_id: id,
          brand: p.brand,
          nama_produk: p.nama_produk,
          jumlah_pcs: p.jumlah_pcs,
          harga_satuan: p.harga_satuan,
          subtotal: p.jumlah_pcs * p.harga_satuan,
          keterangan: p.keterangan || null
        }))
        const { error: produkError } = await supabase.from('proyek_produk').insert(produkBaru)
        if (produkError) throw produkError
      }
    }

    // Ambil data terbaru
    const { data: updated } = await supabase.from('proyek').select('*').eq('id', id).single()
    return updated
  },

  // Hapus proyek
  async hapus(id) {
    const { error } = await supabase.from('proyek').delete().eq('id', id)
    if (error) throw error
  }
}