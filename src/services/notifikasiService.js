import { supabase } from './supabase'

export const notifikasiService = {
  // Ambil notifikasi untuk user tertentu
  async getAll(userId) {
    const { data, error } = await supabase
      .from('notifikasi')
      .select('*')
      .or(`user_id.eq.${userId},user_id.is.null`)
      .order('created_at', { ascending: false })
      .limit(100)
    
    if (error) throw error
    return data || []
  },

  // Buat notifikasi (otomatis mengisi created_by_name)
  async buat(payload) {
    if (!payload.judul?.trim()) throw new Error('Judul notifikasi wajib diisi')
    
    // Dapatkan user yang sedang login
    const session = await supabase.auth.getSession()
    const createdBy = session.data.session?.user?.id
    
    // 🔥 Ambil nama user untuk denormalisasi
    let createdByName = null
    if (createdBy) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('nama_lengkap')
        .eq('id', createdBy)
        .single()
      createdByName = profile?.nama_lengkap || 'System'
    }
    
    const notifPayload = {
      user_id: payload.user_id || null,
      created_by: createdBy,
      created_by_name: createdByName,  // ← simpan nama
      judul: payload.judul,
      pesan: payload.pesan || '',
      tipe: payload.tipe || 'info',
      is_read: false,
      is_urgent: payload.is_urgent || false,
      action_url: payload.action_url || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const { data, error } = await supabase
      .from('notifikasi')
      .insert(notifPayload)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async markAsRead(notifikasiId, userId) {
    const { error } = await supabase
      .from('notifikasi')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('id', notifikasiId)
      .eq('user_id', userId)
    
    if (error) throw error
  },

  async markAllRead(userId) {
    const { error } = await supabase
      .from('notifikasi')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_read', false)
    
    if (error) throw error
  },

  async getUnreadCount(userId) {
    const { count, error } = await supabase
      .from('notifikasi')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)
    
    if (error) return 0
    return count || 0
  },

   subscribe(userId, onReceive) {
    console.log(`📡 Membuka channel realtime untuk user: ${userId}`)
    
    // Gunakan channel dengan nama unik
    const channelName = `notifikasi-${userId}-${Date.now()}`
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifikasi'
          // 🔥 HAPUS filter dulu untuk debugging, nanti bisa ditambahkan lagi
        },
        (payload) => {
          const newNotif = payload.new
          console.log('🔔 Raw payload:', payload)
          console.log('🔔 Notifikasi baru:', newNotif)
          console.log('🔔 User ID target:', newNotif.user_id)
          console.log('🔔 Current user ID:', userId)
          
          // Filter manual di frontend (sementara untuk debugging)
          if (newNotif.user_id === userId || newNotif.user_id === null) {
            console.log('✅ Notifikasi relevan untuk user ini')
            if (onReceive && typeof onReceive === 'function') {
              onReceive(newNotif)
            }
          } else {
            console.log('⏭️ Notifikasi untuk user lain, diabaikan')
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime notifikasi AKTIF untuk channel:', channelName)
        }
        if (err) {
          console.error('❌ Subscribe error:', err)
        }
      })
    
    return channel
  }
}