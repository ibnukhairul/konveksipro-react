import { supabase } from './supabase'

export const akunService = {
  async updateProfile(userId, updates) {
    const allowedUpdates = ['nama_lengkap', 'no_hp', 'alamat']
    const cleanUpdates = {}
    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) cleanUpdates[key] = updates[key]
    }
    cleanUpdates.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('profiles')
      .update(cleanUpdates)
      .eq('id', userId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  },

  async getProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (error) throw error
    return data
  }
}