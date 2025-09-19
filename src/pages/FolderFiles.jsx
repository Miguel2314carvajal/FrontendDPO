import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import { folderService } from '../services/folderService';
import { fileService } from '../services/fileService';
import toast from 'react-hot-toast';

const FolderFiles = () => {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { auth } = useAuth();
  
  const [folder, setFolder] = useState(null);
  const [subfolders, setSubfolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(null);
  
  // Estados para el modal de subida de archivos
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [fileData, setFileData] = useState({
    archivo: null,
    nombre: '',
    descripcion: ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(''); // Estado para el buscador de archivos

  useEffect(() => {
    if (folderId) {
      loadFolderData();
    }
  }, [folderId]);

  const loadFolderData = async () => {
    try {
      setIsLoading(true);
      
      // Cargar datos de la carpeta
      const folderData = await folderService.getFolder(folderId);
      setFolder(folderData);
      
      // Cargar todas las carpetas para encontrar subcarpetas
      const allFolders = await folderService.getFolders();
      const folderList = allFolders.carpetas || allFolders;
      
      // Filtrar subcarpetas de esta carpeta
      const subfoldersData = folderList.filter(f => f.parentFolder?._id === folderId);
      setSubfolders(subfoldersData);
      
      // Los archivos ya vienen en folderData.files
      setFiles(folderData.files || []);
      
    } catch (error) {
      console.error('Error cargando datos de carpeta:', error);
      toast.error('Error al cargar datos de la carpeta');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este archivo?')) {
      return;
    }

    try {
      setIsDeleting(fileId);
      await fileService.deleteFile(fileId);
      toast.success('Archivo eliminado correctamente');
      
      // Recargar datos
      await loadFolderData();
    } catch (error) {
      console.error('Error eliminando archivo:', error);
      toast.error('No se pudo eliminar el archivo');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleEnterSubfolder = (subfolderId, subfolderName) => {
    navigate(`/dashboard/files/${subfolderId}`, { 
      state: { folderName: subfolderName, folderId: subfolderId } 
    });
  };


  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Auto-descripción basada en el tipo de archivo (igual que en móvil)
      const fileExtension = file.name?.split('.').pop()?.toLowerCase();
      let autoDescription = '';
      
      switch (fileExtension) {
        case 'pdf':
          autoDescription = 'Documento PDF';
          break;
        case 'doc':
        case 'docx':
          autoDescription = 'Documento de Word';
          break;
        case 'xls':
        case 'xlsx':
          autoDescription = 'Hoja de cálculo Excel';
          break;
        case 'ppt':
        case 'pptx':
          autoDescription = 'Presentación PowerPoint';
          break;
        case 'jpg':
        case 'jpeg':
        case 'png':
          autoDescription = 'Imagen';
          break;
        case 'txt':
          autoDescription = 'Archivo de texto';
          break;
        default:
          autoDescription = `Archivo ${fileExtension?.toUpperCase() || 'desconocido'}`;
      }
      
      setFileData({
        ...fileData,
        archivo: file,
        nombre: file.name.split('.')[0], // Nombre sin extensión
        descripcion: autoDescription // Descripción automática
      });
    }
  };

  const handleUpload = async () => {
    if (!fileData.nombre.trim() || !fileData.descripcion.trim() || !fileData.archivo) {
      toast.error('Por favor completa todos los campos obligatorios: archivo, nombre y descripción');
      return;
    }

    try {
      setIsUploading(true);
      
      // Crear FormData para enviar el archivo
      const formData = new FormData();
      formData.append('file', fileData.archivo);
      formData.append('name', fileData.nombre);
      formData.append('description', fileData.descripcion);
      formData.append('folder', folderId);
      formData.append('clienteDestinatario', auth._id);
      
      // Subir archivo usando el servicio
      await fileService.uploadFile(formData);
      
      toast.success('Archivo subido correctamente');
      setShowUploadModal(false);
      resetForm();
      
      // Recargar datos de la carpeta para actualizar contadores
      await loadFolderData();
    } catch (error) {
      console.error('Error subiendo archivo:', error);
      toast.error('No se pudo subir el archivo');
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFileData({
      archivo: null,
      nombre: '',
      descripcion: ''
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getFileIcon = (mimeType) => {
    if (mimeType?.includes('pdf')) return '📄';
    if (mimeType?.includes('word') || mimeType?.includes('document')) return '📝';
    if (mimeType?.includes('excel') || mimeType?.includes('spreadsheet')) return '📊';
    if (mimeType?.includes('powerpoint') || mimeType?.includes('presentation')) return '📈';
    if (mimeType?.includes('image')) return '🖼️';
    if (mimeType?.includes('text')) return '📄';
    return '📎';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard/upload')}
                className="mr-4 p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {location.state?.folderName || folder?.name || 'Carpeta'}
                </h1>
                <p className="text-sm text-gray-500">
                  {folder?.parentFolder ? 'Subcarpeta' : 'Carpeta Principal'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
            >
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Subir Archivo
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Información de la carpeta */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-medium text-gray-900">{folder?.name}</h2>
              <p className="text-sm text-gray-500">{folder?.description}</p>
              <div className="flex items-center mt-2 text-sm text-gray-500">
                <span className="mr-4">📄 {files.length} archivos</span>
                <span>📁 {subfolders.length} subcarpetas</span>
              </div>
            </div>
          </div>
        </div>

        {/* Subcarpetas */}
        {subfolders.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <svg className="h-5 w-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              Subcarpetas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subfolders.map((subfolder) => (
                <div
                  key={subfolder._id}
                  className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleEnterSubfolder(subfolder._id, subfolder.name)}
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-3 flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{subfolder.name}</h4>
                      <p className="text-sm text-gray-500">{subfolder.files?.length || 0} archivos</p>
                    </div>
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Archivos */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <svg className="h-5 w-5 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              Archivos
            </h3>
            
            {/* Buscador de archivos */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                className="block w-64 pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Buscar archivos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {files.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500">No hay archivos en esta carpeta</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {files
                .filter(file => 
                  file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  file.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  file.clienteDestinatario?.companyName?.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((file) => (
                <div key={file._id} className="bg-white rounded-lg shadow-sm border p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-lg">{getFileIcon(file.mimeType)}</span>
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <h4 className="text-sm font-medium text-gray-900">{file.name}</h4>
                        <p className="text-sm text-gray-500">{file.description}</p>
                        <div className="flex items-center mt-1 text-xs text-gray-400">
                          <span>{formatFileSize(file.size)}</span>
                          <span className="mx-2">•</span>
                          <span>{formatDate(file.createdAt)}</span>
                          <span className="mx-2">•</span>
                          <span>Cliente: {file.clienteDestinatario?.companyName || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => window.open(file.url, '_blank')}
                        className="text-blue-600 hover:text-blue-800 p-2 rounded-md hover:bg-blue-50"
                        title="Ver archivo"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteFile(file._id)}
                        disabled={isDeleting === file._id}
                        className="text-red-600 hover:text-red-800 p-2 rounded-md hover:bg-red-50 disabled:opacity-50"
                        title="Eliminar archivo"
                      >
                        {isDeleting === file._id ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                        ) : (
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Subida de Archivos */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center mb-4">
                <svg className="h-6 w-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900">Subir Nuevo Archivo</h3>
              </div>
              
              <div className="space-y-4">
                {/* Seleccionar archivo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seleccionar archivo
                  </label>
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {fileData.archivo && (
                    <p className="mt-1 text-sm text-green-600">
                      Archivo seleccionado: {fileData.archivo.name}
                    </p>
                  )}
                </div>

                {/* Nombre del archivo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del archivo
                  </label>
                  <input
                    type="text"
                    value={fileData.nombre}
                    onChange={(e) => setFileData({ ...fileData, nombre: e.target.value })}
                    placeholder="Nombre personalizado del archivo"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={fileData.descripcion}
                    onChange={(e) => setFileData({ ...fileData, descripcion: e.target.value })}
                    placeholder="Describe el contenido del archivo..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

              </div>

              {/* Botones */}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpload}
                  disabled={isUploading || !fileData.nombre.trim() || !fileData.descripcion.trim() || !fileData.archivo}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Subiendo...
                    </>
                  ) : (
                    'Subir Archivo'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FolderFiles;
