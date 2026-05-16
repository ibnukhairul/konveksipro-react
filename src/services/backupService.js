import { supabase } from './supabase'

export const backupService = {
  // Export data dari tabel yang dipilih
  async exportData(tables) {
    const backup = {
      version: '1.0',
      app: 'KonveksiPro',
      exported_at: new Date().toISOString(),
      exported_by: null, // akan diisi dari auth
      tables: {}
    }

    // Ambil user info
    const session = await supabase.auth.getSession()
    if (session.data.session) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('nama_lengkap')
        .eq('id', session.data.session.user.id)
        .single()
      backup.exported_by = profile?.nama_lengkap || 'unknown'
    }

    // Export setiap tabel yang dipilih
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .order('created_at', { ascending: true })
      
      if (error) throw new Error(`Gagal export ${table}: ${error.message}`)
      backup.tables[table] = data || []
    }

    return backup
  },

  // Restore data dari file backup
  async restoreData(backupData, mode = 'merge', onProgress) {
    const results = { success: [], failed: [] }
    const tables = ['profiles', 'stok_barang', 'proyek', 'proyek_produk', 'log_stok']
    
    // Urutan restore yang benar (hindari foreign key error)
    const tableOrder = ['profiles', 'stok_barang', 'proyek', 'proyek_produk', 'log_stok']

    for (const table of tableOrder) {
      const rows = backupData.tables[table]
      if (!rows || rows.length === 0) continue

      if (onProgress) onProgress(`Restore ${table} (${rows.length} records)...`)

      if (mode === 'overwrite') {
        // Hapus data lama di tabel (kecuali profiles tidak dihapus semua)
        if (table !== 'profiles') {
          const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000')
          if (error) {
            results.failed.push({ table, error: error.message })
            continue
          }
        }
      }

      // Insert/upsert data
      for (let i = 0; i < rows.length; i += 50) {
        const batch = rows.slice(i, i + 50)
        const { error } = await supabase
          .from(table)
          .upsert(batch, { onConflict: 'id', ignoreDuplicates: mode === 'merge' })
        
        if (error) {
          results.failed.push({ table, error: error.message })
          break
        }
      }

      if (!results.failed.some(f => f.table === table)) {
        results.success.push(table)
      }
    }

    return results
  },

  // Validasi file backup
  validateBackupFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result)
          if (!data.version || !data.tables || !data.exported_at) {
            reject(new Error('Format file backup tidak valid'))
          }
          resolve(data)
        } catch (err) {
          reject(new Error('File bukan JSON yang valid: ' + err.message))
        }
      }
      reader.onerror = () => reject(new Error('Gagal membaca file'))
      reader.readAsText(file)
    })
  }
}