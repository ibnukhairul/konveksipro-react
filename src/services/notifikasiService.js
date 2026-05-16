import { supabase } from './supabase'

export const notifikasiService = {
  async getAll(userId) {
    const { data: notifikasi, error: notifError } = await supabase
      .from('notifikasi_global')
      .select('*')
      .order('created_at', { ascending: false })
    if (notifError) throw notifError

    // Ambil status baca untuk user ini
    const { data: readStatus, error: readError } = await supabase
      .from('notifikasi_user_read')
      .select('notifikasi_id')
      .eq('user_id', userId)
    if (readError) throw readError

    const readSet = new Set(readStatus.map(r => r.notifikasi_id))
    return notifikasi.map(n => ({ ...n, is_read: readSet.has(n.id) }))
  },

  async buatGlobal(payload) {
    if (!payload.judul?.trim()) throw new Error('Judul notifikasi wajib diisi')
    const { data, error } = await supabase
      .from('notifikasi_global')
      .insert({
        judul: payload.judul,
        pesan: payload.pesan || '',
        tipe: payload.tipe || 'info',
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    if (error) throw error
    return data
  },

  // ✅ PERBAIKAN: Tandai satu notifikasi sebagai sudah dibaca oleh user tertentu
  async markAsRead(notifikasiId, userId) {
    // Cek apakah sudah ada entri
    const { data: existing } = await supabase
      .from('notifikasi_user_read')
      .select('id')
      .eq('notifikasi_id', notifikasiId)
      .eq('user_id', userId)
      .maybeSingle()

    if (existing) return // sudah dibaca

    const { error } = await supabase
      .from('notifikasi_user_read')
      .insert({
        notifikasi_id: notifikasiId,
        user_id: userId,
        read_at: new Date().toISOString()
      })
    if (error) throw error
  },

  // ✅ PERBAIKAN: Tandai semua notifikasi sebagai sudah dibaca oleh user
  async markAllRead(userId) {
    // Ambil semua notifikasi global
    const { data: notifikasi, error: notifError } = await supabase
      .from('notifikasi_global')
      .select('id')
    if (notifError) throw notifError

    // Ambil yang sudah dibaca oleh user ini
    const { data: alreadyRead, error: readError } = await supabase
      .from('notifikasi_user_read')
      .select('notifikasi_id')
      .eq('user_id', userId)
    if (readError) throw readError

    const alreadyReadSet = new Set(alreadyRead.map(r => r.notifikasi_id))
    
    // Filter notifikasi yang belum dibaca
    const toInsert = notifikasi
      .filter(n => !alreadyReadSet.has(n.id))
      .map(n => ({
        notifikasi_id: n.id,
        user_id: userId,
        read_at: new Date().toISOString()
      }))

    if (toInsert.length > 0) {
      const { error } = await supabase.from('notifikasi_user_read').insert(toInsert)
      if (error) throw error
    }
  },

  async getUnreadCount(userId) {
    // Ambil semua notifikasi global
    const { data: notifikasi, error: notifError } = await supabase
      .from('notifikasi_global')
      .select('id')
    if (notifError) throw notifError

    // Ambil yang sudah dibaca oleh user ini
    const { data: readStatus, error: readError } = await supabase
      .from('notifikasi_user_read')
      .select('notifikasi_id')
      .eq('user_id', userId)
    if (readError) throw readError

    const readSet = new Set(readStatus.map(r => r.notifikasi_id))
    return notifikasi.filter(n => !readSet.has(n.id)).length
  },

  subscribe(onReceive) {
    const channelName = `notifikasi-${Date.now()}`
    console.log('🎧 Membuka channel:', channelName)
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifikasi_global'
        },
        (payload) => {
          console.log('📨 Notifikasi baru:', payload.new)
          if (onReceive) onReceive(payload.new)
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time notifikasi aktif')
        }
        if (err) {
          console.error('❌ Subscribe error:', err)
        }
      })

    return channel
  }
}