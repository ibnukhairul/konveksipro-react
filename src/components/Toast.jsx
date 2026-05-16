import { useState, useEffect } from 'react'

let toastId = 0

export function showToast(message, type = 'success', duration = 3000) {
  const id = ++toastId
  const event = new CustomEvent('kpro-toast', {
    detail: { id, message, type, duration }
  })
  window.dispatchEvent(event)
  return id
}

export function ToastContainer() {
  const [toastList, setToastList] = useState([])

  useEffect(() => {
    const handleToast = (e) => {
      const { id, message, type, duration } = e.detail
      setToastList(prev => [...prev, { id, message, type, duration }])
      setTimeout(() => {
        setToastList(prev => prev.filter(t => t.id !== id))
      }, duration)
    }

    window.addEventListener('kpro-toast', handleToast)
    return () => window.removeEventListener('kpro-toast', handleToast)
  }, [])

  if (toastList.length === 0) return null

  const getIcon = (type) => {
    switch (type) {
      case 'success': return '✓'
      case 'error': return '✕'
      case 'warning': return '⚠'
      default: return 'ℹ'
    }
  }

  const getClass = (type) => {
    switch (type) {
      case 'success': return 'kpro-toast-success'
      case 'error': return 'kpro-toast-error'
      case 'warning': return 'kpro-toast-warning'
      default: return 'kpro-toast-info'
    }
  }

  return (
    <div id="kpro-toast-container" style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      {toastList.map(toast => (
        <div
          key={toast.id}
          className={`kpro-toast ${getClass(toast.type)}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 20px',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            animation: 'slideInRight 0.3s ease',
            minWidth: '260px',
            cursor: 'pointer',
            pointerEvents: 'auto'
          }}
          onClick={() => setToastList(prev => prev.filter(t => t.id !== toast.id))}
        >
          <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{getIcon(toast.type)}</span>
          <span style={{ fontSize: '14px', fontWeight: 500, flex: 1 }}>{toast.message}</span>
        </div>
      ))}
      <style>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideOutRight {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(100%);
          }
        }
        .kpro-toast {
          transition: all 0.3s ease;
        }
        .kpro-toast:hover {
          transform: translateX(-4px);
        }
        .kpro-toast-success {
          background: #22C55E;
          color: white;
        }
        .kpro-toast-error {
          background: #EF4444;
          color: white;
        }
        .kpro-toast-warning {
          background: #F59E0B;
          color: white;
        }
        .kpro-toast-info {
          background: #3B82F6;
          color: white;
        }
      `}</style>
    </div>
  )
}