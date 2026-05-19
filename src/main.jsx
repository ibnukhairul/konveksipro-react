import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import { NotifikasiProvider } from './contexts/NotifikasiContext'  // ← import
import { ToastContainer } from './components/Toast'
import PWAInstallPrompt from './components/PWAInstallPrompt'
import './styles/kpro-core.css'
import './styles/kpro-components.css'
import './styles/kpro-layout.css'
import './styles/theme-finly.css' 
import './styles/team.css'
import './styles/pricelist.css'
import './styles/dashboard.css'
import './styles/keuangan.css'
import './styles/pwa.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode>
    <AuthProvider>
      <NotifikasiProvider>  {/* ← bungkus dengan NotifikasiProvider */}
         <ToastContainer /> 
         <PWAInstallPrompt />
        <App />
      </NotifikasiProvider>
    </AuthProvider>
  // </React.StrictMode>
)