import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthProvider'
import { folderService } from '../services/folderService'
import { fileService } from '../services/fileService'
import { authService } from '../services/authService'
import { useNavigate } from 'react-router-dom'
import { Outlet } from 'react-router-dom'
import toast from 'react-hot-toast'

const Dashboard = () => {
  const { auth, cerrarSesion } = useAuth()
  const [folders, setFolders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalFolders: 0,
    totalFiles: 0
  })
  const navigate = useNavigate()

  useEffect(() => {
    // Cargar estadísticas para administradores
    if (auth?.rol === 'admin') {
      loadStats()
    } else {
      // Para usuarios regulares, cargar carpetas asignadas
      loadUserFolders()
    }
  }, [auth])

  const loadStats = async () => {
    try {
      setLoading(true)
      console.log('🔄 Cargando estadísticas...')
      
      const [usersResponse, foldersResponse] = await Promise.all([
        authService.listUsers(),
        folderService.getFolders()
      ])
      
      const users = usersResponse.users || usersResponse
      const folders = foldersResponse.carpetas || foldersResponse
      
      // Calcular total de archivos
      const totalFiles = folders.reduce((acc, folder) => acc + (folder.files?.length || 0), 0)
      
      setStats({
        totalUsers: users.length,
        totalFolders: folders.length,
        totalFiles
      })
      
      console.log('📊 Estadísticas cargadas:', {
        totalUsers: users.length,
        totalFolders: folders.length,
        totalFiles
      })
      
    } catch (error) {
      console.error('❌ Error cargando estadísticas:', error)
      toast.error('Error al cargar estadísticas')
    } finally {
      setLoading(false)
    }
  }

  const loadUserFolders = async () => {
    try {
      setLoading(true)
      console.log('🔄 Cargando carpetas del usuario:', auth?.email)
      console.log('📁 Carpetas asignadas al usuario:', auth?.folders)
      
      // Obtener las carpetas asignadas al usuario
      if (auth?.folders && auth.folders.length > 0) {
        console.log('🔍 Buscando', auth.folders.length, 'carpetas...')
        
        const userFolders = await Promise.all(
          auth.folders.map(async (folderId) => {
            try {
              console.log('📂 Cargando carpeta:', folderId)
              const folder = await folderService.getFolder(folderId)
              console.log('✅ Carpeta cargada:', folder.name)
              return folder
            } catch (error) {
              console.error(`❌ Error cargando carpeta ${folderId}:`, error)
              return null
            }
          })
        )
        
        // Filtrar carpetas válidas y solo mostrar carpetas principales (sin parentFolder)
        const validFolders = userFolders.filter(folder => folder !== null)
        const mainFolders = validFolders.filter(folder => 
          !folder.parentFolder || folder.parentFolder === null
        )
        
        // Calcular total de archivos para cada carpeta (incluyendo subcarpetas)
        const foldersWithTotalFiles = await Promise.all(
          mainFolders.map(async (folder) => {
            try {
              // Obtener todas las subcarpetas de esta carpeta principal
              const allFolders = await folderService.getFolders()
              const subfolders = allFolders.carpetas?.filter(f => 
                f.parentFolder === folder._id || 
                (typeof f.parentFolder === 'object' && f.parentFolder?._id === folder._id)
              ) || []
              
              // Sumar archivos de la carpeta principal
              let totalFiles = folder.files?.length || 0
              
              // Sumar archivos de cada subcarpeta
              for (const subfolder of subfolders) {
                const subfolderData = await folderService.getFolder(subfolder._id)
                totalFiles += subfolderData.files?.length || 0
              }
              
              console.log(`📊 Total archivos en ${folder.name}: ${totalFiles} (${folder.files?.length || 0} principales + ${totalFiles - (folder.files?.length || 0)} de subcarpetas)`)
              console.log(`📁 Datos de carpeta ${folder.name}:`, {
                files: folder.files,
                filesLength: folder.files?.length,
                totalFiles: totalFiles
              })
              
              return {
                ...folder,
                totalFiles: totalFiles
              }
            } catch (error) {
              console.error(`❌ Error calculando archivos para ${folder.name}:`, error)
              return {
                ...folder,
                totalFiles: folder.files?.length || 0
              }
            }
          })
        )
        
        console.log('📊 Carpetas válidas encontradas:', validFolders.length)
        console.log('📁 Carpetas principales (sin subcarpetas):', mainFolders.length)
        setFolders(foldersWithTotalFiles)
      } else {
        console.log('⚠️ Usuario no tiene carpetas asignadas')
        setFolders([])
      }
    } catch (error) {
      console.error('❌ Error cargando carpetas del usuario:', error)
      toast.error('Error al cargar carpetas')
      setFolders([])
    } finally {
      setLoading(false)
    }
  }

  const loadFolders = async () => {
    try {
      setLoading(true)
      console.log('🔄 Cargando carpetas...')
      const data = await folderService.getFolders()
      console.log('📁 Datos de carpetas recibidos:', data)
      setFolders(data.carpetas || [])
      console.log('📁 Carpetas establecidas:', data.carpetas || [])
    } catch (error) {
      console.error('❌ Error cargando carpetas:', error)
      console.log('⚠️ Continuando sin carpetas...')
      // No mostrar error toast, continuar sin carpetas
      setFolders([])
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await cerrarSesion()
      toast.success('Sesión cerrada exitosamente')
      navigate('/')
    } catch (error) {
      console.error('Error en logout:', error)
      toast.error('Error al cerrar sesión')
    }
  }

  const openFolder = (folderId, folderName) => {
    // Para usuarios regulares, navegar a la vista de carpeta
    if (auth?.rol !== 'admin') {
      navigate(`/dashboard/user-folder/${folderId}`, { 
        state: { folderName, folderId } 
      })
    } else {
      // Para administradores, navegar a la vista de archivos
      navigate(`/dashboard/files/${folderId}`, { 
        state: { folderName, folderId } 
      })
    }
  }

  console.log('🎯 Dashboard renderizando - loading:', loading, 'folders:', folders.length, 'auth.rol:', auth?.rol)
  
  if (loading) {
    console.log('⏳ Mostrando spinner de carga...')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Si es administrador, mostrar dashboard especial
  if (auth?.rol === 'admin') {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <header className="bg-white shadow-lg w-full">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h1 className="text-2xl font-bold text-gray-900">AuditoriasApp</h1>
                  <p className="text-sm text-gray-500">Panel de Administración</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    ¡Bienvenido, Administrador!
                  </p>
                  <p className="text-sm text-gray-500">{auth?.companyName || 'Sistema'}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Cerrar</span>
                </button>
              </div>
            </div>
          </div>
        </header>

            {/* Main Content */}
        <main className="w-full py-6 px-4 sm:px-6 lg:px-8">
          {/* Estadísticas del Sistema */}
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <svg className="h-5 w-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h2 className="text-lg font-bold text-gray-900">Estadísticas del Sistema</h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-xl font-bold text-blue-600">{stats.totalUsers}</p>
                    <p className="text-xs font-medium text-gray-900">Total Usuarios</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-xl font-bold text-green-600">{stats.totalFolders}</p>
                    <p className="text-xs font-medium text-gray-900">Carpetas</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <svg className="h-5 w-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-xl font-bold text-orange-600">{stats.totalFiles}</p>
                    <p className="text-xs font-medium text-gray-900">Archivos</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-xl font-bold text-purple-600">24h</p>
                    <p className="text-xs font-medium text-gray-900">Actividad</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Acciones Rápidas */}
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <svg className="h-5 w-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h2 className="text-lg font-bold text-gray-900">Acciones Rápidas</h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <button 
                onClick={() => navigate('/dashboard/new-user')}
                className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow text-left"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-xs font-medium text-gray-900">Nuevo Usuario</p>
                  </div>
                </div>
              </button>
              
              <button 
                onClick={() => navigate('/dashboard/folders')}
                className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow text-left"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-xs font-medium text-gray-900">Gestionar Carpetas</p>
                  </div>
                </div>
              </button>
              
              <button 
                onClick={() => navigate('/dashboard/upload')}
                className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow text-left"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-xs font-medium text-gray-900">Subir Archivo</p>
                  </div>
                </div>
              </button>
              
              <button 
                onClick={() => navigate('/dashboard/files')}
                className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow text-left"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <svg className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-xs font-medium text-gray-900">Ver Archivos</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Gestión de Usuarios y Configuración */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <button 
              onClick={() => navigate('/dashboard/users')}
              className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow text-left w-full"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900">Gestión de Usuarios</h3>
                    <p className="text-xs text-gray-500">Crear, editar y eliminar usuarios</p>
                  </div>
                </div>
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
            
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900">Configuración del Sistema</h3>
                    <p className="text-xs text-gray-500">Ajustar parámetros generales</p>
                  </div>
                </div>
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Actividad Reciente */}
          <div className="mt-6">
            <div className="flex items-center mb-4">
              <svg className="h-5 w-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-lg font-bold text-gray-900">Actividad Reciente</h2>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div className="flex items-center">
                      <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">Nuevo usuario creado</p>
                        <p className="text-xs text-gray-500">Usuario: freddy@example.com</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">Hace 2 horas</span>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div className="flex items-center">
                      <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">Archivo subido</p>
                        <p className="text-xs text-gray-500">documento.pdf en Carpeta Sistemas</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">Hace 4 horas</span>
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center">
                      <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <svg className="h-4 w-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">Sesión iniciada</p>
                        <p className="text-xs text-gray-500">Usuario: miguel@example.com</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">Hace 6 horas</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Dashboard para usuarios regulares
    return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-lg w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">¡Bienvenido!</h1>
                <p className="text-sm text-gray-500">{auth?.companyName || auth?.email}</p>
                <p className="text-xs text-gray-400 flex items-center">
                  <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Usuario Regular
                    </p>
                </div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

            {/* Main Content */}
      <main className="w-full py-6 px-4 sm:px-6 lg:px-8">
        {/* Información de la Cuenta */}
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <svg className="h-5 w-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-lg font-bold text-gray-900">Información de la Cuenta</h2>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-500">Email:</p>
              <p className="text-lg text-gray-900">{auth?.email}</p>
                        </div>
                        <button
              onClick={() => navigate('/dashboard/change-password')}
              className="inline-flex items-center px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1721 9z" />
              </svg>
              Cambiar Contraseña
                        </button>
                    </div>
        </div>

        {/* Tus Carpetas Asignadas */}
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <svg className="h-5 w-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <h2 className="text-lg font-bold text-gray-900">Tus Carpetas Asignadas</h2>
          </div>
          
          {/* Buscador */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Buscar carpeta..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {folders.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200 text-center">
              <svg className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No tienes carpetas asignadas</h3>
              <p className="text-gray-500">
                El administrador aún no te ha asignado carpetas. Contacta al administrador del sistema.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {folders
                .filter(folder => 
                  folder.name.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((folder) => (
                <div
                  key={folder._id || folder.id}
                  onClick={() => openFolder(folder._id || folder.id, folder.name)}
                  className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-center mb-4">
                    <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{folder.name}</h3>
                  <p className="text-sm text-gray-500 mb-1">
                    📄 {folder.totalFiles || folder.files?.length || 0} archivos
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(folder.createdAt || folder.created_at).toLocaleDateString('es-ES')}
                  </p>
                </div>
              ))}
            </div>
          )}
                </div>
            </main>
        </div>
    )
}

export default Dashboard 