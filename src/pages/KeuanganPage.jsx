import { useState, useEffect } from 'react'
import { keuanganService } from '../services/keuanganService'
import { useAuth } from '../contexts/AuthContext'

const formatRupiah = (num) => `Rp ${Math.round(num || 0).toLocaleString('id-ID')}`

export default function KeuanganPage() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [rekap, setRekap] = useState({
    totalPemasukan: 0,
    totalTagihan: 0,
    totalPiutang: 0,
    proyekAktif: 0,
    piutangData: []
  })
  const [monthlyData, setMonthlyData] = useState([])

  const loadData = async () => {
    setLoading(true)
    try {
      const proyekList = await keuanganService.getAllProyek()
      const rekapData = keuanganService.getRekap(proyekList)
      setRekap(rekapData)
      const months = await keuanganService.getMonthlyIncome()
      setMonthlyData(months)
    } catch (err) {
      console.error('Load keuangan error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) {
    return <div className="kpro-empty">🔄 Memuat data keuangan...</div>
  }

  // Badge status untuk tabel piutang
  const statusBayarBadge = (status) => {
    const badges = {
      belum_dp: <span className="kpro-badge kpro-badge-gray">Belum DP</span>,
      dp_30: <span className="kpro-badge kpro-badge-warning">DP 30%</span>,
      dp_50: <span className="kpro-badge kpro-badge-warning">DP 50%</span>,
      lunas: <span className="kpro-badge kpro-badge-success">Lunas</span>
    }
    if (status && status.startsWith('dp_')) {
      const percent = status.split('_')[1]
      return <span className="kpro-badge kpro-badge-info">DP {percent}%</span>
    }
    return badges[status] || status
  }

  // Chart: cari nilai maksimum untuk skala
  const maxTotal = Math.max(...monthlyData.map(m => m.total), 1)

  return (
    <div>
      <div className="kpro-page-header">
        <div>
          <h2 className="kpro-page-title">Rekap Keuangan</h2>
          <p className="kpro-page-subtitle">Laporan pemasukan & piutang</p>
        </div>
        <div className="kpro-page-actions">
          <button className="kpro-btn kpro-btn-secondary" onClick={() => alert('Fitur export PDF akan datang')}>
            ⬇ Export PDF
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="kpro-stats-grid kpro-mb-6">
        <div className="kpro-stat-card">
          <div className="kpro-d-flex kpro-justify-between kpro-align-center kpro-mb-3">
            <div className="kpro-stat-label">Total Pemasukan</div>
            <div className="kpro-stat-icon kpro-stat-icon-green">💰</div>
          </div>
          <div className="kpro-stat-value">{formatRupiah(rekap.totalPemasukan)}</div>
          <div className="kpro-stat-change">dari DP yang dibayar</div>
        </div>
        <div className="kpro-stat-card">
          <div className="kpro-d-flex kpro-justify-between kpro-align-center kpro-mb-3">
            <div className="kpro-stat-label">Total Tagihan</div>
            <div className="kpro-stat-icon kpro-stat-icon-blue">📋</div>
          </div>
          <div className="kpro-stat-value">{formatRupiah(rekap.totalTagihan)}</div>
          <div className="kpro-stat-change">semua proyek</div>
        </div>
        <div className="kpro-stat-card">
          <div className="kpro-d-flex kpro-justify-between kpro-align-center kpro-mb-3">
            <div className="kpro-stat-label">Piutang Belum Lunas</div>
            <div className="kpro-stat-icon kpro-stat-icon-amber">⚠️</div>
          </div>
          <div className="kpro-stat-value">{formatRupiah(rekap.totalPiutang)}</div>
          <div className="kpro-stat-change">sisa tagihan</div>
        </div>
        <div className="kpro-stat-card">
          <div className="kpro-d-flex kpro-justify-between kpro-align-center kpro-mb-3">
            <div className="kpro-stat-label">Proyek Aktif</div>
            <div className="kpro-stat-icon kpro-stat-icon-red">◈</div>
          </div>
          <div className="kpro-stat-value">{rekap.proyekAktif}</div>
          <div className="kpro-stat-change">belum selesai</div>
        </div>
      </div>

      <div className="kpro-row">
        {/* Chart pemasukan per bulan */}
        <div className="kpro-col-6">
          <div className="kpro-card">
            <div className="kpro-card-header">
              <span className="kpro-card-title">Pemasukan per Bulan</span>
            </div>
            <div className="kpro-card-body">
              <div className="kpro-bar-chart" id="keu-chart">
                {monthlyData.map((month, idx) => {
                  const heightPercent = Math.max(5, Math.round((month.total / maxTotal) * 80))
                  let displayValue = ''
                  if (month.total >= 1000000) displayValue = (month.total / 1000000).toFixed(1) + 'jt'
                  else if (month.total >= 1000) displayValue = (month.total / 1000).toFixed(0) + 'rb'
                  else displayValue = month.total > 0 ? month.total.toString() : '0'
                  return (
                    <div key={idx} className="kpro-bar-wrap">
                      <div className="kpro-bar-value">{displayValue}</div>
                      <div className="kpro-bar kpro-bar-green" style={{ height: `${heightPercent}%`, width: '100%', maxWidth: '50px' }}></div>
                      <div className="kpro-bar-label">{month.label}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Daftar Piutang */}
        <div className="kpro-col-6">
          <div className="kpro-card">
            <div className="kpro-card-header">
              <span className="kpro-card-title">Piutang Belum Lunas</span>
            </div>
            <div className="kpro-table-wrap">
              <table className="kpro-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Sisa Tagihan</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rekap.piutangData.length === 0 ? (
                    <tr><td colSpan="3" style={{ textAlign: 'center', padding: '24px' }}>✓ Tidak ada piutang</td></tr>
                  ) : (
                    rekap.piutangData.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{item.client}</td>
                        <td className="kpro-text-right">{formatRupiah(item.sisa)}</td>
                        <td>{statusBayarBadge(item.status)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}