import { useState, useEffect } from 'react'
import { keuanganService } from '../services/keuanganService'
import { useAuth } from '../contexts/AuthContext'
import { 
  TrendingUp, 
  FileText, 
  AlertTriangle, 
  FolderKanban,
  BarChart3,
  Users,
  Download,
  DollarSign,
  Clock,
  CheckCircle
} from 'lucide-react'

const formatRupiah = (num) => `Rp ${Math.round(num || 0).toLocaleString('id-ID')}`

export default function KeuanganPage() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
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

  const handleExport = async () => {
    setExporting(true)
    try {
      // Fungsi export akan ditambahkan nanti
      alert('Fitur export akan segera hadir')
    } catch (err) {
      console.error('Export error:', err)
    } finally {
      setExporting(false)
    }
  }

  // Badge status untuk tabel piutang
  const statusBayarBadge = (status) => {
    if (status === 'belum_dp') return <span className="keuangan-badge gray">Belum DP</span>
    if (status === 'lunas') return <span className="keuangan-badge success">Lunas</span>
    if (status === 'dp_30') return <span className="keuangan-badge warning">DP 30%</span>
    if (status === 'dp_50') return <span className="keuangan-badge warning">DP 50%</span>
    if (status && status.startsWith('dp_')) {
      const percent = status.split('_')[1]
      return <span className="keuangan-badge info">DP {percent}%</span>
    }
    return <span className="keuangan-badge gray">{status || 'Belum DP'}</span>
  }

  // Chart: cari nilai maksimum untuk skala
  const maxTotal = Math.max(...monthlyData.map(m => m.total), 1)

  const statCards = [
    {
      title: 'Total Pemasukan',
      value: formatRupiah(rekap.totalPemasukan),
      change: 'dari DP yang dibayar',
      icon: TrendingUp,
      color: '#10b981',
      bg: '#ecfdf5'
    },
    {
      title: 'Total Tagihan',
      value: formatRupiah(rekap.totalTagihan),
      change: 'semua proyek',
      icon: FileText,
      color: '#3b82f6',
      bg: '#eff6ff'
    },
    {
      title: 'Piutang Belum Lunas',
      value: formatRupiah(rekap.totalPiutang),
      change: 'sisa tagihan',
      icon: AlertTriangle,
      color: '#f59e0b',
      bg: '#fffbeb'
    },
    {
      title: 'Proyek Aktif',
      value: rekap.proyekAktif,
      change: 'belum selesai',
      icon: FolderKanban,
      color: '#ef4444',
      bg: '#fef2f2'
    }
  ]

  if (loading) {
    return (
      <div className="keuangan-loading">
        <div className="keuangan-loading-spinner"></div>
        <p>Memuat data keuangan...</p>
      </div>
    )
  }

  return (
    <div className="keuangan-page">
      <div className="keuangan-header">
        <div>
          <h1 className="keuangan-title">Rekap Keuangan</h1>
          <p className="keuangan-subtitle">Laporan pemasukan & piutang</p>
        </div>
        <button 
          className="keuangan-export-btn" 
          onClick={handleExport}
          disabled={exporting}
        >
          <Download size={16} />
          {exporting ? 'Memproses...' : 'Export PDF'}
        </button>
      </div>

      {/* Stat Cards Grid */}
      <div className="keuangan-stats">
        {statCards.map((card, idx) => (
          <div key={idx} className="keuangan-stat-card">
            <div className="keuangan-stat-icon" style={{ background: card.bg, color: card.color }}>
              <card.icon size={22} />
            </div>
            <div className="keuangan-stat-content">
              <span className="keuangan-stat-title">{card.title}</span>
              <span className="keuangan-stat-value">{card.value}</span>
              <span className="keuangan-stat-change">{card.change}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="keuangan-row">
        {/* Chart pemasukan per bulan */}
        <div className="keuangan-col">
          <div className="keuangan-card">
            <div className="keuangan-card-header">
              <div className="keuangan-card-title">
                <BarChart3 size={18} />
                <span>Pemasukan per Bulan</span>
              </div>
            </div>
            <div className="keuangan-card-body">
              <div className="keuangan-chart">
                {monthlyData.length === 0 ? (
                  <div className="keuangan-empty-chart">
                    <p>Belum ada data pemasukan</p>
                  </div>
                ) : (
                  monthlyData.map((month, idx) => {
                    const heightPercent = Math.max(5, Math.round((month.total / maxTotal) * 80))
                    let displayValue = ''
                    if (month.total >= 1000000) displayValue = (month.total / 1000000).toFixed(1) + 'jt'
                    else if (month.total >= 1000) displayValue = (month.total / 1000).toFixed(0) + 'rb'
                    else displayValue = month.total > 0 ? month.total.toString() : '0'
                    return (
                      <div key={idx} className="keuangan-chart-bar">
                        <div className="keuangan-chart-value">{displayValue}</div>
                        <div 
                          className="keuangan-chart-fill" 
                          style={{ height: `${heightPercent}%`, backgroundColor: '#10b981' }}
                        />
                        <div className="keuangan-chart-label">{month.label}</div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Daftar Piutang */}
        <div className="keuangan-col">
          <div className="keuangan-card">
            <div className="keuangan-card-header">
              <div className="keuangan-card-title">
                <DollarSign size={18} />
                <span>Piutang Belum Lunas</span>
              </div>
            </div>
            <div className="keuangan-table-wrapper">
              <table className="keuangan-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Sisa Tagihan</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rekap.piutangData.length === 0 ? (
                    <tr className="keuangan-table-empty">
                      <td colSpan="3">
                        <CheckCircle size={32} />
                        <span>Tidak ada piutang</span>
                      </td>
                    </tr>
                  ) : (
                    rekap.piutangData.map((item, idx) => (
                      <tr key={idx}>
                        <td className="keuangan-table-client">{item.client}</td>
                        <td className="keuangan-table-amount">{formatRupiah(item.sisa)}</td>
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