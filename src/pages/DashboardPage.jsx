import { useState, useEffect, useRef } from 'react'
import { dashboardService } from '../services/dashboardService'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  TrendingUp, Package, AlertTriangle, DollarSign,
  FolderKanban, BarChart3, Clock, Wallet, ArrowUpRight
} from 'lucide-react'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const formatRupiah = (num) => `Rp ${Math.round(num || 0).toLocaleString('id-ID')}`

const formatShort = (value) => {
  if (value >= 1000000) return 'Rp ' + (value / 1000000).toFixed(1) + 'jt'
  if (value >= 1000) return 'Rp ' + Math.round(value / 1000) + 'rb'
  return 'Rp ' + Math.round(value)
}

const STATUS_PROGRESS = { antri: 5, proses: 45, qc: 80, dikirim: 95, selesai: 100 }
const STATUS_LABEL    = { antri: 'Antri', proses: 'Proses', qc: 'QC', dikirim: 'Dikirim', selesai: 'Selesai' }
const STATUS_COLOR    = {
  antri:   { bar: '#94a3b8', bg: '#f1f5f9', text: '#475569' },
  proses:  { bar: '#f59e0b', bg: '#fffbeb', text: '#d97706' },
  qc:      { bar: '#3b82f6', bg: '#eff6ff', text: '#2563eb' },
  dikirim: { bar: '#8b5cf6', bg: '#f5f3ff', text: '#7c3aed' },
  selesai: { bar: '#10b981', bg: '#ecfdf5', text: '#059669' }
}

