import { supabase } from './supabase'

export const auth = {
  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  },

  // 🔥 TAMBAHKAN FUNGSI REGISTER
  async register(email, password, namaLengkap) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nama_lengkap: namaLengkap },
        emailRedirectTo: window.location.origin + '/login'
      }
    })
    if (error) throw error
    return data
  },

  async logout() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async getSession() {
    const { data } = await supabase.auth.getSession()
    return data.session
  },

  async getCurrentUser() {
    const { data } = await supabase.auth.getUser()
    return data.user
  },

  async getProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error

    if (data.is_active === false) {
      throw new Error('Akun Anda telah dinonaktifkan')
    }

    if (!data.role) {
      await this.updateProfile(userId, { role: 'team' })
      data.role = 'team'
    }

    return data
  },

  async updateProfile(userId, updates) {
    if (updates.role && !['owner', 'developer', 'team'].includes(updates.role)) {
      throw new Error('Role tidak valid')
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  onAuthChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  }
}