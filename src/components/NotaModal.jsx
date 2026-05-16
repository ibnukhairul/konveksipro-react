import { useState, useRef, useEffect } from 'react'
import { notaService } from '../services/notaService'
import { useToast } from '../hooks/useToast'

export default function NotaModal({ isOpen, onClose, proyek }) {
  const toast = useToast()
  const iframeRef = useRef(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && proyek) {
      const notaData = notaService.generateNotaData(proyek)
      const html = notaService.getHtmlTemplate(proyek, notaData)
      if (iframeRef.current) {
        iframeRef.current.srcdoc = html
      }
    }
  }, [isOpen, proyek])

  const handlePrint = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow.print()
    }
  }

  const handleDownload = async () => {
    setLoading(true)
    toast.info('Memproses gambar...')
    try {
      // Untuk download, kita perlu html2canvas
      const html2canvas = (await import('html2canvas')).default
      const iframe = iframeRef.current
      const doc = iframe.contentDocument || iframe.contentWindow.document
      const notaContainer = doc.querySelector('.nota-container')
      
      if (notaContainer) {
        const canvas = await html2canvas(notaContainer, {
          scale: 2,
          backgroundColor: '#ffffff'
        })
        const link = document.createElement('a')
        link.download = `nota_${proyek.nama_client?.replace(/[^a-z0-9]/gi, '_') || 'nota'}.png`
        link.href = canvas.toDataURL()
        link.click()
        toast.success('Nota berhasil diunduh')
      }
    } catch (err) {
      console.error(err)
      toast.error('Gagal mengunduh nota')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    setLoading(true)
    toast.info('Memproses gambar...')
    try {
      const html2canvas = (await import('html2canvas')).default
      const iframe = iframeRef.current
      const doc = iframe.contentDocument || iframe.contentWindow.document
      const notaContainer = doc.querySelector('.nota-container')
      
      if (notaContainer) {
        const canvas = await html2canvas(notaContainer, {
          scale: 2,
          backgroundColor: '#ffffff'
        })
        canvas.toBlob(async (blob) => {
          await navigator.clipboard.write([
            new ClipboardItem({
              [blob.type]: blob
            })
          ])
          toast.success('Gambar nota disalin ke clipboard')
        })
      }
    } catch (err) {
      console.error(err)
      toast.error('Gagal menyalin gambar')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="kpro-modal-overlay is-open" style={{ zIndex: 2000, padding: 0, alignItems: 'stretch' }}>
      <div style={{ width: '100%', maxWidth: '700px', margin: '0 auto', background: '#0F172A', display: 'flex', flexDirection: 'column', height: '100dvh' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: '#0F172A', flexShrink: 0, flexWrap: 'wrap' }}>
          <span style={{ color: 'white', fontWeight: 700, fontSize: '14px', marginRight: '8px' }}>📄 Nota</span>
          <button onClick={handlePrint} style={{ background: '#3B82F6', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>🖨 Cetak</button>
          <button onClick={handleDownload} disabled={loading} style={{ background: '#22C55E', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>📥 Unduh</button>
          <button onClick={handleCopy} disabled={loading} style={{ background: '#8B5CF6', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>📋 Copy</button>
          <button onClick={onClose} style={{ background: '#475569', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', marginLeft: 'auto' }}>✕ Tutup</button>
        </div>
        {/* Iframe viewer */}
        <div style={{ flex: 1, overflow: 'auto', background: '#1E293B', padding: '16px' }}>
          <iframe ref={iframeRef} title="Nota Preview" style={{ width: '100%', minHeight: '500px', border: 'none', borderRadius: '12px', background: 'white' }} />
        </div>
      </div>
    </div>
  )
}