export default function DashboardPage() {
  const { profile } = useAuth()
  const navigate    = useNavigate()

  const [ringkasan, setRingkasan] = useState({
    totalStok: 0, stokKritis: 0, proyekAktif: 0,
    omzetBulanIni: 0, piutang: 0, pengeluaranBulanIni: 0, labaKotor: 0
  })
  // chartData: [{ label, pemasukan, pengeluaran }]
  const [chartData, setChartData]             = useState([])
  const [proyekAktifList, setProyekAktifList] = useState([])
  const [stokKritisList, setStokKritisList]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [chartView, setChartView] = useState('line')

  const chartRef         = useRef(null)
  const chartInstanceRef = useRef(null)

  const isTeam = profile?.role === 'team'

  /* ── load data ─────────────────────────────────────────── */
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
      setProyekAktifList(proyekData)
      setStokKritisList(stokData)

      // Coba getIncomeVsExpense jika sudah ada di dashboardService
      if (typeof dashboardService.getIncomeVsExpense === 'function') {
        const ivs = await dashboardService.getIncomeVsExpense()
        setChartData(ivs.map((d) => ({
          label:       d.bulan      ?? d.label      ?? '',
          pemasukan:   d.pemasukan  ?? d.total       ?? 0,
          pengeluaran: d.pengeluaran ?? 0
        })))
      } else {
        // Fallback: pakai omzetData, pengeluaran kosong
        setChartData(omzetData.map((d) => ({
          label:       d.label,
          pemasukan:   d.total,
          pengeluaran: 0
        })))
      }
    } catch (err) {
      console.error('Load dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadDashboard() }, [])

  /* ── render Chart.js setelah canvas siap ──────────────── */
  useEffect(() => {
    if (loading || !chartRef.current || chartData.length === 0) return

    if (chartInstanceRef.current) chartInstanceRef.current.destroy()

    const labels      = chartData.map((d) => d.label)
    const pemasukan   = chartData.map((d) => d.pemasukan)
    const pengeluaran = chartData.map((d) => d.pengeluaran)
    const isLine      = chartView === 'line'

    const ctx = chartRef.current.getContext('2d')
    chartInstanceRef.current = new Chart(ctx, {
      type: isLine ? 'line' : 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Pemasukan',
            data:  pemasukan,
            backgroundColor: isLine ? 'rgba(59,130,246,0.07)' : 'rgba(59,130,246,0.85)',
            borderColor:     '#3b82f6',
            borderWidth:     isLine ? 2.5 : 0,
            borderRadius:    isLine ? 0 : 10,
            borderSkipped:   false,
            pointBackgroundColor: '#fff',
            pointBorderColor:    '#3b82f6',
            pointBorderWidth: 2,
            pointRadius:      isLine ? 5 : 0,
            pointHoverRadius: isLine ? 7 : 0,
            fill:    isLine,
            tension: 0.45,
            pointStyle: 'circle'
          },
          {
            label: 'Pengeluaran',
            data:  pengeluaran,
            backgroundColor: isLine ? 'rgba(248,113,113,0.07)' : 'rgba(248,113,113,0.7)',
            borderColor:     '#f87171',
            borderWidth:     isLine ? 2.5 : 0,
            borderRadius:    isLine ? 0 : 10,
            borderSkipped:   false,
            pointBackgroundColor: '#fff',
            pointBorderColor:    '#f87171',
            pointBorderWidth: 2,
            pointRadius:      isLine ? 5 : 0,
            pointHoverRadius: isLine ? 7 : 0,
            fill:    isLine,
            tension: 0.45,
            pointStyle: 'rectRot'
          }
        ]
      },
      options: {
        responsive:          true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0f172a',
            titleColor:      '#94a3b8',
            bodyColor:       '#e2e8f0',
            padding:         14,
            cornerRadius:    10,
            titleFont: { size: 12, weight: '500' },
            bodyFont:  { size: 13, weight: '500' },
            callbacks: {
              title: (ctx) => ctx[0].label,
              label: (ctx) => '  ' + ctx.dataset.label + ': ' + formatShort(ctx.raw),
              afterBody: (ctx) => {
                const i    = ctx[0].dataIndex
                const laba = pemasukan[i] - pengeluaran[i]
                const sign = laba >= 0 ? '+' : ''
                return ['', '  Laba bersih: ' + sign + formatShort(laba)]
              }
            }
          }
        },
        scales: {
          x: {
            grid:   { display: false },
            border: { display: false },
            ticks:  { color: '#94a3b8', font: { size: 12 }, autoSkip: false }
          },
          y: {
            grid:   { color: 'rgba(148,163,184,0.1)', drawTicks: false },
            border: { display: false },
            ticks:  { color: '#94a3b8', font: { size: 11 }, padding: 8, callback: (v) => formatShort(v) },
            beginAtZero: true
          }
        }
      }
    })

    return () => { if (chartInstanceRef.current) chartInstanceRef.current.destroy() }
  }, [chartData, chartView, loading])

  /* ── loading ───────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="db-loading">
        <div className="db-spinner" />
        <p>Memuat dashboard...</p>
      </div>
    )
  }

  /* ── render ────────────────────────────────────────────── */
  return (
    <div className="db-page">
      <div className="kpro-page-header">
        <div>
          <h2 className="kpro-page-title">Dashboard</h2>
          <p className="kpro-page-subtitle">Ringkasan aktivitas usaha</p>
        </div>
      </div>

      {/* ── Stat Cards ─────────────────────────────────────── */}
      <div className="db-stats kpro-mb-6">
        <div className="db-stat-card">
          <div className="db-stat-icon db-icon-green"><FolderKanban size={20} /></div>
          <div className="db-stat-body">
            <span className="db-stat-label">Proyek Aktif</span>
            <span className="db-stat-value">{ringkasan.proyekAktif}</span>
            <span className="db-stat-sub">proyek berjalan</span>
          </div>
        </div>

        <div className="db-stat-card">
          <div className="db-stat-icon db-icon-blue"><TrendingUp size={20} /></div>
          <div className="db-stat-body">
            <span className="db-stat-label">Omzet Bulan Ini</span>
            <span className="db-stat-value">{formatRupiah(ringkasan.omzetBulanIni)}</span>
            <span className="db-stat-sub">bulan berjalan</span>
          </div>
        </div>

        <div className="db-stat-card">
          <div className="db-stat-icon db-icon-amber"><DollarSign size={20} /></div>
          <div className="db-stat-body">
            <span className="db-stat-label">Piutang</span>
            <span className="db-stat-value">{formatRupiah(ringkasan.piutang)}</span>
            <span className="db-stat-sub">belum dilunasi</span>
          </div>
        </div>

        <div className="db-stat-card">
          <div className="db-stat-icon db-icon-red"><Wallet size={20} /></div>
          <div className="db-stat-body">
            <span className="db-stat-label">Pengeluaran Bulan Ini</span>
            <span className="db-stat-value db-val-red">{formatRupiah(ringkasan.pengeluaranBulanIni)}</span>
            <span className="db-stat-sub">total belanja</span>
          </div>
        </div>

        <div className="db-stat-card">
          <div className={`db-stat-icon ${ringkasan.labaKotor >= 0 ? 'db-icon-green' : 'db-icon-red'}`}>
            {ringkasan.labaKotor >= 0 ? <ArrowUpRight size={20} /> : <Wallet size={20} />}
          </div>
          <div className="db-stat-body">
            <span className="db-stat-label">Laba Kotor</span>
            <span className={`db-stat-value ${ringkasan.labaKotor >= 0 ? 'db-val-green' : 'db-val-red'}`}>
              {formatRupiah(ringkasan.labaKotor)}
            </span>
            <span className="db-stat-sub">omzet - pengeluaran</span>
          </div>
        </div>
      </div>

      {/* ── Row: Grafik + Progres ───────────────────────────── */}
      <div className="db-row kpro-mb-5">

        {/* Grafik Omzet vs Pengeluaran */}
        <div className="db-card">
          <div className="db-card-header">
            <div className="db-card-title">
              <BarChart3 size={16} />
              <span>Omzet vs Pengeluaran</span>
            </div>
            <div className="db-chart-controls">
              <div className="db-legend">
                <span className="db-legend-item">
                  <span className="db-legend-dot db-dot-blue" />
                  Pemasukan
                </span>
                <span className="db-legend-item">
                  <span className="db-legend-dot db-dot-red" />
                  Pengeluaran
                </span>
              </div>
              <div className="db-tabs">
                <button
                  className={`db-tab${chartView === 'bar' ? ' db-tab-active' : ''}`}
                  onClick={() => setChartView('bar')}
                >
                  Batang
                </button>
                <button
                  className={`db-tab${chartView === 'line' ? ' db-tab-active' : ''}`}
                  onClick={() => setChartView('line')}
                >
                  Garis
                </button>
              </div>
              {!isTeam && (
                <button className="db-link-btn" onClick={() => navigate('/keuangan')}>
                  Detail →
                </button>
              )}
            </div>
          </div>
          <div className="db-card-body">
            {chartData.length === 0 ? (
              <div className="db-empty">
                <BarChart3 size={36} />
                <p>Belum ada data grafik</p>
              </div>
            ) : (
              <div className="db-chart-wrap">
                <canvas ref={chartRef} role="img" aria-label="Grafik omzet vs pengeluaran per bulan" />
              </div>
            )}
          </div>
        </div>

        {/* Progres Proyek Aktif */}
        <div className="db-card">
          <div className="db-card-header">
            <div className="db-card-title">
              <Clock size={16} />
              <span>Progres Proyek Aktif</span>
            </div>
            {!isTeam && (
              <button className="db-link-btn" onClick={() => navigate('/proyek')}>
                Lihat semua →
              </button>
            )}
          </div>
          <div className="db-card-body db-proyek-list">
            {proyekAktifList.length === 0 ? (
              <div className="db-empty">
                <Clock size={36} />
                <p>Belum ada proyek aktif</p>
              </div>
            ) : (
              proyekAktifList.map((proyek) => {
                const pct   = STATUS_PROGRESS[proyek.status_produksi] || 0
                const color = STATUS_COLOR[proyek.status_produksi] || STATUS_COLOR.antri
                const label = STATUS_LABEL[proyek.status_produksi] || proyek.status_produksi
                return (
                  <div key={proyek.id} className="db-proyek-item">
                    <div className="db-proyek-top">
                      <div className="db-proyek-name">{proyek.nama_proyek}</div>
                      <span className="db-proyek-badge" style={{ background: color.bg, color: color.text }}>
                        {label}
                      </span>
                    </div>
                    <div className="db-proyek-client">{proyek.nama_client}</div>
                    <div className="db-progress-wrap">
                      <div className="db-progress-track">
                        <div className="db-progress-fill" style={{ width: `${pct}%`, background: color.bar }} />
                      </div>
                      <span className="db-progress-pct">{pct}%</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Stok Kritis ─────────────────────────────────────── */}
      <div className="db-card">
        <div className="db-card-header">
          <div className="db-card-title">
            <AlertTriangle size={16} />
            <span>Stok Kritis — Perlu Restock</span>
          </div>
          <button className="db-link-btn" onClick={() => navigate('/stok')}>
            Kelola stok →
          </button>
        </div>
        <div className="db-table-wrap">
          <table className="db-table">
            <thead>
              <tr>
                <th>Nama Bahan</th>
                <th>Sisa Stok</th>
                <th>Min Stok</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {stokKritisList.length === 0 ? (
                <tr>
                  <td colSpan="4" className="db-table-empty">
                    <Package size={28} />
                    <span>Semua stok dalam kondisi aman</span>
                  </td>
                </tr>
              ) : (
                stokKritisList.map((item) => (
                  <tr key={item.id} className="db-table-row">
                    <td className="db-td-name">{item.nama_bahan}</td>
                    <td>{item.stok_saat_ini} {item.satuan}</td>
                    <td>{item.min_stok} {item.satuan}</td>
                    <td><span className="db-badge db-badge-danger">Kritis</span></td>
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