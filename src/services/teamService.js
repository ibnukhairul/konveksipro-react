import { supabase } from './supabase'

export const teamService = {
  // Ambil semua profil (kecuali password)
  async getAll() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, nama_lengkap, no_hp, alamat, role, is_active, created_at, updated_at')
      .order('created_at', { ascending: true })
    if (error) throw error
    return data || []
  },

  // Update role user
  async updateRole(userId, newRole) {
    if (!['owner', 'developer', 'team'].includes(newRole)) {
      throw new Error('Role tidak valid')
    }
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', userId)
    if (error) throw error
  },

  // Aktifkan/nonaktifkan user
  async toggleActive(userId, isActive) {
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', userId)
    if (error) throw error
  },

  // Dapatkan informasi user saat ini (untuk cek akses)
  async getCurrentUserRole(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()
    if (error) throw error
    return data?.role || 'team'
  }
}