import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../hooks/useToast'
import { supabase } from '../services/supabase'
import '../styles/login.css'

export default function Login() {
  const [activeTab, setActiveTab] = useState('login')
  const [mounted, setMounted] = useState(false)

  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [error, setError]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [regName, setRegName]       = useState('')
  const [regEmail, setRegEmail]     = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirm, setRegConfirm] = useState('')
  const [regError, setRegError]     = useState('')
  const [regLoading, setRegLoading] = useState(false)
  const [regShowPass, setRegShowPass] = useState(false)
  const [regSuccess, setRegSuccess] = useState(false)

  const [showReset, setShowReset]       = useState(false)
  const [resetEmail, setResetEmail]     = useState('')
  const [resetError, setResetError]     = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)

  const { login, register } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  useEffect(() => { setTimeout(() => setMounted(true), 50) }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email || !password) { setError('Email dan password wajib diisi'); return }
    setLoading(true); setError('')
    try {
      const profile = await login(email, password)
      toast.success(`Selamat datang, ${profile.nama_lengkap || email.split('@')[0]}!`)
      navigate(profile.role === 'team' ? '/stok' : '/dashboard')
    } catch (err) {
      setError(
        err.message.includes('verify') ? 'Email belum diverifikasi. Cek inbox Anda.' :
        err.message === 'Invalid login credentials' ? 'Email atau password salah.' :
        err.message
      )
    } finally { setLoading(false) }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!regName || !regEmail || !regPassword) { setRegError('Semua field wajib diisi'); return }
    if (regPassword.length < 6) { setRegError('Password minimal 6 karakter'); return }
    if (regPassword !== regConfirm) { setRegError('Konfirmasi password tidak cocok'); return }
    setRegLoading(true); setRegError('')
    try {
      const result = await register(regEmail, regPassword, regName)
      if (result.user && !result.user.confirmed_at) {
        setRegSuccess(true)
        setRegName(''); setRegEmail(''); setRegPassword(''); setRegConfirm('')
        setTimeout(() => { setActiveTab('login'); setRegSuccess(false) }, 3000)
      }
    } catch (err) {
      setRegError(err.message.includes('already registered') ? 'Email sudah terdaftar.' : err.message || 'Registrasi gagal.')
    } finally { setRegLoading(false) }
  }

  const handleReset = async (e) => {
    e.preventDefault()
    if (!resetEmail) { setResetError('Email wajib diisi'); return }
    setResetLoading(true); setResetError('')
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      setResetSuccess(true)
      setTimeout(() => closeReset(), 3500)
    } catch (err) {
      setResetError(err.message || 'Gagal mengirim email.')
    } finally { setResetLoading(false) }
  }

  const openReset  = () => { setShowReset(true); setResetError(''); setResetSuccess(false); setResetEmail('') }
  const closeReset = () => { setShowReset(false); setResetError(''); setResetSuccess(false); setResetEmail('') }
  const switchTab  = (tab) => { setActiveTab(tab); setError(''); setRegError(''); setRegSuccess(false) }

  return (
    <>
      <div className="lp-page">
        <div className={`lp-card ${mounted ? 'lp-in' : ''}`}>

          {/* ── LEFT PANEL ── */}
          <div className="lp-left">
            <div className="lp-left-body">
              <div className="lp-logo">
                <div className="lp-logo-hex"><HexIcon /></div>
                <span>KonveksiPro</span>
              </div>

              <div className="lp-hero">
                <h1>Selamat<br />datang</h1>
                <p>Kelola stok, proyek, dan keuangan konveksi Anda dalam satu platform terintegrasi.</p>
              </div>

              <ul className="lp-feat">
                {['Stok & inventori real-time', 'Laporan keuangan otomatis', 'Price list & kalkulasi cepat'].map((f, i) => (
                  <li key={i}><CheckCircle />{f}</li>
                ))}
              </ul>
            </div>

            <div className="lp-left-footer">
              <a href="#">Pelajari lebih lanjut</a>
              <span>·</span>
              <a href="#">Hubungi kami</a>
            </div>

            {/* Organic wave SVG divider */}
            <div className="lp-wave" aria-hidden="true">
              <svg viewBox="0 0 100 800" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0,0 L70,0 C50,100 85,200 55,300 C30,380 75,460 50,560 C35,630 65,720 55,800 L0,800 Z" fill="white"/>
              </svg>
            </div>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div className="lp-right">
            <div className="lp-form-box">

              {/* Tab switcher */}
              <div className="lp-tabs" role="tablist">
                <button
                  role="tab"
                  aria-selected={activeTab === 'login'}
                  className={`lp-tab ${activeTab === 'login' ? 'active' : ''}`}
                  onClick={() => switchTab('login')}
                >Masuk</button>
                <button
                  role="tab"
                  aria-selected={activeTab === 'register'}
                  className={`lp-tab ${activeTab === 'register' ? 'active' : ''}`}
                  onClick={() => switchTab('register')}
                >Daftar Akun</button>
              </div>

              {/* LOGIN */}
              {activeTab === 'login' && (
                <div className="lp-panel">
                  <p className="lp-panel-sub">Masuk ke dashboard konveksi Anda</p>
                  <form onSubmit={handleLogin} className="lp-fields" noValidate>
                    <InputWrap icon={<MailIcon />} type="email" placeholder="Alamat Email" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} />
                    <InputWrap
                      icon={<LockIcon />}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      disabled={loading}
                      suffix={<EyeToggle on={showPassword} toggle={() => setShowPassword(p => !p)} />}
                    />
                    {error && <ErrBox msg={error} />}
                    <SubmitBtn loading={loading}>Masuk Sekarang</SubmitBtn>
                    <button type="button" className="lp-link-center" onClick={openReset}>
                      Lupa password? Klik di sini
                    </button>
                  </form>
                </div>
              )}

              {/* REGISTER */}
              {activeTab === 'register' && (
                <div className="lp-panel">
                  {!regSuccess ? (
                    <>
                      <p className="lp-panel-sub">Buat akun gratis dan mulai sekarang</p>
                      <form onSubmit={handleRegister} className="lp-fields" noValidate>
                        <InputWrap icon={<UserIcon />} type="text"  placeholder="Nama Lengkap" value={regName} onChange={e => setRegName(e.target.value)} disabled={regLoading} />
                        <InputWrap icon={<MailIcon />} type="email" placeholder="Alamat Email" value={regEmail} onChange={e => setRegEmail(e.target.value)} disabled={regLoading} />
                        <InputWrap
                          icon={<LockIcon />}
                          type={regShowPass ? 'text' : 'password'}
                          placeholder="Password (min. 6 karakter)"
                          value={regPassword}
                          onChange={e => setRegPassword(e.target.value)}
                          disabled={regLoading}
                          suffix={<EyeToggle on={regShowPass} toggle={() => setRegShowPass(p => !p)} />}
                        />
                        <InputWrap icon={<LockIcon />} type={regShowPass ? 'text' : 'password'} placeholder="Konfirmasi Password" value={regConfirm} onChange={e => setRegConfirm(e.target.value)} disabled={regLoading} />
                        {regError && <ErrBox msg={regError} />}
                        <SubmitBtn loading={regLoading}>Buat Akun</SubmitBtn>
                      </form>
                    </>
                  ) : (
                    <SuccessState
                      title="Pendaftaran Berhasil!"
                      msg={<>Link verifikasi dikirim ke <strong>{regEmail}</strong>. Silakan cek inbox Anda.</>}
                      onBack={() => { setActiveTab('login'); setRegSuccess(false) }}
                    />
                  )}
                </div>
              )}

              <p className="lp-switch-hint">
                {activeTab === 'login'
                  ? <> Belum punya akun? <button className="lp-inline-link" onClick={() => switchTab('register')}>Daftar gratis</button></>
                  : <> Sudah punya akun? <button className="lp-inline-link" onClick={() => switchTab('login')}>Masuk di sini</button></>
                }
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* ── RESET MODAL ── */}
      {showReset && (
        <div className="lp-overlay" onClick={closeReset}>
          <div className="lp-modal" onClick={e => e.stopPropagation()}>
            <button className="lp-modal-close" onClick={closeReset} aria-label="Tutup"><XIcon /></button>
            {!resetSuccess ? (
              <>
                <div className="lp-modal-icon"><LockIcon /></div>
                <h3 className="lp-modal-title">Reset Password</h3>
                <p className="lp-modal-desc">Masukkan email Anda dan kami akan mengirim link untuk mereset password.</p>
                <form onSubmit={handleReset} className="lp-fields" noValidate>
                  <InputWrap icon={<MailIcon />} type="email" placeholder="Alamat Email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} disabled={resetLoading} />
                  {resetError && <ErrBox msg={resetError} />}
                  <SubmitBtn loading={resetLoading}>Kirim Link Reset</SubmitBtn>
                </form>
                <button className="lp-link-center" style={{ marginTop: 12 }} onClick={closeReset}>Kembali ke halaman masuk</button>
              </>
            ) : (
              <SuccessState
                title="Email Terkirim!"
                msg={<>Cek inbox <strong>{resetEmail}</strong>. Link reset berlaku selama 1 jam.</>}
                onBack={closeReset}
                backLabel="Tutup"
              />
            )}
          </div>
        </div>
      )}
    </>
  )
}

