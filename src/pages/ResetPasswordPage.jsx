import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useToast } from '../hooks/useToast'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()

  const handleResetPassword = async (e) => {
    e.preventDefault()
    
    if (!password || !confirmPassword) {
      setError('Semua field wajib diisi')
      return
    }
    
    if (password.length < 6) {
      setError('Password minimal 6 karakter')
      return
    }
    
    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak cocok')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      const { error } = await supabase.auth.updateUser({ password })
      
      if (error) throw error
      
      toast.success('Password berhasil direset! Silakan login dengan password baru Anda.')
      navigate('/login')
    } catch (err) {
      setError(err.message || 'Gagal mereset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="reset-password-container">
      <div className="reset-password-card">
        <div className="reset-password-header">
          <div className="reset-password-logo">KP</div>
          <h2>Reset Password</h2>
          <p>Enter your new password below</p>
        </div>

        <form onSubmit={handleResetPassword} className="reset-password-form">
          <div className="reset-password-input-group">
            <div className="reset-password-input-wrapper">
              <span className="input-icon">🔒</span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div className="reset-password-input-group">
            <div className="reset-password-input-wrapper">
              <span className="input-icon">🔒</span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div className="reset-password-error">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <button 
            type="submit" 
            className="reset-password-btn"
            disabled={loading}
          >
            {loading ? 'Memproses...' : 'Reset Password'}
          </button>

          <button 
            type="button" 
            className="reset-password-back"
            onClick={() => navigate('/login')}
          >
            Back to Login
          </button>
        </form>
      </div>
    </div>
  )
}