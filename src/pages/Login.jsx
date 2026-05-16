import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const profile = await login(email, password)
      if (profile.role === 'team') {
        navigate('/stok')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="login-wrap" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--kpro-bg-body)' }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '20px' }}>
        <div className="login-logo">
          <div className="login-logo-icon">KP</div>
          <div className="login-logo-name">KonveksiPro</div>
          <div className="login-logo-sub">Management System</div>
        </div>
        <div className="kpro-card">
          <div className="kpro-card-body">
            <form onSubmit={handleSubmit}>
              <div className="kpro-form-group">
                <label className="kpro-label">Email</label>
                <input type="email" className="kpro-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@contoh.com" />
              </div>
              <div className="kpro-form-group">
                <label className="kpro-label">Password</label>
                <input type="password" className="kpro-input" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
              </div>
              {error && <div className="kpro-alert kpro-alert-danger kpro-mb-4">{error}</div>}
              <button type="submit" className="kpro-btn kpro-btn-primary kpro-btn-block">Masuk</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}