/* ── Sub-components ── */
function InputWrap({ icon, suffix, ...rest }) {
  const [focused, setFocused] = useState(false)
  return (
    <label className={`lp-input ${focused ? 'lp-input-focus' : ''}`}>
      <span className="lp-input-icon">{icon}</span>
      <input {...rest} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />
      {suffix && <span className="lp-input-suffix">{suffix}</span>}
    </label>
  )
}

function EyeToggle({ on, toggle }) {
  return (
    <button type="button" className="lp-eye" onClick={toggle} aria-label={on ? 'Sembunyikan' : 'Tampilkan'}>
      {on ? <EyeOffIcon /> : <EyeIcon />}
    </button>
  )
}

function SubmitBtn({ loading, children }) {
  return (
    <button type="submit" className="lp-btn-primary" disabled={loading}>
      {loading ? <span className="lp-spinner" /> : children}
    </button>
  )
}

function ErrBox({ msg }) {
  return (
    <div className="lp-error" role="alert">
      <AlertIcon /><span>{msg}</span>
    </div>
  )
}

function SuccessState({ title, msg, onBack, backLabel = 'Kembali Masuk' }) {
  return (
    <div className="lp-success">
      <div className="lp-ok-ring"><OkIcon /></div>
      <h3>{title}</h3>
      <p>{msg}</p>
      <button className="lp-btn-primary" onClick={onBack}>{backLabel}</button>
    </div>
  )
}

/* ── Icons ── */
const HexIcon    = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l9 5v10l-9 5-9-5V7z" opacity=".85"/><path d="M12 7l5 2.8V15l-5 2.8L7 15V9.8z" fill="white" opacity=".35"/></svg>)
const CheckCircle= () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="rgba(255,255,255,0.25)"/><polyline points="8 12 11 15 16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>)
const MailIcon   = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>)
const LockIcon   = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>)
const UserIcon   = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>)
const EyeIcon    = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>)
const EyeOffIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>)
const OkIcon     = () => (<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>)
const AlertIcon  = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>)
const XIcon      = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>)