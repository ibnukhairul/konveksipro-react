import { useState, useEffect, useRef, useTransition } from 'react'
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
  ArrowDownRight,
  Calendar
} from 'lucide-react'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const formatRupiah = (num) => `Rp ${Math.round(num || 0).toLocaleString('id-ID')}`

const formatShort = (value) => {
  if (value >= 1000000) return (value / 1000000).toFixed(1) + 'jt'
  if (value >= 1000) return (value / 1000).toFixed(0) + 'rb'
  return value.toString()
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

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

export default function KeuanganPage() {
  const { profile } = useAuth()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [exporting, setExporting] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  
  // Filter states
  const [viewMode, setViewMode] = useState('month') // 'month', 'year', 'all_time', 'full_year'
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [availableYears, setAvailableYears] = useState([])
  
  // Data states
  const [statistik, setStatistik] = useState({
    totalPemasukan: 0,
    totalPengeluaran: 0,
    totalTagihan: 0,
    laba: 0,
    piutang: 0,
    jumlahProyek: 0,
    jumlahTransaksiPengeluaran: 0
  })
  const [monthlyData, setMonthlyData] = useState([])
  const [yearlySummary, setYearlySummary] = useState([])
  const [piutangData, setPiutangData] = useState([])
  const [chartView, setChartView] = useState('bar')
  
  const chartRef = useRef(null)
  const chartInstanceRef = useRef(null)
  const contentRef = useRef(null)

  const getPeriodeLabel = () => {
    switch (viewMode) {
      case 'month': return `${months[selectedMonth - 1]} ${selectedYear}`
      case 'year': return `Tahun ${selectedYear}`
      case 'all_time': return 'Semua Waktu'
      case 'full_year': return 'Tahun Penuh (Jan-Des)'
      default: return 'Semua Waktu'
    }
  }

  const updateData = async (newViewMode, newYear, newMonth) => {
    setIsAnimating(true)
    await new Promise(resolve => setTimeout(resolve, 150))
    
    let periode = 'custom_bulan'
    let bulan = null, tahun = null
    
    if (newViewMode === 'month') {
      periode = 'custom_bulan'
      bulan = newMonth
      tahun = newYear
    } else if (newViewMode === 'year') {
      periode = 'custom_tahun'
      tahun = newYear
    } else if (newViewMode === 'all_time') {
      periode = 'all_time'
    } else if (newViewMode === 'full_year') {
      periode = 'all_time_full_year'
    }
    
    try {
      const stats = await keuanganService.getStatistikPerPeriode(periode, bulan, tahun)
      setStatistik(stats)
      
      const proyekList = await keuanganService.getAllProyek()
      const rekapData = keuanganService.getRekap(proyekList)
      setPiutangData(rekapData.piutangData)
      
      const yearForChart = (newViewMode === 'month' || newViewMode === 'year') ? newYear : new Date().getFullYear()
      const monthly = await keuanganService.getMonthlyDataForYear(yearForChart)
      setMonthlyData(monthly)
      
      const yearly = await keuanganService.getYearlySummary()
      setYearlySummary(yearly)
      
      if (yearly.length > 0) {
        const years = yearly.map(y => y.tahun)
        setAvailableYears(years)
      }
    } catch (err) {
      console.error('Load keuangan error:', err)
      toast.error('Gagal memuat data: ' + err.message)
    } finally {
      setTimeout(() => setIsAnimating(false), 50)
    }
  }

  const handleViewModeChange = (mode) => {
    startTransition(() => {
      setViewMode(mode)
      updateData(mode, selectedYear, selectedMonth)
    })
  }

  const handleYearChange = (year) => {
    startTransition(() => {
      setSelectedYear(year)
      if (viewMode === 'month') {
        updateData('month', year, selectedMonth)
      } else if (viewMode === 'year') {
        updateData('year', year, selectedMonth)
      } else {
        setViewMode('month')
        updateData('month', year, selectedMonth)
      }
    })
  }

  const handleMonthClick = (month) => {
    startTransition(() => {
      setSelectedMonth(month)
      setViewMode('month')
      updateData('month', selectedYear, month)
    })
  }

  useEffect(() => {
    updateData(viewMode, selectedYear, selectedMonth)
  }, [])

  useEffect(() => {
    if (isPending || monthlyData.length === 0 || !chartRef.current) return

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy()
    }

    const ctx = chartRef.current.getContext('2d')
    const labels = monthlyData.map((d) => d.bulan)
    const pemasukan = monthlyData.map((d) => d.pemasukan)
    const pengeluaran = monthlyData.map((d) => d.pengeluaran)
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
            callbacks: {
              title: (ctx) => ctx[0].label,
              label: (ctx) => '  ' + ctx.dataset.label + ': Rp ' + formatShort(ctx.raw),
              afterBody: (ctx) => {
                const i = ctx[0].dataIndex
                const laba = pemasukan[i] - pengeluaran[i]
                const sign = laba >= 0 ? '+' : ''
                return ['', '  Laba bersih: ' + sign + 'Rp ' + formatShort(laba)]
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
            ticks: { color: '#94a3b8', font: { size: 11 }, padding: 8, callback: (v) => 'Rp ' + formatShort(v) },
            beginAtZero: true,
          },
        },
        animation: {
          duration: 500,
          easing: 'easeInOutQuart',
        },
      },
    })

    return () => {
      if (chartInstanceRef.current) chartInstanceRef.current.destroy()
    }
  }, [monthlyData, chartView, isPending])

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

  // Hitung bulan terbaik dan rata-rata laba
  const bestMonth = monthlyData.reduce((best, cur) => cur.pemasukan > best.pemasukan ? cur : best, monthlyData[0] || { bulan: '-', pemasukan: 0 })
  const avgLaba = monthlyData.length > 0 ? monthlyData.reduce((sum, d) => sum + d.laba, 0) / monthlyData.length : 0

  if (isPending && monthlyData.length === 0) {
    return (
      <div className="keu-loading">
        <div className="keu-spinner" />
        <p>Memuat data keuangan...</p>
      </div>
    )
  }

  return (
    <div className="keu-page">
      <div className="keu-header">
        <div>
          <h1 className="keu-title">Rekap Keuangan</h1>
          <p className="keu-subtitle">Laporan lengkap pemasukan, pengeluaran & laba</p>
        </div>
        <div className="keu-header-actions">
          <button className="keu-export-btn" onClick={handleExportExcel} disabled={exporting}>
            <Download size={15} />
            {exporting ? 'Memproses...' : 'Export Excel Lengkap'}
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="keu-filter-section">
        <div className="keu-dropdown-row">
          <select 
            className="keu-view-select"
            value={viewMode}
            onChange={(e) => handleViewModeChange(e.target.value)}
          >
            <option value="month">Per Bulan</option>
            <option value="year">Per Tahun</option>
            <option value="all_time">All Time</option>
            <option value="full_year">Setahun Penuh</option>
          </select>
          
          <select 
            className="keu-year-select"
            value={selectedYear}
            onChange={(e) => handleYearChange(parseInt(e.target.value))}
          >
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {(viewMode === 'month' || viewMode === 'year') && (
          <div className="keu-month-row">
            <div className="keu-month-steps">
              {months.map((month, idx) => (
                <button
                  key={idx}
                  className={`keu-month-step ${selectedMonth === idx + 1 && viewMode === 'month' ? 'active' : ''}`}
                  onClick={() => handleMonthClick(idx + 1)}
                >
                  {month}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="keu-period-info">
          <span className="keu-period-badge">
            Menampilkan: {getPeriodeLabel()}
            {isPending && <span className="keu-loading-dot">  Memperbarui...</span>}
          </span>
        </div>
      </div>

      {/* Content */}
      <div 
        ref={contentRef}
        className={`keu-content-wrapper ${isAnimating ? 'fade-out' : 'fade-in'}`}
      >
        {/* Stat Cards */}
        <div className="keu-metrics">
          <div className="keu-metric-card">
            <div className="keu-metric-icon keu-icon-blue"><TrendingUp size={20} /></div>
            <div className="keu-metric-body">
              <span className="keu-metric-label">Total Pemasukan</span>
              <span className="keu-metric-value">{formatRupiah(statistik.totalPemasukan)}</span>
              <span className="keu-metric-sub">dari DP yang dibayar</span>
            </div>
          </div>

          <div className="keu-metric-card">
            <div className="keu-metric-icon keu-icon-red"><Wallet size={20} /></div>
            <div className="keu-metric-body">
              <span className="keu-metric-label">Total Pengeluaran</span>
              <span className="keu-metric-value">{formatRupiah(statistik.totalPengeluaran)}</span>
              <span className="keu-metric-sub">{statistik.jumlahTransaksiPengeluaran} transaksi</span>
            </div>
          </div>

          <div className="keu-metric-card">
            <div className={`keu-metric-icon ${statistik.laba >= 0 ? 'keu-icon-green' : 'keu-icon-red'}`}>
              {statistik.laba >= 0 ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
            </div>
            <div className="keu-metric-body">
              <span className="keu-metric-label">Laba Bersih</span>
              <span className={`keu-metric-value ${statistik.laba >= 0 ? 'keu-text-green' : 'keu-text-red'}`}>
                {formatRupiah(statistik.laba)}
              </span>
              <span className="keu-metric-sub">pemasukan - pengeluaran</span>
            </div>
          </div>

          <div className="keu-metric-card">
            <div className="keu-metric-icon keu-icon-amber"><AlertTriangle size={20} /></div>
            <div className="keu-metric-body">
              <span className="keu-metric-label">Piutang (bulan ini)</span>
              <span className="keu-metric-value">{formatRupiah(statistik.piutang)}</span>
              <span className="keu-metric-sub">{statistik.jumlahProyek} proyek</span>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="keu-card keu-mb">
          <div className="keu-card-header">
            <div className="keu-card-title">
              <BarChart3 size={17} />
              <span>Pemasukan vs Pengeluaran {viewMode === 'year' ? `Tahun ${selectedYear}` : (viewMode === 'month' ? `${months[selectedMonth - 1]} ${selectedYear}` : 'Grafik')}</span>
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
            {monthlyData.length === 0 ? (
              <div className="keu-empty-chart"><BarChart3 size={40} /><p>Belum ada data grafik</p></div>
            ) : (
              <div className="keu-chart-wrap"><canvas ref={chartRef} role="img" aria-label="Grafik pemasukan vs pengeluaran" /></div>
            )}
          </div>
        </div>

        {/* Summary Row */}
        <div className="keu-summary-row">
          <div className="keu-summary-item">
            <div className="keu-summary-icon keu-si-green"><ArrowUpRight size={18} /></div>
            <div>
              <div className="keu-summary-label">Bulan dengan pemasukan tertinggi</div>
              <div className="keu-summary-val">
                {bestMonth?.bulan || '-'}
                <span className="keu-badge-pos">
                  {bestMonth?.pemasukan ? formatRupiah(bestMonth.pemasukan) : 'Rp 0'}
                </span>
              </div>
            </div>
          </div>
          <div className="keu-summary-item">
            <div className={`keu-summary-icon ${avgLaba >= 0 ? 'keu-si-blue' : 'keu-si-red'}`}>
              {avgLaba >= 0 ? <TrendingUp size={18} /> : <ArrowDownRight size={18} />}
            </div>
            <div>
              <div className="keu-summary-label">Rata-rata laba bersih / bulan</div>
              <div className="keu-summary-val">
                {formatRupiah(Math.abs(avgLaba))}
                <span className={avgLaba >= 0 ? 'keu-badge-pos' : 'keu-badge-neg'}>
                  {avgLaba >= 0 ? 'surplus' : 'defisit'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Ringkasan Tahunan */}
        <div className="keu-card">
          <div className="keu-card-header">
            <div className="keu-card-title">
              <Calendar size={17} />
              <span>Ringkasan Tahunan</span>
            </div>
          </div>
          <div className="keu-table-wrap">
            <table className="keu-table">
              <thead>
                <tr><th>Tahun</th><th>Total Pemasukan</th><th>Total Pengeluaran</th><th>Laba Bersih</th></tr>
              </thead>
              <tbody>
                {yearlySummary.length === 0 ? (
                  <tr><td colSpan="4" className="keu-table-empty">Belum ada data tahunan</td></tr>
                ) : (
                  yearlySummary.map(item => (
                    <tr key={item.tahun}>
                      <td className="keu-td-client">{item.tahun}</td>
                      <td className="keu-td-amount">{formatRupiah(item.pemasukan)}</td>
                      <td className="keu-td-amount">{formatRupiah(item.pengeluaran)}</td>
                      <td className={`keu-td-amount ${item.laba >= 0 ? 'keu-text-green' : 'keu-text-red'}`}>
                        {formatRupiah(item.laba)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Piutang Belum Lunas */}
        <div className="keu-card keu-mt-4">
          <div className="keu-card-header">
            <div className="keu-card-title"><AlertTriangle size={17} /><span>Piutang Belum Lunas</span></div>
            {piutangData.length > 0 && <span className="keu-count-badge">{piutangData.length} klien</span>}
          </div>
          <div className="keu-table-wrap">
            <table className="keu-table">
              <thead><tr><th>Klien</th><th>Sisa Tagihan</th><th>Status</th></tr></thead>
              <tbody>
                {piutangData.length === 0 ? (
                  <tr><td colSpan="3" className="keu-table-empty"><CheckCircle size={30} /><span>Semua tagihan sudah lunas</span></td></tr>
                ) : (
                  piutangData.map((item, idx) => {
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
    </div>
  )
}