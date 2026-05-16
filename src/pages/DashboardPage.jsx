import { useState, useEffect } from 'react'
import { dashboardService } from '../services/dashboardService'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function DashboardPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [ringkasan, setRingkasan] = useState({
    totalStok: 0,
    stokKritis: 0,
    proyekAktif: 0,
    omzetBulanIni: 0,
    piutang: 0
  })
  const [omzetChart, setOmzetChart] = useState([])
  const [proyekAktifList, setProyekAktifList] = useState([])
  const [stokKritisList, setStokKritisList] = useState([])
  const [loading, setLoading] = useState(true)

  const isTeam = profile?.role === 'team'

  const formatRupiah = (num) => `Rp ${Math.round(num || 0).toLocaleString('id-ID')}`

  const getProgressPercent = (status) => {
    const progress = {
      antri: 5,
      proses: 45,
      qc: 80,
      dikirim: 95,
      selesai: 100
    }
    return progress[status] || 0
  }

  const getProgressColor = (status) => {
    const colors = {
      antri: '',
      proses: 'kpro-progress-warning',
      qc: '',
      dikirim: 'kpro-progress-success',
      selesai: 'kpro-progress-success'
    }
    return colors[status] || ''
  }

  const getStatusLabel = (status) => {
    const labels = {
      antri: 'Antri',
      proses: 'Proses',
      qc: 'QC',
      dikirim: 'Dikirim',
      selesai: 'Selesai'
    }
    return labels[status] || status
  }

  const loadDashboard = async () => {
    setLoading(true)
    try {
      const [ringkasanData, omzetData, proyekData, stokData] = await Promise.all([
        dashboardService.getRingkasan(),
        dashboardService.getOmzetPerBulan(),
        dashboardService.getProyekAktif(),
        dashboardService.getStokKritis()
      ])
      setRingkasan(ringkasanData)
      setOmzetChart(omzetData)
      setProyekAktifList(proyekData)
      setStokKritisList(stokData)
    } catch (err) {
      console.error('Load dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  // Hitung max untuk chart
  const maxOmzet = Math.max(...omzetChart.map(m => m.total), 1)

  if (loading) {
    return <div className="kpro-empty">🔄 Memuat dashboard...</div>
  }

  return (
    <div>
      <div className="kpro-page-header">
        <div>
          <h2 className="kpro-page-title">Dashboard</h2>
          <p className="kpro-page-subtitle">Ringkasan aktivitas usaha</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="kpro-stats-grid kpro-mb-6">
        <div className="kpro-stat-card">
          <div className="kpro-d-flex kpro-justify-between kpro-align-center kpro-mb-3">
            <div className="kpro-stat-label">Proyek Aktif</div>
            <div className="kpro-stat-icon kpro-stat-icon-green">◈</div>
          </div>
          <div className="kpro-stat-value">{ringkasan.proyekAktif}</div>
          <div className="kpro-stat-change">proyek berjalan</div>
        </div>
        <div className="kpro-stat-card">
          <div className="kpro-d-flex kpro-justify-between kpro-align-center kpro-mb-3">
            <div className="kpro-stat-label">Omzet Bulan Ini</div>
            <div className="kpro-stat-icon kpro-stat-icon-amber">◑</div>
          </div>
          <div className="kpro-stat-value">{formatRupiah(ringkasan.omzetBulanIni)}</div>
          <div className="kpro-stat-change">bulan berjalan</div>
        </div>
        <div className="kpro-stat-card">
          <div className="kpro-d-flex kpro-justify-between kpro-align-center kpro-mb-3">
            <div className="kpro-stat-label">Piutang</div>
            <div className="kpro-stat-icon kpro-stat-icon-red">💰</div>
          </div>
          <div className="kpro-stat-value">{formatRupiah(ringkasan.piutang)}</div>
          <div className="kpro-stat-change">belum dilunasi</div>
        </div>
        <div className="kpro-stat-card">
          <div className="kpro-d-flex kpro-justify-between kpro-align-center kpro-mb-3">
            <div className="kpro-stat-label">Stok Kritis</div>
            <div className="kpro-stat-icon kpro-stat-icon-red">⚠</div>
          </div>
          <div className="kpro-stat-value" style={{ color: ringkasan.stokKritis > 0 ? 'var(--kpro-danger)' : 'inherit' }}>
            {ringkasan.stokKritis}
          </div>
          <div className="kpro-stat-change">⚠ perlu restock</div>
        </div>
      </div>

      <div className="kpro-row kpro-mb-5">
        {/* Grafik Omzet */}
        <div className="kpro-col-6">
          <div className="kpro-card">
            <div className="kpro-card-header">
              <span className="kpro-card-title">📊 Omzet 6 Bulan Terakhir</span>
              {!isTeam && (
                <button className="kpro-btn kpro-btn-ghost kpro-btn-sm" onClick={() => navigate('/keuangan')} style={{ fontSize: '12px' }}>
                  Lihat detail →
                </button>
              )}
            </div>
            <div className="kpro-card-body">
              <div className="kpro-bar-chart" style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '200px', padding: '8px 0' }}>
                {omzetChart.map((month, idx) => {
                  const heightPercent = Math.max(5, Math.round((month.total / maxOmzet) * 100))
                  let displayValue = ''
                  if (month.total >= 1000000) displayValue = (month.total / 1000000).toFixed(1) + 'jt'
                  else if (month.total >= 1000) displayValue = (month.total / 1000).toFixed(0) + 'rb'
                  else displayValue = month.total > 0 ? month.total.toString() : '0'
                  return (
                    <div key={idx} className="kpro-bar-wrap" style={{ flex: 1, textAlign: 'center' }}>
                      <div className="kpro-bar-value" style={{ fontSize: '10px', marginBottom: '4px' }}>{displayValue}</div>
                      <div className="kpro-bar kpro-bar-blue" style={{ height: `${heightPercent}%`, width: '100%', maxWidth: '50px', margin: '0 auto', borderRadius: '4px 4px 0 0' }}></div>
                      <div className="kpro-bar-label" style={{ fontSize: '10px', marginTop: '4px' }}>{month.label}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Progres Proyek Aktif */}
        <div className="kpro-col-6">
          <div className="kpro-card">
            <div className="kpro-card-header">
              <span className="kpro-card-title">📋 Progres Proyek Aktif</span>
              {!isTeam && (
                <button className="kpro-btn kpro-btn-ghost kpro-btn-sm" onClick={() => navigate('/proyek')} style={{ fontSize: '12px' }}>
                  Lihat semua →
                </button>
              )}
            </div>
            <div className="kpro-card-body">
              {proyekAktifList.length === 0 ? (
                <div className="kpro-text-muted" style={{ padding: '20px 0', textAlign: 'center' }}>Belum ada proyek aktif.</div>
              ) : (
                proyekAktifList.map(proyek => {
                  const percent = getProgressPercent(proyek.status_produksi)
                  const colorClass = getProgressColor(proyek.status_produksi)
                  return (
                    <div key={proyek.id} style={{ marginBottom: '20px' }}>
                      <div className="kpro-progress-labeled" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span className="kpro-progress-name">
                          {proyek.nama_proyek} — {proyek.nama_client}
                        </span>
                        <span className="kpro-progress-value">{getStatusLabel(proyek.status_produksi)} ({percent}%)</span>
                      </div>
                      <div className="kpro-progress">
                        <div className={`kpro-progress-bar ${colorClass}`} style={{ width: `${percent}%` }}></div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stok Kritis */}
      <div className="kpro-card">
        <div className="kpro-card-header">
          <span className="kpro-card-title">⚠ Stok Kritis — Perlu Restock</span>
          <button className="kpro-btn kpro-btn-ghost kpro-btn-sm" onClick={() => navigate('/stok')} style={{ fontSize: '12px' }}>
            Kelola stok →
          </button>
        </div>
        <div className="kpro-table-wrap">
          <table className="kpro-table">
            <thead>
              <tr><th>Nama Bahan</th><th>Sisa Stok</th><th>Min Stok</th><th>Status</th></tr>
            </thead>
            <tbody>
              {stokKritisList.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: 'var(--kpro-success-text)' }}>✓ Semua stok dalam kondisi aman</td></tr>
              ) : (
                stokKritisList.map(item => (
                  <tr key={item.id}>
                    <td><strong>{item.nama_bahan}</strong></td>
                    <td>{item.stok_saat_ini} {item.satuan}</td>
                    <td>{item.min_stok} {item.satuan}</td>
                    <td><span className="kpro-badge kpro-badge-danger">Kritis</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}