import { useState, useEffect, useRef } from 'react'
import { keuanganService } from '../services/keuanganService'
import { useAuth } from '../contexts/AuthContext'
import { exportService } from '../services/exportService'
import { useToast } from '../hooks/useToast'
import {
  TrendingUp,
  Wallet,
  AlertTriangle,
  FolderKanban,
  BarChart3,
  Download,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const formatRupiah = (num) => `Rp ${Math.round(num || 0).toLocaleString('id-ID')}`

const formatShort = (value) => {
  if (value >= 1000000) return 'Rp ' + (value / 1000000).toFixed(1) + 'jt'
  if (value >= 1000) return 'Rp ' + Math.round(value / 1000) + 'rb'
  return 'Rp ' + Math.round(value)
}

const statusBayarConfig = {
  belum_dp: { label: 'Belum DP', cls: 'badge-gray' },
  lunas: { label: 'Lunas', cls: 'badge-success' },
  dp_30: { label: 'DP 30%', cls: 'badge-warning' },
  dp_50: { label: 'DP 50%', cls: 'badge-warning' },
}

const getStatusConfig = (status) => {
  if (!status) return { label: 'Belum DP', cls: 'badge-gray' }
  if (statusBayarConfig[status]) return statusBayarConfig[status]
  if (status.startsWith('dp_')) {
    const pct = status.split('_')[1]
    return { label: `DP ${pct}%`, cls: 'badge-info' }
  }
  return { label: status, cls: 'badge-gray' }
}

export default function KeuanganPage() {
  const { profile } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [chartView, setChartView] = useState('bar')
  const [rekap, setRekap] = useState({
    totalPemasukan: 0,
    totalTagihan: 0,
    totalPiutang: 0,
    proyekAktif: 0,
    piutangData: []
  })
  const [incomeVsExpense, setIncomeVsExpense] = useState([])
  const [totalPengeluaran, setTotalPengeluaran] = useState(0)

  const chartRef = useRef(null)
  const chartInstanceRef = useRef(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const proyekList = await keuanganService.getAllProyek()
      const rekapData = keuanganService.getRekap(proyekList)
      setRekap(rekapData)

      const vs = await keuanganService.getIncomeVsExpense()
      setIncomeVsExpense(vs)

      const totalPengeluaranData = await keuanganService.getTotalPengeluaran()
      setTotalPengeluaran(totalPengeluaranData)
    } catch (err) {
      console.error('Load keuangan error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (loading || !chartRef.current || incomeVsExpense.length === 0) return

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy()
    }

    const ctx = chartRef.current.getContext('2d')
    const labels = incomeVsExpense.map((d) => d.bulan)
    const pemasukan = incomeVsExpense.map((d) => d.pemasukan)
    const pengeluaran = incomeVsExpense.map((d) => d.pengeluaran)
    const isLine = chartView === 'line'

    chartInstanceRef.current = new Chart(ctx, {
      type: isLine ? 'line' : 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Pemasukan',
            data: pemasukan,
            backgroundColor: isLine ? 'rgba(59,130,246,0.07)' : 'rgba(59,130,246,0.85)',
            borderColor: '#3b82f6',
            borderWidth: isLine ? 2.5 : 0,
            borderRadius: isLine ? 0 : 10,
            borderSkipped: false,
            pointBackgroundColor: '#fff',
            pointBorderColor: '#3b82f6',
            pointBorderWidth: 2,
            pointRadius: isLine ? 5 : 0,
            pointHoverRadius: isLine ? 7 : 0,
            fill: isLine,
            tension: 0.45,
            pointStyle: 'circle',
          },
          {
            label: 'Pengeluaran',
            data: pengeluaran,
            backgroundColor: isLine ? 'rgba(248,113,113,0.07)' : 'rgba(248,113,113,0.7)',
            borderColor: '#f87171',
            borderWidth: isLine ? 2.5 : 0,
            borderRadius: isLine ? 0 : 10,
            borderSkipped: false,
            pointBackgroundColor: '#fff',
            pointBorderColor: '#f87171',
            pointBorderWidth: 2,
            pointRadius: isLine ? 5 : 0,
            pointHoverRadius: isLine ? 7 : 0,
            fill: isLine,
            tension: 0.45,
            pointStyle: 'rectRot',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0f172a',
            titleColor: '#94a3b8',
            bodyColor: '#e2e8f0',
            padding: 14,
            cornerRadius: 10,
            titleFont: { size: 12, weight: '500' },
            bodyFont: { size: 13, weight: '500' },
            callbacks: {
              title: (ctx) => ctx[0].label,
              label: (ctx) => '  ' + ctx.dataset.label + ': ' + formatShort(ctx.raw),
              afterBody: (ctx) => {
                const i = ctx[0].dataIndex
                const laba = pemasukan[i] - pengeluaran[i]
                const sign = laba >= 0 ? '+' : ''
                return ['', '  Laba bersih: ' + sign + formatShort(laba)]
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { color: '#94a3b8', font: { size: 12 }, autoSkip: false },
          },
          y: {
            grid: { color: 'rgba(148,163,184,0.1)', drawTicks: false },
            border: { display: false },
            ticks: { color: '#94a3b8', font: { size: 11 }, padding: 8, callback: (v) => formatShort(v) },
            beginAtZero: true,
          },
        },
      },
    })

    return () => {
      if (chartInstanceRef.current) chartInstanceRef.current.destroy()
    }
  }, [incomeVsExpense, chartView, loading])

  // 🔥 FUNGSI EXPORT EXCEL LENGKAP
  const handleExportExcel = async () => {
    setExporting(true)
    toast.info('Mengambil data untuk diexport...')
    
    try {
      const proyekList = await keuanganService.getAllProyek()
      const pengeluaranList = await keuanganService.getAllPengeluaran()
      const monthlyIncome = await keuanganService.getMonthlyIncome()
      const monthlyExpense = await keuanganService.getMonthlyExpense()
      const rekapData = keuanganService.getRekap(proyekList)
      
      await exportService.exportLaporanKeuangan(
        proyekList,
        pengeluaranList,
        monthlyIncome,
        monthlyExpense,
        rekapData.piutangData
      )
      
      toast.success('Laporan keuangan berhasil diexport!')
    } catch (err) {
      console.error('Export error:', err)
      toast.error('Gagal export laporan: ' + err.message)
    } finally {
      setExporting(false)
    }
  }

  const netPerMonth = incomeVsExpense.length > 0
    ? incomeVsExpense.reduce((sum, d) => sum + (d.pemasukan - d.pengeluaran), 0) / incomeVsExpense.length
    : 0

  const bestMonth = incomeVsExpense.length > 0
    ? incomeVsExpense.reduce((best, cur) => cur.pemasukan > best.pemasukan ? cur : best)
    : null

  if (loading) {
    return (
      <div className="keu-loading">
        <div className="keu-spinner" />
        <p>Memuat data keuangan...</p>
      </div>
    )
  }

  return (
    <div className="keu-page">
      {/* Header */}
      <div className="keu-header">
        <div>
          <h1 className="keu-title">Rekap Keuangan</h1>
          <p className="keu-subtitle">Laporan pemasukan, pengeluaran &amp; piutang</p>
        </div>
        <div className="keu-header-actions">
          <button
            className="keu-export-btn"
            onClick={handleExportExcel}
            disabled={exporting}
          >
            <Download size={15} />
            {exporting ? 'Memproses...' : 'Export Excel Lengkap'}
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="keu-metrics">
        <div className="keu-metric-card">
          <div className="keu-metric-icon keu-icon-blue"><TrendingUp size={20} /></div>
          <div className="keu-metric-body">
            <span className="keu-metric-label">Total Pemasukan</span>
            <span className="keu-metric-value">{formatRupiah(rekap.totalPemasukan)}</span>
            <span className="keu-metric-sub">dari DP yang dibayar</span>
          </div>
        </div>

        <div className="keu-metric-card">
          <div className="keu-metric-icon keu-icon-red"><Wallet size={20} /></div>
          <div className="keu-metric-body">
            <span className="keu-metric-label">Total Pengeluaran</span>
            <span className="keu-metric-value">{formatRupiah(totalPengeluaran)}</span>
            <span className="keu-metric-sub">semua waktu</span>
          </div>
        </div>

        <div className="keu-metric-card">
          <div className="keu-metric-icon keu-icon-amber"><AlertTriangle size={20} /></div>
          <div className="keu-metric-body">
            <span className="keu-metric-label">Piutang Belum Lunas</span>
            <span className="keu-metric-value">{formatRupiah(rekap.totalPiutang)}</span>
            <span className="keu-metric-sub">sisa tagihan</span>
          </div>
        </div>

        <div className="keu-metric-card">
          <div className="keu-metric-icon keu-icon-purple"><FolderKanban size={20} /></div>
          <div className="keu-metric-body">
            <span className="keu-metric-label">Proyek Aktif</span>
            <span className="keu-metric-value">{rekap.proyekAktif}</span>
            <span className="keu-metric-sub">belum selesai</span>
          </div>
        </div>
      </div>

      {/* Chart Card */}
      <div className="keu-card keu-mb">
        <div className="keu-card-header">
          <div className="keu-card-title">
            <BarChart3 size={17} />
            <span>Pemasukan vs Pengeluaran per Bulan</span>
          </div>
          <div className="keu-chart-controls">
            <div className="keu-legend">
              <span className="keu-legend-item"><span className="keu-legend-dot keu-dot-blue" />Pemasukan</span>
              <span className="keu-legend-item"><span className="keu-legend-dot keu-dot-red" />Pengeluaran</span>
            </div>
            <div className="keu-tabs">
              <button className={`keu-tab ${chartView === 'bar' ? 'keu-tab-active' : ''}`} onClick={() => setChartView('bar')}>Batang</button>
              <button className={`keu-tab ${chartView === 'line' ? 'keu-tab-active' : ''}`} onClick={() => setChartView('line')}>Garis</button>
            </div>
          </div>
        </div>

        <div className="keu-card-body">
          {incomeVsExpense.length === 0 ? (
            <div className="keu-empty-chart"><BarChart3 size={40} /><p>Belum ada data grafik</p></div>
          ) : (
            <div className="keu-chart-wrap"><canvas ref={chartRef} role="img" aria-label="Grafik pemasukan vs pengeluaran per bulan" /></div>
          )}
        </div>

        {incomeVsExpense.length > 0 && (
          <div className="keu-summary-row">
            <div className="keu-summary-item">
              <div className="keu-summary-icon keu-si-green"><ArrowUpRight size={18} /></div>
              <div>
                <div className="keu-summary-label">Bulan terbaik</div>
                <div className="keu-summary-val">{bestMonth?.bulan}<span className="keu-badge-pos">{formatShort(bestMonth?.pemasukan)}</span></div>
              </div>
            </div>
            <div className="keu-summary-item">
              <div className={`keu-summary-icon ${netPerMonth >= 0 ? 'keu-si-blue' : 'keu-si-red'}`}>
                {netPerMonth >= 0 ? <TrendingUp size={18} /> : <ArrowDownRight size={18} />}
              </div>
              <div>
                <div className="keu-summary-label">Rata-rata laba bersih / bulan</div>
                <div className="keu-summary-val">
                  {formatShort(Math.abs(netPerMonth))}
                  <span className={netPerMonth >= 0 ? 'keu-badge-pos' : 'keu-badge-neg'}>{netPerMonth >= 0 ? 'surplus' : 'defisit'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Piutang Table */}
      <div className="keu-card">
        <div className="keu-card-header">
          <div className="keu-card-title"><AlertTriangle size={17} /><span>Piutang Belum Lunas</span></div>
          {rekap.piutangData.length > 0 && <span className="keu-count-badge">{rekap.piutangData.length} klien</span>}
        </div>
        <div className="keu-table-wrap">
          <table className="keu-table">
            <thead><tr><th>Klien</th><th>Sisa Tagihan</th><th>Status</th></tr></thead>
            <tbody>
              {rekap.piutangData.length === 0 ? (
                <tr><td colSpan="3" className="keu-table-empty"><CheckCircle size={30} /><span>Semua tagihan sudah lunas</span></td></tr>
              ) : (
                rekap.piutangData.map((item, idx) => {
                  const cfg = getStatusConfig(item.status)
                  return (
                    <tr key={idx}>
                      <td className="keu-td-client">{item.client}</td>
                      <td className="keu-td-amount">{formatRupiah(item.sisa)}</td>
                      <td><span className={`keu-badge ${cfg.cls}`}>{cfg.label}</span></td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}