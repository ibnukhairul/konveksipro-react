import { createContext, useContext, useState, useEffect } from 'react'
import { auth } from '../services/auth'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const session = await auth.getSession()
      if (session) {
        setUser(session.user)
        try {
          const prof = await auth.getProfile(session.user.id)
          setProfile(prof)
        } catch (e) {
          console.error(e)
        }
      }
      setLoading(false)
    }
    init()
  }, [])

  const login = async (email, password) => {
    const { user } = await auth.login(email, password)
    setUser(user)
    const prof = await auth.getProfile(user.id)
    setProfile(prof)
    return prof
  }

  // 🔥 PASTIKAN FUNGSI REGISTER ADA
  const register = async (email, password, namaLengkap) => {
    const result = await auth.register(email, password, namaLengkap)
    return result
  }

  const logout = async () => {
    await auth.logout()
    setUser(null)
    setProfile(null)
  }

  const refreshProfile = async () => {
    if (user) {
      const prof = await auth.getProfile(user.id)
      setProfile(prof)
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      login, 
      register,  // ← PASTIKAN INI DIEXPORT
      logout, 
      refreshProfile 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)