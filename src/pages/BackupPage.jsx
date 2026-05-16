import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { backupService } from '../services/backupService'
import { useToast } from '../hooks/useToast'

export default function BackupPage() {
  const { profile } = useAuth()
  const toast = useToast()
  const [exporting, setExporting] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [selectedTables, setSelectedTables] = useState({
    proyek: true,
    proyek_produk: true,
    stok_barang: true,
    log_stok: false,
    profiles: false
  })
  const [restoreMode, setRestoreMode] = useState('merge')
  const [previewData, setPreviewData] = useState(null)
  const [previewFileName, setPreviewFileName] = useState('')
  const [logs, setLogs] = useState([])

  const isAdmin = profile?.role === 'owner' || profile?.role === 'developer'

  const addLog = (message, type = 'info') => {
    const time = new Date().toLocaleTimeString('id-ID')
    setLogs(prev => [{ time, message, type }, ...prev].slice(0, 50))
  }

  const handleExport = async () => {
    const tables = Object.entries(selectedTables)
      .filter(([, enabled]) => enabled)
      .map(([name]) => name)

    if (tables.length === 0) {
      toast.warning('Pilih minimal satu tabel untuk di-backup')
      return
    }

    setExporting(true)
    addLog(`Memulai export: ${tables.join(', ')}`, 'info')

    try {
      const backup = await backupService.exportData(tables)
      const json = JSON.stringify(backup, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const tanggal = new Date().toISOString().split('T')[0]
      a.href = url
      a.download = `kpro-backup-${tanggal}.json`
      a.click()
      URL.revokeObjectURL(url)

      const totalRecords = Object.values(backup.tables).reduce((s, a) => s + a.length, 0)
      addLog(`✅ Export berhasil: ${totalRecords} records dari ${tables.length} tabel`, 'success')
      toast.success(`Backup berhasil! ${totalRecords} records diexport`)
    } catch (err) {
      addLog(`❌ Export gagal: ${err.message}`, 'error')
      toast.error('Gagal export: ' + err.message)
    } finally {
      setExporting(false)
    }
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    addLog(`Memilih file: ${file.name}`, 'info')

    try {
      const data = await backupService.validateBackupFile(file)
      setPreviewData(data)
      setPreviewFileName(file.name)
      addLog(`✅ File valid: ${Object.keys(data.tables).length} tabel, ${new Date(data.exported_at).toLocaleString()}`, 'success')
    } catch (err) {
      addLog(`❌ ${err.message}`, 'error')
      toast.error(err.message)
      setPreviewData(null)
    }
  }

  const handleRestore = async () => {
    if (!previewData) {
      toast.warning('Pilih file backup terlebih dahulu')
      return
    }

    const confirmMsg = restoreMode === 'overwrite'
      ? '⚠️ OVERWRITE: Data terkait akan DIHAPUS lalu diganti dengan data backup. Tidak bisa dibatalkan. Lanjutkan?'
      : '✅ MERGE: Data dari backup ditambahkan. Data yang sudah ada tidak ditimpa. Lanjutkan?'

    if (!window.confirm(confirmMsg)) return

    setRestoring(true)
    addLog(`Memulai restore (mode: ${restoreMode})...`, 'info')

    try {
      const results = await backupService.restoreData(previewData, restoreMode, (msg) => {
        addLog(msg, 'info')
      })

      if (results.success.length > 0) {
        addLog(`✅ Restore berhasil: ${results.success.join(', ')}`, 'success')
        toast.success(`Restore berhasil! ${results.success.length} tabel dipulihkan`)
      }
      if (results.failed.length > 0) {
        addLog(`⚠️ Gagal: ${results.failed.map(f => `${f.table} (${f.error})`).join(', ')}`, 'error')
        toast.warning('Beberapa tabel gagal direstore, cek log')
      }

      // Reset preview setelah restore
      setPreviewData(null)
      setPreviewFileName('')
      document.getElementById('restore-file-input').value = ''
    } catch (err) {
      addLog(`❌ Restore gagal: ${err.message}`, 'error')
      toast.error('Restore gagal: ' + err.message)
    } finally {
      setRestoring(false)
    }
  }

  if (!isAdmin) {
    return (
      <div>
        <div className="kpro-page-header">
          <div><h2 className="kpro-page-title">Backup & Restore</h2></div>
        </div>
        <div className="kpro-card">
          <div className="kpro-empty">
            <div className="kpro-empty-icon">🔒</div>
            <div className="kpro-empty-title">Akses Ditolak</div>
            <div className="kpro-empty-desc">Halaman ini hanya untuk Owner dan Developer</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="kpro-page-header">
        <div>
          <h2 className="kpro-page-title">Backup & Restore</h2>
          <p className="kpro-page-subtitle">Lindungi data dari kehilangan</p>
        </div>
      </div>

      {/* Banner Peringatan */}
      <div className="kpro-alert kpro-alert-warning kpro-mb-5">
        <span className="kpro-alert-icon">⚠️</span>
        <div>
          <div className="kpro-alert-title">Peringatan Penting!</div>
          <div>Supabase Free tier: Database akan di-pause setelah 7 hari tidak aktif. Disarankan backup minimal seminggu sekali dan simpan file di Google Drive atau komputer Anda.</div>
        </div>
      </div>

      <div className="kpro-row">
        {/* Kolom Export */}
        <div className="kpro-col-6">
          <div className="kpro-card">
            <div className="kpro-card-header">
              <span className="kpro-card-title">⬇️ Export Backup</span>
            </div>
            <div className="kpro-card-body">
              <div className="kpro-form-group">
                <label className="kpro-label">Pilih tabel yang ingin di-backup:</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: '#F8FAFC', borderRadius: '8px' }}>
                    <input type="checkbox" checked={selectedTables.proyek} onChange={e => setSelectedTables({...selectedTables, proyek: e.target.checked})} />
                    <div><strong>📋 Proyek</strong><div style={{ fontSize: '11px', color: '#64748B' }}>tabel proyek</div></div>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: '#F8FAFC', borderRadius: '8px' }}>
                    <input type="checkbox" checked={selectedTables.proyek_produk} onChange={e => setSelectedTables({...selectedTables, proyek_produk: e.target.checked})} />
                    <div><strong>🛍️ Produk Proyek</strong><div style={{ fontSize: '11px', color: '#64748B' }}>tabel proyek_produk</div></div>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: '#F8FAFC', borderRadius: '8px' }}>
                    <input type="checkbox" checked={selectedTables.stok_barang} onChange={e => setSelectedTables({...selectedTables, stok_barang: e.target.checked})} />
                    <div><strong>📦 Stok Barang</strong><div style={{ fontSize: '11px', color: '#64748B' }}>tabel stok_barang</div></div>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: '#F8FAFC', borderRadius: '8px' }}>
                    <input type="checkbox" checked={selectedTables.log_stok} onChange={e => setSelectedTables({...selectedTables, log_stok: e.target.checked})} />
                    <div><strong>📝 Log Stok</strong><div style={{ fontSize: '11px', color: '#64748B' }}>riwayat mutasi stok</div></div>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: '#F8FAFC', borderRadius: '8px' }}>
                    <input type="checkbox" checked={selectedTables.profiles} onChange={e => setSelectedTables({...selectedTables, profiles: e.target.checked})} />
                    <div><strong>👥 Data Tim</strong><div style={{ fontSize: '11px', color: '#64748B' }}>tabel profiles (tanpa password)</div></div>
                  </label>
                </div>
              </div>
              <button className="kpro-btn kpro-btn-primary" onClick={handleExport} disabled={exporting} style={{ width: '100%' }}>
                {exporting ? '⏳ Mengambil data...' : '⬇️ Download Backup Sekarang'}
              </button>
            </div>
          </div>
        </div>

        {/* Kolom Restore */}
        <div className="kpro-col-6">
          <div className="kpro-card">
            <div className="kpro-card-header">
              <span className="kpro-card-title">⬆️ Restore Backup</span>
            </div>
            <div className="kpro-card-body">
              <div className="kpro-form-group">
                <label className="kpro-label">Mode Restore:</label>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: restoreMode === 'merge' ? '#F0FDF4' : '#F8FAFC', borderRadius: '10px', border: restoreMode === 'merge' ? '2px solid #22C55E' : '1px solid #E2E8F0', cursor: 'pointer' }}>
                    <input type="radio" name="restoreMode" value="merge" checked={restoreMode === 'merge'} onChange={() => setRestoreMode('merge')} />
                    <div><strong>🔄 Merge</strong><div style={{ fontSize: '11px' }}>Data ditambahkan, tidak menimpa yang sudah ada</div></div>
                  </label>
                  <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: restoreMode === 'overwrite' ? '#FEF2F2' : '#F8FAFC', borderRadius: '10px', border: restoreMode === 'overwrite' ? '2px solid #EF4444' : '1px solid #E2E8F0', cursor: 'pointer' }}>
                    <input type="radio" name="restoreMode" value="overwrite" checked={restoreMode === 'overwrite'} onChange={() => setRestoreMode('overwrite')} />
                    <div><strong>⚠️ Overwrite</strong><div style={{ fontSize: '11px' }}>Data lama dihapus, diganti dengan backup</div></div>
                  </label>
                </div>
              </div>

              <input type="file" id="restore-file-input" accept=".json" style={{ display: 'none' }} onChange={handleFileSelect} />
              <button className="kpro-btn kpro-btn-warning" onClick={() => document.getElementById('restore-file-input').click()} disabled={restoring} style={{ width: '100%', marginBottom: '16px' }}>
                📂 Pilih File Backup (.json)
              </button>

              {/* Preview File */}
              {previewData && (
                <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '16px', marginTop: '16px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontWeight: 700, marginBottom: '8px' }}>📄 {previewFileName}</div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '12px' }}>
                    Dibuat: {new Date(previewData.exported_at).toLocaleString('id-ID')}<br />
                    Oleh: {previewData.exported_by || '-'}
                  </div>
                  <table style={{ width: '100%', fontSize: '12px' }}>
                    <thead><tr style={{ borderBottom: '1px solid #E2E8F0' }}><th style={{ textAlign: 'left', padding: '4px' }}>Tabel</th><th style={{ textAlign: 'right', padding: '4px' }}>Records</th></tr></thead>
                    <tbody>
                      {Object.entries(previewData.tables).map(([name, rows]) => (
                        <tr key={name}><td style={{ padding: '4px' }}>{name}</td><td style={{ textAlign: 'right', padding: '4px' }}>{rows.length}</td></tr>
                      ))}
                    </tbody>
                  </table>
                  <button className="kpro-btn kpro-btn-danger" onClick={handleRestore} disabled={restoring} style={{ width: '100%', marginTop: '16px' }}>
                    {restoring ? '⏳ Merestore...' : '✅ Konfirmasi Restore'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Log Aktivitas */}
      <div className="kpro-card kpro-mt-4">
        <div className="kpro-card-header">
          <span className="kpro-card-title">📋 Log Aktivitas</span>
          <button className="kpro-btn kpro-btn-sm kpro-btn-ghost" onClick={() => setLogs([])}>Kosongkan</button>
        </div>
        <div className="kpro-card-body" style={{ maxHeight: '200px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '12px' }}>
          {logs.length === 0 ? (
            <div className="kpro-text-muted" style={{ textAlign: 'center', padding: '20px' }}>Belum ada aktivitas</div>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} style={{ 
                padding: '6px 0', 
                borderBottom: '1px solid #E2E8F0',
                color: log.type === 'error' ? '#DC2626' : (log.type === 'success' ? '#16A34A' : '#475569')
              }}>
                <span style={{ color: '#94A3B8', marginRight: '12px' }}>[{log.time}]</span>
                {log.message}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}