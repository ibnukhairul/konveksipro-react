import { supabase } from './supabase'
import { notifikasiService } from './notifikasiService'

export const stokService = {
  async getAll(filter = {}) {
    let query = supabase.from('stok_barang').select('*')

    //HAPUS filter search dari backend
    // Hanya filter kategori jika diperlukan
    if (filter.kategori) query = query.eq('kategori', filter.kategori)

    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async getAllRaw() {
    const { data, error } = await supabase.from('stok_barang').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async catatLogStok({ stok_id, user_id, jenis, jumlah, stok_sebelum, stok_sesudah, catatan }) {
    const { error } = await supabase.from('log_stok').insert({
      stok_id,
      user_id,
      jenis,
      jumlah,
      stok_sebelum,
      stok_sesudah,
      catatan: catatan || '',
      created_at: new Date().toISOString()
    })
    if (error) console.error('Gagal catat log:', error)
  },

  async tambahBahan(payload) {
    const { data: existing, error: checkError } = await supabase
      .from('stok_barang')
      .select('id')
      .eq('nama_bahan', payload.nama_bahan)
      .eq('gramasi', payload.gramasi || null)
      .eq('kategori', payload.kategori)
      .eq('size', payload.size || null)
      .maybeSingle()
    if (checkError) throw checkError
    if (existing) throw new Error(`Produk "${payload.nama_bahan}" dengan spesifikasi yang sama sudah ada!`)
    const { data, error } = await supabase.from('stok_barang').insert(payload).select().single()
    if (error) throw error
    return data
  },

  async updateBahan(id, updates) {
    const { data: existing, error: checkError } = await supabase
      .from('stok_barang')
      .select('id')
      .eq('nama_bahan', updates.nama_bahan)
      .eq('gramasi', updates.gramasi || null)
      .eq('kategori', updates.kategori)
      .eq('size', updates.size || null)
      .neq('id', id)
      .maybeSingle()
    if (checkError) throw checkError
    if (existing) throw new Error(`Produk dengan spesifikasi yang sama sudah ada!`)
    const { data, error } = await supabase.from('stok_barang').update(updates).eq('id', id).select().single()
    if (error) throw error
    return data
  },

  async tambahStok(id, jumlah, userId, catatan = '') {
    const { data: barang, error: errGet } = await supabase
      .from('stok_barang')
      .select('stok_saat_ini, nama_bahan')
      .eq('id', id)
      .single()
    if (errGet) throw errGet

    const stokSebelum = barang.stok_saat_ini
    const stokSesudah = stokSebelum + jumlah

    const { error: errUpdate } = await supabase
      .from('stok_barang')
      .update({ stok_saat_ini: stokSesudah })
      .eq('id', id)
    if (errUpdate) throw errUpdate

    await this.catatLogStok({
      stok_id: id,
      user_id: userId,
      jenis: 'tambah',
      jumlah,
      stok_sebelum: stokSebelum,
      stok_sesudah: stokSesudah,
      catatan
    })

    //NOTIFIKASI - GUNAKAN buatGlobal
    let pesanNotif = `menambah stok ${barang.nama_bahan} +${jumlah} unit (sekarang: ${stokSesudah})`
    if (catatan?.trim()) pesanNotif += `\nCatatan: ${catatan}`

    await notifikasiService.buat({
      user_id: null,  // broadcast ke semua user (owner, developer, team)
      judul: 'Stok Ditambah',
      pesan: pesanNotif,
      tipe: 'success',
      is_urgent: false,
      action_url: '/stok'
    })

    return stokSesudah
  },

  async ambilStok(id, jumlah, userId, catatan = '') {
    const { data: barang, error: errGet } = await supabase
      .from('stok_barang')
      .select('stok_saat_ini, nama_bahan, min_stok')
      .eq('id', id)
      .single()
    if (errGet) throw errGet
    if (barang.stok_saat_ini < jumlah) throw new Error(`Stok tidak cukup. Tersedia: ${barang.stok_saat_ini}`)

    const stokSebelum = barang.stok_saat_ini
    const stokSesudah = stokSebelum - jumlah

    const { error: errUpdate } = await supabase
      .from('stok_barang')
      .update({ stok_saat_ini: stokSesudah })
      .eq('id', id)
    if (errUpdate) throw errUpdate

    await this.catatLogStok({
      stok_id: id,
      user_id: userId,
      jenis: 'ambil',
      jumlah,
      stok_sebelum: stokSebelum,
      stok_sesudah: stokSesudah,
      catatan
    })

    //NOTIFIKASI - GUNAKAN buatGlobal
    let pesanNotif = `mengambil stok ${barang.nama_bahan} -${jumlah} unit (sekarang: ${stokSesudah})`
    if (catatan?.trim()) pesanNotif += `\nCatatasssn: ${catatan}`

    let tipeNotif = 'warning'
    if (stokSesudah < barang.min_stok) tipeNotif = 'danger'

    if (stokSesudah < barang.min_stok) {
      await notifikasiService.buat({
        user_id: null,  // broadcast ke semua
        judul: 'Stok Kritis',
        pesan: pesanNotif,
        tipe: 'danger',
        is_urgent: true,  //notifikasi penting
        action_url: '/stok'
      })
    }else{
      await notifikasiService.buat({
        user_id: null,  // broadcast ke semua
        judul: 'Stok Diambil',
        pesan: pesanNotif,
        tipe: 'success',
        is_urgent: true,
        action_url: '/stok'
      })
    }
    

    return stokSesudah
  },

  async hapusBahan(id, userId, catatan = '') {
    const { data: barang, error: errGet } = await supabase
      .from('stok_barang')
      .select('nama_bahan, gramasi, size, stok_saat_ini')
      .eq('id', id)
      .single()
    if (errGet) throw errGet

    const { error } = await supabase.from('stok_barang').delete().eq('id', id)
    if (error) throw error

    let pesanNotif = `${barang.nama_bahan}`
    if (barang.gramasi) pesanNotif += ` (${barang.gramasi})`
    if (barang.size) pesanNotif += ` - Ukuran: ${barang.size}`
    pesanNotif += ` telah dihapus dari sistem. (Stok terakhir: ${barang.stok_saat_ini})`
    if (catatan?.trim()) pesanNotif += `\n📝 Catatan: ${catatan}`

    await notifikasiService.buatGlobal({
      user_id: null,  // broadcast ke semua
      judul: '🗑 Stok Dihapus',
      pesan: pesanNotif,
      tipe: 'danger',
      is_urgent: true,  //notifikasi penting
      action_url: '/stok'
    })
  }
}