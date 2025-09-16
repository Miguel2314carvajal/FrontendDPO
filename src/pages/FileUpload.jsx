import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import { folderService } from '../services/folderService';
import { fileService } from '../services/fileService';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

const FileUpload = () => {
  const [folders, setFolders] = useState([]);
  const [mainFolders, setMainFolders] = useState([]);
  const [subfolders, setSubfolders] = useState([]);
  const [selectedMainFolder, setSelectedMainFolder] = useState(null);
  const [selectedSubfolder, setSelectedSubfolder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSubfolderModal, setShowSubfolderModal] = useState(false);
  const [folderSearchQuery, setFolderSearchQuery] = useState(''); // Estado para el buscador de carpetas
  
  // Formulario de archivo
  const [fileData, setFileData] = useState({
    nombre: '',
    descripcion: '',
    carpetaId: '',
    archivo: null
  });

  const { auth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    try {
      setIsLoading(true);
      const response = await folderService.getFolders();
      const foldersData = response.carpetas || response;
      
      // Calcular total de archivos incluyendo subcarpetas
      const foldersWithCounts = await Promise.all(
        foldersData.map(async (folder) => {
          let totalFiles = folder.files?.length || 0;
          
          // Encontrar subcarpetas de esta carpeta
          const subfolders = foldersData.filter(f => f.parentFolder?._id === folder._id);
          
          // Sumar archivos de subcarpetas
          for (const subfolder of subfolders) {
            totalFiles += subfolder.files?.length || 0;
          }
          
          return {
            ...folder,
            totalFiles: totalFiles
          };
        })
      );
      
      // Filtrar carpetas principales (sin parentFolder)
      const main = foldersWithCounts.filter(folder => !folder.parentFolder);
      setMainFolders(main);
      setFolders(foldersWithCounts);
    } catch (error) {
      console.error('Error cargando carpetas:', error);
      toast.error('Error al cargar carpetas');
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

  const handleMainFolderSelect = (folder) => {
    setSelectedMainFolder(folder);
    setSelectedSubfolder(null);
    
    // Cargar subcarpetas
    const folderSubfolders = folders.filter(f => f.parentFolder?._id === folder._id);
    setSubfolders(folderSubfolders);
    
    if (folderSubfolders.length > 0) {
      setShowSubfolderModal(true);
    } else {
      // Si no hay subcarpetas, subir directamente a la carpeta principal
      setFileData({ ...fileData, carpetaId: folder._id });
      setShowUploadModal(true);
    }
  };

  const handleSubfolderSelect = (subfolder) => {
    setSelectedSubfolder(subfolder);
    setFileData({ ...fileData, carpetaId: subfolder._id });
    setShowSubfolderModal(false);
    setShowUploadModal(true);
  };

  const handleUpload = async () => {
    if (!fileData.nombre.trim() || !fileData.descripcion.trim() || !fileData.carpetaId || !fileData.archivo) {
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
      formData.append('folder', fileData.carpetaId);
      
      // Subir archivo usando el servicio
      await fileService.uploadFile(formData);
      
      toast.success('Archivo subido correctamente. Será visible para todos los usuarios con acceso a esta categoría de carpeta.');
      setShowUploadModal(false);
      resetForm();
      
      // Recargar carpetas para actualizar contadores
      await loadFolders();
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
      carpetaId: '',
      archivo: null
    });
    setSelectedMainFolder(null);
    setSelectedSubfolder(null);
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando carpetas...</p>
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
                <svg className="h-8 w-8 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <h1 className="text-xl font-semibold text-gray-900">Subir Archivos</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Buscador de carpetas */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Buscar carpetas..."
              value={folderSearchQuery}
              onChange={(e) => setFolderSearchQuery(e.target.value)}
            />
            {folderSearchQuery && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <button
                  onClick={() => setFolderSearchQuery('')}
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mainFolders
            .filter(folder => 
              folder.name.toLowerCase().includes(folderSearchQuery.toLowerCase())
            )
            .map((folder) => (
            <div key={folder._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <svg className="h-12 w-12 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-medium text-gray-900 mb-1">{folder.name}</h3>
                  <p className="text-sm text-gray-500 mb-2">{folder.name}</p>
                  <div className="flex items-center text-sm text-gray-500 space-x-4">
                    <div className="flex items-center">
                      <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {folder.totalFiles || 0} archivos
                    </div>
                    <div className="flex items-center">
                      <svg className="h-4 w-4 mr-1 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                      {subfolders.filter(sf => sf.parentFolder?._id === folder._id).length} subcarpetas
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => navigate(`/dashboard/files/${folder._id}`, { 
                    state: { folderName: folder.name, folderId: folder._id } 
                  })}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  Entrar a carpeta
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subfolder Selection Modal */}
      {showSubfolderModal && selectedMainFolder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center mb-4">
                <svg className="h-6 w-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900">Seleccionar Subcarpeta</h3>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Carpeta Principal: {selectedMainFolder.name}
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setFileData({ ...fileData, carpetaId: selectedMainFolder._id });
                    setShowSubfolderModal(false);
                    setShowUploadModal(true);
                  }}
                  className="w-full text-left px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center">
                    <svg className="h-4 w-4 text-yellow-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <div>
                      <div className="font-medium text-gray-900">{selectedMainFolder.name}</div>
                      <div className="text-sm text-gray-500">Carpeta principal</div>
                    </div>
                  </div>
                </button>
                
                {subfolders.map((subfolder) => (
                  <button
                    key={subfolder._id}
                    onClick={() => handleSubfolderSelect(subfolder)}
                    className="w-full text-left px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center">
                      <svg className="h-4 w-4 text-yellow-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                      <div>
                        <div className="font-medium text-gray-900">{subfolder.name}</div>
                        <div className="text-sm text-gray-500">Subcarpeta</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowSubfolderModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

                {/* Información sobre visibilidad */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        Visibilidad del archivo
                      </h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>Este archivo será visible para todos los usuarios que tengan acceso a las carpetas de la categoría <strong>{selectedMainFolder?.category || selectedSubfolder?.category || 'seleccionada'}</strong>.</p>
                      </div>
                    </div>
                  </div>
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

export default FileUpload;
