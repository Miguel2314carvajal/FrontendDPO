import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/authService.js'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({})
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const autenticarUsuario = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        setCargando(false)
        return
      }

      try {
        const data = await authService.getProfile()
        // Asegurar que data tenga la estructura correcta
        setAuth(data.user || data)
      } catch (error) {
        console.log('Error obteniendo perfil:', error)
        setAuth({})
        // Limpiar datos si hay error
        localStorage.removeItem('user')
        localStorage.removeItem('token')
      }
      setCargando(false)
    }
    autenticarUsuario()
  }, [])

  const login = async (credentials) => {
    try {
      const data = await authService.login(credentials)
      console.log('🔍 Datos recibidos en AuthProvider:', data)
      console.log('🔍 Tipo de data:', typeof data)
      console.log('🔍 data.user:', data.user)
      console.log('🔍 data.token:', data.token)
      
      // El backend puede devolver { user, token } o directamente el user
      const userData = data.user || data
      console.log('🔍 Usuario a guardar:', userData)
      console.log('🔍 Usuario tiene _id:', !!userData._id)
      
      setAuth(userData)
      console.log('🔍 Auth actualizado con:', userData)
      return data
    } catch (error) {
      throw error
    }
  }

  const cerrarSesion = async () => {
    try {
      await authService.logout()
    } catch (error) {
      console.error('Error en logout:', error)
    } finally {
      setAuth({})
    }
  }

  return (
    <AuthContext.Provider
      value={{
        auth,
        setAuth,
        login,
        cerrarSesion,
        cargando
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider