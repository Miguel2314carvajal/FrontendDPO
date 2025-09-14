import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import { folderService } from '../services/folderService';
import { fileService } from '../services/fileService';
import toast from 'react-hot-toast';

const FileManagement = () => {
  const [folder, setFolder] = useState(null);
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Formulario de archivo
  const [fileData, setFileData] = useState({
    nombre: '',
    descripcion: '',
    archivo: null
  });

  const { auth } = useAuth();
  const navigate = useNavigate();
  const { folderId } = useParams();

  useEffect(() => {
    if (folderId) {
      loadFolder();
      loadFiles();
    }
  }, [folderId]);

  const loadFolder = async () => {
    try {
      const response = await folderService.getFolder(folderId);
      setFolder(response);
    } catch (error) {
      console.error('Error cargando carpeta:', error);
      toast.error('Error al cargar carpeta');
    }
  };

  const loadFiles = async () => {
    try {
      setIsLoading(true);
      const response = await fileService.getFiles(folderId);
      setFiles(response.files || response);
    } catch (error) {
      console.error('Error cargando archivos:', error);
      toast.error('Error al cargar archivos');
    } finally {
      setIsLoading(false);
    }
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
      toast.error('Por favor completa todos los campos y selecciona un archivo');
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
      formData.append('clienteDestinatario', auth._id); // Usar el usuario actual como destinatario
      
      // Subir archivo usando el servicio
      await fileService.uploadFile(formData);
      
      toast.success('Archivo subido correctamente');
      setShowUploadModal(false);
      resetForm();
      loadFiles(); // Recargar archivos
    } catch (error) {
      console.error('Error subiendo archivo:', error);
      toast.error('No se pudo subir el archivo');
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFileData({
      nombre: '',
      descripcion: '',
      archivo: null
    });
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este archivo?')) {
      return;
    }

    try {
      await fileService.deleteFile(fileId);
      toast.success('Archivo eliminado correctamente');
      loadFiles(); // Recargar archivos
    } catch (error) {
      console.error('Error eliminando archivo:', error);
      toast.error('No se pudo eliminar el archivo');
    }
  };

  const handleViewFile = async (file) => {
    try {
      await fileService.viewFile(file._id);
    } catch (error) {
      console.error('Error viendo archivo:', error);
      toast.error('No se pudo abrir el archivo');
    }
  };

  const handleDownloadFile = async (file) => {
    try {
      await fileService.downloadFile(file._id, file.name);
      toast.success('Descarga iniciada');
    } catch (error) {
      console.error('Error descargando archivo:', error);
      toast.error('No se pudo descargar el archivo');
    }
  };

  const getFileIcon = (mimeType) => {
    if (mimeType?.includes('pdf')) {
      return (
        <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    } else if (mimeType?.includes('image')) {
      return (
        <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    } else if (mimeType?.includes('word') || mimeType?.includes('document')) {
      return (
        <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    } else {
      return (
        <svg className="h-8 w-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando archivos...</p>
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
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-gray-900 mr-4"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center">
                <svg className="h-8 w-8 text-orange-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h1 className="text-xl font-semibold text-gray-900">Gestionar Archivos</h1>
              </div>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Subir
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Folder Info */}
        {folder && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center">
              <svg className="h-12 w-12 text-blue-600 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{folder.name}</h2>
                <p className="text-sm text-gray-500">
                  {folder.parentFolder ? 'Subcarpeta' : 'Carpeta principal'}
                </p>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {files.length} archivos
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Files Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900">Archivos</h3>
            </div>
          </div>

          <div className="p-6">
            {files.length === 0 ? (
              <div className="text-center py-12">
                <svg className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay archivos</h3>
                <p className="text-gray-500 mb-4">Esta carpeta no contiene archivos aún.</p>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Subir primer archivo
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {files.map((file) => (
                  <div key={file._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {getFileIcon(file.mimeType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {file.name}
                        </h4>
                        {file.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {file.description}
                          </p>
                        )}
                        <div className="flex items-center text-xs text-gray-500 mt-2 space-x-2">
                          <span>{file.tipo || 'Archivo'}</span>
                          <span>•</span>
                          <span>{formatFileSize(file.size || 0)}</span>
                          <span>•</span>
                          <span>{new Date(file.createdAt).toLocaleDateString('es-ES')}</span>
                        </div>
                        {file.clienteDestinatario && (
                          <div className="text-xs text-gray-500 mt-1">
                            👤 Cliente: {file.clienteDestinatario.companyName || file.clienteDestinatario.email || 'N/A'}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-end space-x-2 mt-4">
                      <button
                        onClick={() => handleViewFile(file)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Ver archivo"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDownloadFile(file)}
                        className="text-green-600 hover:text-green-800 p-1"
                        title="Descargar archivo"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteFile(file._id)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Eliminar archivo"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Modal */}
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
                    <p className="text-sm text-gray-600 mt-1">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nombre personalizado del archivo"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Describe el contenido del archivo..."
                  />
                </div>
              </div>

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
                  disabled={isUploading}
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

export default FileManagement;
