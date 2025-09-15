import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthProvider';
import { folderService } from '../services/folderService';
import { authService } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const FolderManagement = () => {
  const [folders, setFolders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    parentFolder: null,
    description: '',
    subfolders: [],
    category: 'profesional_independiente'
  });
  const [assignData, setAssignData] = useState({
    selectedUsers: []
  });
  const [subfolderForm, setSubfolderForm] = useState({
    name: ''
  });
  const [showSubfolderModal, setShowSubfolderModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSubfolderEditModal, setShowSubfolderEditModal] = useState(false);
  const [showSubfolderSelectModal, setShowSubfolderSelectModal] = useState(false);
  const [deleteOptions, setDeleteOptions] = useState({
    folderId: null,
    folderName: '',
    subfolders: [],
    selectedSubfolders: []
  });
  const [editingSubfolder, setEditingSubfolder] = useState({
    index: null,
    name: '',
    originalName: ''
  });

  const { auth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadFolders(),
        loadUsers()
      ]);
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const loadFolders = async () => {
    try {
      const data = await folderService.getFolders();
      const folders = data.carpetas || [];
      
      // Calcular total de archivos para cada carpeta (incluyendo subcarpetas)
      const foldersWithTotalFiles = await Promise.all(
        folders.map(async (folder) => {
          try {
            // Obtener todas las subcarpetas de esta carpeta
            const subfolders = folders.filter(f => 
              f.parentFolder === folder._id || 
              (typeof f.parentFolder === 'object' && f.parentFolder?._id === folder._id)
            );
            
            // Sumar archivos de la carpeta principal
            let totalFiles = folder.files?.length || 0;
            
            // Sumar archivos de cada subcarpeta
            for (const subfolder of subfolders) {
              totalFiles += subfolder.files?.length || 0;
            }
            
            console.log(`📊 Total archivos en ${folder.name}: ${totalFiles} (${folder.files?.length || 0} principales + ${totalFiles - (folder.files?.length || 0)} de subcarpetas)`);
            
            return {
              ...folder,
              totalFiles: totalFiles
            };
          } catch (error) {
            console.error(`❌ Error calculando archivos para ${folder.name}:`, error);
            return {
              ...folder,
              totalFiles: folder.files?.length || 0
            };
          }
        })
      );
      
      setFolders(foldersWithTotalFiles);
    } catch (error) {
      console.error('Error cargando carpetas:', error);
      toast.error('Error al cargar carpetas');
    }
  };

  const loadUsers = async () => {
    try {
      const data = await authService.listUsers();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      toast.error('Error al cargar usuarios');
    }
  };

  const handleCreateFolder = async () => {
    try {
      if (!formData.name.trim()) {
        toast.error('El nombre de la carpeta es obligatorio');
        return;
      }

      // Generar descripción automáticamente como en móvil
      const description = formData.subfolders.length > 0 ? 
        `Esta carpeta se creará con subcarpetas: ${formData.subfolders.join(', ')}` :
        `Esta carpeta se creará para almacenar archivos relacionados con "${formData.name.trim()}"`;

      // Crear carpeta principal
      const mainFolder = await folderService.createFolder({
        name: formData.name.trim(),
        parentFolder: formData.parentFolder || null,
        category: formData.category,
        description: description,
        usuarios: []
      });

      // Crear subcarpetas si existen
      if (formData.subfolders.length > 0) {
        for (const subfolderName of formData.subfolders) {
          if (subfolderName.trim()) {
            await folderService.createFolder({
              name: subfolderName.trim(),
              parentFolder: mainFolder.folder._id,
              category: formData.category,
              usuarios: []
            });
          }
        }
      }

      const subfolderCount = formData.subfolders.filter(s => s.trim()).length;
      const message = subfolderCount > 0 
        ? `Carpeta "${formData.name}" creada con ${subfolderCount} subcarpetas`
        : `Carpeta "${formData.name}" creada exitosamente`;

      toast.success(message);
      setShowCreateModal(false);
      setFormData({ name: '', parentFolder: null, description: '', subfolders: [], category: 'profesional_independiente' });
      loadFolders();
    } catch (error) {
      console.error('Error creando carpeta:', error);
      toast.error(error.mensaje || 'Error al crear carpeta');
    }
  };

  const handleUpdateFolder = async () => {
    try {
      if (!formData.name.trim()) {
        toast.error('El nombre de la carpeta es obligatorio');
        return;
      }

      // Generar descripción automáticamente como en móvil
      const description = formData.subfolders.length > 0 ? 
        `Esta carpeta se actualizará con subcarpetas: ${formData.subfolders.join(', ')}` :
        `Esta carpeta almacena archivos relacionados con "${formData.name.trim()}"`;

      // Actualizar carpeta principal
      await folderService.updateFolder(selectedFolder._id, {
        name: formData.name.trim(),
        parentFolder: formData.parentFolder || null,
        description: description
      });

      // Obtener subcarpetas actuales
      const currentSubfolders = folders.filter(f => f.parentFolder?._id === selectedFolder._id);
      const currentSubfolderNames = currentSubfolders.map(sf => sf.name);
      const newSubfolderNames = formData.subfolders.filter(name => name.trim());

      // Eliminar subcarpetas que ya no están en la lista
      for (const subfolder of currentSubfolders) {
        if (!newSubfolderNames.includes(subfolder.name)) {
          await folderService.deleteFolder(subfolder._id);
        }
      }

      // Crear nuevas subcarpetas
      for (const subfolderName of newSubfolderNames) {
        if (!currentSubfolderNames.includes(subfolderName)) {
          await folderService.createFolder({
            name: subfolderName,
            parentFolder: selectedFolder._id,
            usuarios: []
          });
        }
      }

      toast.success('Carpeta actualizada exitosamente');
      setShowEditModal(false);
      setSelectedFolder(null);
      setFormData({ name: '', parentFolder: null, description: '', subfolders: [] });
      loadFolders();
    } catch (error) {
      console.error('Error actualizando carpeta:', error);
      toast.error(error.mensaje || 'Error al actualizar carpeta');
    }
  };

  const handleDeleteFolder = async (folderId) => {
    // Obtener información de la carpeta y sus subcarpetas
    const folder = folders.find(f => f._id === folderId);
    const folderSubfolders = folders.filter(f => f.parentFolder?._id === folderId);
    
    if (folderSubfolders.length > 0) {
      // Mostrar modal de opciones de eliminación
      setDeleteOptions({
        folderId: folderId,
        folderName: folder.name,
        subfolders: folderSubfolders,
        selectedSubfolders: []
      });
      setShowDeleteModal(true);
    } else {
      // Eliminar directamente si no tiene subcarpetas
      if (window.confirm(`¿Estás seguro de que quieres eliminar la carpeta "${folder.name}"?`)) {
        await performDelete(folderId, 'folder-only');
      }
    }
  };

  const performDelete = async (folderId, deleteType, selectedSubfolders = []) => {
    try {
      if (deleteType === 'folder-only') {
        await folderService.deleteFolder(folderId);
        toast.success('Carpeta eliminada exitosamente');
      } else if (deleteType === 'folder-and-subfolders') {
        // Eliminar subcarpetas primero
        const folder = folders.find(f => f._id === folderId);
        const folderSubfolders = folders.filter(f => f.parentFolder?._id === folderId);
        
        for (const subfolder of folderSubfolders) {
          await folderService.deleteFolder(subfolder._id);
        }
        
        // Eliminar carpeta principal
        await folderService.deleteFolder(folderId);
        toast.success('Carpeta y todas las subcarpetas eliminadas exitosamente');
      } else if (deleteType === 'selected-subfolders') {
        // Eliminar solo las subcarpetas seleccionadas
        for (const subfolderId of selectedSubfolders) {
          await folderService.deleteFolder(subfolderId);
        }
        toast.success(`${selectedSubfolders.length} subcarpetas eliminadas exitosamente`);
      }
      
      setShowDeleteModal(false);
      setDeleteOptions({ folderId: null, folderName: '', subfolders: [], selectedSubfolders: [] });
      loadFolders();
    } catch (error) {
      console.error('Error eliminando:', error);
      toast.error(error.mensaje || 'Error al eliminar');
    }
  };

  const handleAssignUsers = async () => {
    try {
      await folderService.assignUsersToFolder(selectedFolder._id, assignData.selectedUsers);
      toast.success('Usuarios asignados exitosamente');
      setShowAssignModal(false);
      setSelectedFolder(null);
      setAssignData({ selectedUsers: [] });
      loadFolders();
    } catch (error) {
      console.error('Error asignando usuarios:', error);
      toast.error(error.mensaje || 'Error al asignar usuarios');
    }
  };

  const openEditModal = (folder) => {
    setSelectedFolder(folder);
    const folderSubfolders = folders.filter(f => f.parentFolder?._id === folder._id);
    setFormData({
      name: folder.name,
      parentFolder: folder.parentFolder?._id || null,
      description: folder.description || '',
      subfolders: folderSubfolders.map(sf => sf.name)
    });
    setShowEditModal(true);
  };

  const addSubfolder = () => {
    if (subfolderForm.name.trim()) {
      setFormData({
        ...formData,
        subfolders: [...formData.subfolders, subfolderForm.name.trim()]
      });
      setSubfolderForm({ name: '' });
      setShowSubfolderModal(false);
    }
  };

  const removeSubfolder = (index) => {
    setFormData({
      ...formData,
      subfolders: formData.subfolders.filter((_, i) => i !== index)
    });
  };

  const editSubfolder = (index, name) => {
    setEditingSubfolder({
      index: index,
      name: name,
      originalName: name
    });
    setShowSubfolderEditModal(true);
  };

  const saveSubfolderEdit = () => {
    if (editingSubfolder.name.trim()) {
      const newSubfolders = [...formData.subfolders];
      newSubfolders[editingSubfolder.index] = editingSubfolder.name.trim();
      setFormData({
        ...formData,
        subfolders: newSubfolders
      });
      setShowSubfolderEditModal(false);
      setEditingSubfolder({ index: null, name: '', originalName: '' });
    }
  };

  const openAssignModal = (folder) => {
    setSelectedFolder(folder);
    setAssignData({
      selectedUsers: folder.usuarios?.map(u => u._id) || []
    });
    setShowAssignModal(true);
  };


  const filteredFolders = folders.filter(folder =>
    folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const mainFolders = filteredFolders.filter(folder => !folder.parentFolder);
  const subFolders = filteredFolders.filter(folder => folder.parentFolder);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4 mx-auto"></div>
          <p className="text-gray-600">Cargando carpetas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Carpetas</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">¡Bienvenido, {auth?.companyName || 'Administrador'}!</span>
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Volver
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full py-6 px-4 sm:px-6 lg:px-8">
        {/* Search and Actions */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Buscar carpetas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nueva Carpeta
          </button>
        </div>

        {/* Folders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mainFolders.map((folder) => (
            <div key={folder._id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900">{folder.name}</h3>
                    <p className="text-sm text-gray-500">
                      {folder.totalFiles || folder.files?.length || 0} archivos
                    </p>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => openEditModal(folder)}
                    className="text-blue-600 hover:text-blue-800 p-1"
                    title="Editar"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteFolder(folder._id)}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="Eliminar"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Usuarios asignados:</p>
                <div className="flex flex-wrap gap-1">
                  {folder.usuarios?.length > 0 ? (
                    folder.usuarios.map((user) => (
                      <span key={user._id} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {user.companyName || user.email}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-500">Sin usuarios asignados</span>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Subcarpetas:</p>
                <div className="flex flex-wrap gap-1">
                  {subFolders.filter(sf => sf.parentFolder?._id === folder._id).length > 0 ? (
                    subFolders.filter(sf => sf.parentFolder?._id === folder._id).map((subfolder) => (
                      <span key={subfolder._id} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {subfolder.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-500">Sin subcarpetas</span>
                  )}
                </div>
              </div>

              <div className="text-xs text-gray-500">
                Creada: {new Date(folder.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>

        {mainFolders.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay carpetas</h3>
            <p className="mt-1 text-sm text-gray-500">
              Comienza creando tu primera carpeta.
            </p>
          </div>
        )}
      </main>

      {/* Create Folder Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center mb-4">
                <svg className="h-6 w-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900">Crear Nueva Carpeta</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de la carpeta principal
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Documentos Básicos"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="profesional_independiente">Profesional Independiente</option>
                    <option value="transporte_escolar">Transporte Escolar</option>
                    <option value="encargador_seguros">Encargador de Seguros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subcarpetas (opcional)
                  </label>
                  <p className="text-sm text-gray-500 mb-2">
                    Puedes agregar subcarpetas dentro de esta carpeta principal
                  </p>
                  
                  {formData.subfolders.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">Subcarpetas agregadas:</p>
                      <div className="flex flex-wrap gap-2">
                        {formData.subfolders.map((subfolder, index) => (
                          <div key={index} className="flex items-center bg-gray-100 rounded-lg px-3 py-1">
                            <svg className="h-4 w-4 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                            <span className="text-sm text-gray-700">{subfolder}</span>
                            <button
                              onClick={() => removeSubfolder(index)}
                              className="ml-2 text-red-600 hover:text-red-800"
                              title="Eliminar subcarpeta"
                            >
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={() => setShowSubfolderModal(true)}
                    className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <svg className="h-4 w-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Agregar Subcarpeta
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-700">
                    {formData.subfolders.length > 0 ? 
                      `Esta carpeta se creará con subcarpetas: ${formData.subfolders.join(', ')}` :
                      `Esta carpeta se creará para almacenar archivos relacionados con "${formData.name || 'la carpeta'}"`
                    }
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ name: '', parentFolder: null, description: '', subfolders: [] });
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateFolder}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Crear Carpeta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Folder Modal */}
      {showEditModal && selectedFolder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center mb-4">
                <svg className="h-6 w-6 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900">Editar Carpeta</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de la carpeta
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ingresa el nombre de la carpeta"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subcarpetas
                  </label>
                  
                  {formData.subfolders.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">Subcarpetas actuales:</p>
                      <div className="flex flex-wrap gap-2">
                        {formData.subfolders.map((subfolder, index) => (
                          <div key={index} className="flex items-center bg-gray-100 rounded-lg px-3 py-1">
                            <svg className="h-4 w-4 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                            <span className="text-sm text-gray-700">{subfolder}</span>
                            <button
                              onClick={() => editSubfolder(index, subfolder)}
                              className="ml-2 text-blue-600 hover:text-blue-800"
                              title="Editar subcarpeta"
                            >
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={() => setShowSubfolderModal(true)}
                    className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <svg className="h-4 w-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Agregar Subcarpeta
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-700">
                    {formData.subfolders.length > 0 ? 
                      `Esta carpeta se actualizará con subcarpetas: ${formData.subfolders.join(', ')}` :
                      `Esta carpeta almacena archivos relacionados con "${formData.name || 'la carpeta'}"`
                    }
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedFolder(null);
                    setFormData({ name: '', parentFolder: null, description: '', subfolders: [] });
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdateFolder}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                >
                  Actualizar Carpeta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Subfolder Modal */}
      {showSubfolderModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Agregar Subcarpeta</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de la subcarpeta
                  </label>
                  <input
                    type="text"
                    value={subfolderForm.name}
                    onChange={(e) => setSubfolderForm({ name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Documentos Internos"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowSubfolderModal(false);
                    setSubfolderForm({ name: '' });
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  onClick={addSubfolder}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Crear Subcarpeta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Options Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center mb-4">
                <svg className="h-6 w-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900">Eliminar Carpeta</h3>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  "{deleteOptions.folderName}" tiene {deleteOptions.subfolders.length} subcarpetas. ¿Qué deseas eliminar?
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => performDelete(deleteOptions.folderId, 'folder-and-subfolders')}
                  className="w-full text-left px-4 py-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <div className="font-medium text-red-800">CARPETA + TODAS LAS SUBCARPETAS</div>
                  <div className="text-sm text-red-600">Eliminará la carpeta principal y todas sus subcarpetas</div>
                </button>

                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setShowSubfolderSelectModal(true);
                  }}
                  className="w-full text-left px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors"
                >
                  <div className="font-medium text-yellow-800">SELECCIONAR SUBCARPETAS</div>
                  <div className="text-sm text-yellow-600">Eliminar solo las subcarpetas seleccionadas</div>
                </button>

                <button
                  onClick={() => performDelete(deleteOptions.folderId, 'folder-only')}
                  className="w-full text-left px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <div className="font-medium text-blue-800">SOLO ESTA CARPETA</div>
                  <div className="text-sm text-blue-600">Eliminará solo la carpeta principal (las subcarpetas quedarán huérfanas)</div>
                </button>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Subfolder Modal */}
      {showSubfolderEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Editar Subcarpeta</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de la subcarpeta
                  </label>
                  <input
                    type="text"
                    value={editingSubfolder.name}
                    onChange={(e) => setEditingSubfolder({ ...editingSubfolder, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nombre de la subcarpeta"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowSubfolderEditModal(false);
                    setEditingSubfolder({ index: null, name: '', originalName: '' });
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveSubfolderEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Select Subfolders for Deletion Modal */}
      {showSubfolderSelectModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center mb-4">
                <svg className="h-6 w-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900">Seleccionar Subcarpetas para Eliminar</h3>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Carpeta Principal: {deleteOptions.folderName}
                </p>
              </div>

              <div className="space-y-3">
                {deleteOptions.subfolders.map((subfolder) => (
                  <label key={subfolder._id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={deleteOptions.selectedSubfolders.includes(subfolder._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setDeleteOptions({
                            ...deleteOptions,
                            selectedSubfolders: [...deleteOptions.selectedSubfolders, subfolder._id]
                          });
                        } else {
                          setDeleteOptions({
                            ...deleteOptions,
                            selectedSubfolders: deleteOptions.selectedSubfolders.filter(id => id !== subfolder._id)
                          });
                        }
                      }}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <div className="flex items-center">
                      <svg className="h-4 w-4 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                      <span className="text-sm text-gray-700">{subfolder.name}</span>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowSubfolderSelectModal(false);
                    setDeleteOptions({ ...deleteOptions, selectedSubfolders: [] });
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => performDelete(deleteOptions.folderId, 'selected-subfolders', deleteOptions.selectedSubfolders)}
                  disabled={deleteOptions.selectedSubfolders.length === 0}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Eliminar Seleccionadas ({deleteOptions.selectedSubfolders.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FolderManagement;
