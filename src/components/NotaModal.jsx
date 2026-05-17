import { useState, useRef, useEffect, useCallback } from 'react'
import { notaService } from '../services/notaService'
import { useToast } from '../hooks/useToast'

export default function NotaModal({ isOpen, onClose, proyek }) {
  const toast       = useToast()
  const canvasRef   = useRef(null)
  const canvasCache = useRef(null) // cache canvas agar download tidak render ulang

  const [loading, setLoading]     = useState(false)
  const [rendering, setRendering] = useState(false)

  // ── Render canvas ke elemen preview saat modal dibuka ───────
  const renderPreview = useCallback(async () => {
    if (!proyek) return
    setRendering(true)
    canvasCache.current = null
    try {
      const canvas        = await notaService.generateCanvas(proyek)
      canvasCache.current = canvas

      const el = canvasRef.current
      if (el) {
        el.width  = canvas.width
        el.height = canvas.height
        el.getContext('2d').drawImage(canvas, 0, 0)
      }
    } catch (err) {
      console.error('Render preview gagal:', err)
    } finally {
      setRendering(false)
    }
  }, [proyek])

  useEffect(() => {
    if (isOpen && proyek) renderPreview()
  }, [isOpen, proyek, renderPreview])

  // ── Cetak — print dari canvas sebagai gambar ─────────────────
  const handlePrint = () => {
    const canvas = canvasCache.current
    if (!canvas) return
    const dataUrl     = canvas.toDataURL('image/png')
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(`
      <!DOCTYPE html><html><head><meta charset="UTF-8">
      <style>
        *{margin:0;padding:0;}
        body{background:#fff;}
        img{width:100%;display:block;}
      </style></head>
      <body>
        <img src="${dataUrl}"/>
        <script>window.onload=function(){window.print()}<\/script>
      </body></html>
    `)
    printWindow.document.close()
  }

  // ── Download PNG ─────────────────────────────────────────────
  const handleDownload = async () => {
    setLoading(true)
    toast.info('Memproses gambar...')
    try {
      const canvas        = canvasCache.current || await notaService.generateCanvas(proyek)
      canvasCache.current = canvas

      const safeName  = (proyek?.nama_client || 'nota').replace(/[^a-z0-9]/gi, '_')
      const link      = document.createElement('a')
      link.download   = `nota_${safeName}.png`
      link.href       = canvas.toDataURL('image/png')
      link.click()
      toast.success('Nota berhasil diunduh')
    } catch (err) {
      console.error(err)
      toast.error('Gagal mengunduh: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Copy PNG ke clipboard ────────────────────────────────────
  const handleCopy = async () => {
    setLoading(true)
    toast.info('Memproses gambar...')
    try {
      const canvas        = canvasCache.current || await notaService.generateCanvas(proyek)
      canvasCache.current = canvas

      canvas.toBlob(async (blob) => {
        try {
          await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
          toast.success('Gambar nota disalin ke clipboard')
        } catch (clipErr) {
          console.error(clipErr)
          toast.error('Gagal menyalin: browser tidak mendukung clipboard image')
        }
      }, 'image/png')
    } catch (err) {
      console.error(err)
      toast.error('Gagal memproses gambar: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const busy = loading || rendering

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      display: 'flex', alignItems: 'stretch', justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)',
    }}>
      <div style={{
        width: '100%', maxWidth: '700px', background: '#1E293B',
        display: 'flex', flexDirection: 'column', height: '100dvh',
      }}>

        {/* ── Toolbar ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '12px 16px', background: '#0F172A',
          flexShrink: 0, flexWrap: 'wrap',
        }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '14px', marginRight: '4px' }}>
            📄 Nota
          </span>

          {[
            { label: '🖨 Cetak',  color: '#3B82F6', onClick: handlePrint    },
            { label: '📥 Unduh',  color: '#22C55E', onClick: handleDownload },
            { label: '📋 Copy',   color: '#8B5CF6', onClick: handleCopy    },
          ].map(({ label, color, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              disabled={busy}
              style={{
                background: color, color: '#fff', border: 'none',
                padding: '7px 14px', borderRadius: '6px',
                fontSize: '12px', fontWeight: 600,
                cursor: busy ? 'not-allowed' : 'pointer',
                opacity: busy ? 0.6 : 1,
              }}
            >
              {busy && (label === '📥 Unduh' || label === '📋 Copy') && loading
                ? '⏳ Proses...'
                : label}
            </button>
          ))}

          <button
            onClick={onClose}
            style={{
              background: '#EF4444', color: '#fff', border: 'none',
              padding: '7px 14px', borderRadius: '6px',
              fontSize: '12px', fontWeight: 600,
              cursor: 'pointer', marginLeft: 'auto',
            }}
          >
            ✕ Tutup
          </button>
        </div>

        {/* ── Area preview ── */}
        <div style={{
          flex: 1, overflow: 'auto', padding: '20px',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', background: '#E2E8F0',
        }}>

          {/* Loading indicator */}
          {rendering && (
            <div style={{
              color: '#64748B', fontSize: '14px',
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '40px 0',
            }}>
              <span>⏳</span><span>Memuat nota...</span>
            </div>
          )}

          {/* Canvas preview — selalu ada di DOM agar ref tidak null,
              disembunyikan saat sedang render */}
          <div style={{
            display: rendering ? 'none' : 'inline-block',
            boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
            background: '#fff',
            maxWidth: '100%',
          }}>
            <canvas
              ref={canvasRef}
              style={{ display: 'block', width: '100%', height: 'auto' }}
            />
          </div>

        </div>
      </div>
    </div>
  )
}