import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { folderService } from '../services/folderService'
import { fileService } from '../services/fileService'
import { useAuth } from '../context/AuthProvider'
import toast from 'react-hot-toast'

const UserFolderView = () => {
  const { folderId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { auth } = useAuth()
  
  const [folder, setFolder] = useState(null)
  const [subfolders, setSubfolders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const folderName = location.state?.folderName || 'Carpeta'

  useEffect(() => {
    loadFolder()
  }, [folderId])

  const loadFolder = async () => {
    try {
      setIsLoading(true)
      console.log('🔄 Cargando carpeta:', folderId)
      
      const folderData = await folderService.getFolder(folderId)
      console.log('✅ Carpeta cargada:', folderData)
      console.log('📄 Archivos en la carpeta:', folderData.files)
      console.log('📊 Cantidad de archivos:', folderData.files?.length || 0)
      
      setFolder(folderData)
      
      // Cargar subcarpetas siempre (puede ser carpeta principal o subcarpeta)
      await loadSubfolders()
      
    } catch (error) {
      console.error('❌ Error cargando carpeta:', error)
      toast.error('Error al cargar la carpeta')
    } finally {
      setIsLoading(false)
    }
  }

  const loadSubfolders = async () => {
    try {
      console.log('🔄 Cargando subcarpetas...')
      const foldersResponse = await folderService.getFolders()
      console.log('📁 Respuesta completa del API:', foldersResponse)
      
      // Extraer el array de carpetas de la respuesta
      const folders = Array.isArray(foldersResponse) ? foldersResponse : (foldersResponse.carpetas || [])
      console.log('📁 Estructura procesada:', folders)
      
      // Función recursiva para encontrar subcarpetas
      const findSubfolders = (folders, targetId) => {
        if (!Array.isArray(folders)) {
          console.error('❌ folders no es un array:', folders)
          return []
        }
        
        for (const folder of folders) {
          if (folder._id === targetId) {
            console.log('✅ Carpeta encontrada:', folder.name, 'Subcarpetas:', folder.subcarpetas)
            return folder.subcarpetas || []
          }
          if (folder.subcarpetas && Array.isArray(folder.subcarpetas) && folder.subcarpetas.length > 0) {
            const found = findSubfolders(folder.subcarpetas, targetId)
            if (found.length > 0) {
              return found
            }
          }
        }
        return []
      }
      
      const subfolders = findSubfolders(folders, folderId)
      console.log('📁 Subcarpetas encontradas:', subfolders.length, subfolders)
      setSubfolders(subfolders)
    } catch (error) {
      console.error('❌ Error cargando subcarpetas:', error)
    }
  }

  const refreshFolder = async () => {
    setIsRefreshing(true)
    await loadFolder()
    setIsRefreshing(false)
  }

  const openSubfolder = (subfolderId, subfolderName) => {
    navigate(`/dashboard/user-folder/${subfolderId}`, {
      state: { folderName: subfolderName, folderId: subfolderId }
    })
  }

  const downloadFile = async (file) => {
    try {
      console.log('📥 Descargando archivo:', file.name)
      
      // Crear enlace de descarga
      const link = document.createElement('a')
      link.href = file.url
      link.download = file.name
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success('Descarga iniciada')
    } catch (error) {
      console.error('❌ Error descargando archivo:', error)
      toast.error('Error al descargar el archivo')
    }
  }

  const getFileIcon = (mimeType) => {
    if (mimeType?.includes('pdf')) return '📄'
    if (mimeType?.includes('image')) return '🖼️'
    if (mimeType?.includes('video')) return '🎥'
    if (mimeType?.includes('audio')) return '🎵'
    if (mimeType?.includes('text')) return '📝'
    if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel')) return '📊'
    if (mimeType?.includes('presentation') || mimeType?.includes('powerpoint')) return '📈'
    return '📄'
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!folder) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Carpeta no encontrada</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    )
  }

  const isMainFolder = !folder.parentFolder

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-lg w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{folderName}</h1>
                <p className="text-sm text-gray-500">
                  {isMainFolder ? 'Carpeta Principal' : 'Subcarpeta'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full py-6 px-4 sm:px-6 lg:px-8">
        {/* Información de la carpeta */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{folder.name}</h2>
                <p className="text-sm text-gray-500">
                  Creada: {new Date(folder.createdAt).toLocaleDateString('es-ES')}
                </p>
                <p className="text-sm text-gray-500">
                  Última actualización: {new Date(folder.updatedAt).toLocaleDateString('es-ES')}
                </p>
                <p className="text-sm text-gray-500">
                  Total de archivos: {folder.files?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Subcarpetas */}
        {subfolders.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <svg className="h-5 w-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <h2 className="text-lg font-bold text-gray-900">Subcarpetas</h2>
            </div>
            <div className="space-y-4">
              {subfolders.map((subfolder) => (
                <SubfolderCard 
                  key={subfolder._id} 
                  subfolder={subfolder} 
                  onOpenSubfolder={openSubfolder}
                  level={0}
                />
              ))}
            </div>
          </div>
        )}

        {/* Archivos */}
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <svg className="h-5 w-5 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <h2 className="text-lg font-bold text-gray-900">Archivos</h2>
          </div>
          
          {/* Buscador de archivos */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Buscar archivos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {!folder.files || folder.files.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200 text-center">
              <svg className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay archivos</h3>
              <p className="text-gray-500">
                Esta carpeta no contiene archivos aún.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {folder.files
                .filter(file => 
                  file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  file.description?.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((file) => (
                <div key={file._id} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                        <span className="text-2xl">{getFileIcon(file.mimeType)}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{file.name}</h3>
                        <p className="text-sm text-gray-500">
                          {file.description || 'Sin descripción'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatFileSize(file.size)} • {new Date(file.createdAt).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => downloadFile(file)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                    >
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Abrir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

// Componente recursivo para mostrar subcarpetas anidadas
const SubfolderCard = ({ subfolder, onOpenSubfolder, level = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const hasNestedSubfolders = subfolder.subcarpetas && subfolder.subcarpetas.length > 0

  const getIndentStyle = (level) => {
    return {
      marginLeft: `${level * 20}px`,
      borderLeft: level > 0 ? '2px solid #e5e7eb' : 'none',
      paddingLeft: level > 0 ? '12px' : '0'
    }
  }

  const getFolderIcon = (hasSubfolders, isExpanded) => {
    if (hasSubfolders) {
      return isExpanded ? (
        <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      ) : (
        <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      )
    }
    return (
      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200" style={getIndentStyle(level)}>
      <div 
        className="p-4 hover:bg-gray-50 cursor-pointer"
        onClick={() => onOpenSubfolder(subfolder._id, subfolder.name)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getFolderIcon(hasNestedSubfolders, isExpanded)}
            <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{subfolder.name}</h3>
              <p className="text-sm text-gray-500">
                📄 {subfolder.files?.length || 0} archivos
                {hasNestedSubfolders && ` • ${subfolder.subcarpetas.length} subcarpetas`}
              </p>
            </div>
          </div>
          {hasNestedSubfolders && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsExpanded(!isExpanded)
              }}
              className="p-2 hover:bg-gray-200 rounded-md"
            >
              {isExpanded ? (
                <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              ) : (
                <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>
      
      {/* Mostrar subcarpetas anidadas si está expandido */}
      {isExpanded && hasNestedSubfolders && (
        <div className="border-t border-gray-100">
          {subfolder.subcarpetas.map((nestedSubfolder) => (
            <SubfolderCard 
              key={nestedSubfolder._id} 
              subfolder={nestedSubfolder} 
              onOpenSubfolder={onOpenSubfolder}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default UserFolderView
