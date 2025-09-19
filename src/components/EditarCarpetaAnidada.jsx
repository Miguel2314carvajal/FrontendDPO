import React, { useState, useEffect } from 'react';
import { folderService } from '../services/folderService';
import EliminarSubcarpetasModal from './EliminarSubcarpetasModal';

const EditarCarpetaAnidada = ({ carpeta, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subfolders: []
  });
  const [loading, setLoading] = useState(false);
  const [mainSubfolderInput, setMainSubfolderInput] = useState('');
  const [editingPath, setEditingPath] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [showEliminarModal, setShowEliminarModal] = useState(false);

  useEffect(() => {
    if (carpeta) {
      // Cargar la estructura jerárquica completa para encontrar la carpeta y sus subcarpetas anidadas
      const loadFolderStructure = async () => {
        try {
          setLoading(true);
          console.log('🔄 Cargando estructura jerárquica para:', carpeta.name);
          
          // Obtener estructura jerárquica completa
          const response = await folderService.getHierarchicalStructure();
          console.log('📁 Estructura jerárquica completa:', response);
          
          // Buscar la carpeta específica en la estructura jerárquica
          const findFolderInHierarchy = (folders, targetId) => {
            for (const folder of folders) {
              if (folder._id === targetId) {
                return folder;
              }
              if (folder.subcarpetas && folder.subcarpetas.length > 0) {
                const found = findFolderInHierarchy(folder.subcarpetas, targetId);
                if (found) return found;
              }
            }
            return null;
          };

          const folderData = findFolderInHierarchy(response.carpetas || [], carpeta._id);
          console.log('📁 Carpeta encontrada en jerarquía:', folderData);
          
          if (folderData) {
            // Convertir subcarpetas a subfolders para consistencia
            const convertSubcarpetas = (subcarpetas) => {
              if (!Array.isArray(subcarpetas)) return [];
              return subcarpetas.map(sub => ({
                ...sub,
                subfolders: convertSubcarpetas(sub.subcarpetas || [])
              }));
            };

            console.log('📝 Descripción de carpeta original:', carpeta.description);
            console.log('📝 Descripción de folderData:', folderData.description);

            setFormData({
              name: folderData.name || carpeta.name || '',
              description: carpeta.description || folderData.description || '',
              subfolders: convertSubcarpetas(folderData.subcarpetas || [])
            });
          } else {
            // Fallback: obtener solo subcarpetas directas
            console.log('⚠️ Carpeta no encontrada en jerarquía, obteniendo subcarpetas directas');
            const subResponse = await folderService.getSubfolders(carpeta._id);
            const subfolders = subResponse.subcarpetas || subResponse || [];
            
            setFormData({
              name: carpeta.name || '',
              description: carpeta.description || '',
              subfolders: subfolders
            });
          }
        } catch (error) {
          console.error('Error cargando estructura de carpeta:', error);
          // Usar datos básicos como fallback
          setFormData({
            name: carpeta.name || '',
            description: carpeta.description || '',
            subfolders: []
          });
        } finally {
          setLoading(false);
        }
      };
      
      loadFolderStructure();
    }
  }, [carpeta]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Función para verificar duplicados
  const checkDuplicate = (name, subfolders) => {
    if (!Array.isArray(subfolders)) return false;
    return subfolders.some(sub => 
      sub && sub.name && sub.name.toLowerCase() === name.toLowerCase()
    );
  };

  // Función para obtener subcarpetas en una ruta específica
  const getSubfoldersAtPath = (path) => {
    if (!path) return formData.subfolders;
    
    const pathArray = path.split('-').map(Number);
    let current = formData.subfolders;
    
    for (let i = 0; i < pathArray.length; i++) {
      if (current && current[pathArray[i]] && current[pathArray[i]].subfolders) {
        current = current[pathArray[i]].subfolders;
      } else {
        return [];
      }
    }
    
    return current || [];
  };

  // Función para contar subcarpetas totales recursivamente
  const countTotalSubfolders = (subfolders) => {
    if (!Array.isArray(subfolders)) return 0;
    let total = subfolders.length;
    subfolders.forEach(sub => {
      if (sub.subfolders) {
        total += countTotalSubfolders(sub.subfolders);
      }
    });
    return total;
  };

  // Agregar subcarpeta principal
  const addSubfolder = async () => {
    const trimmedName = mainSubfolderInput.trim();
    
    if (!trimmedName) return;

    if (checkDuplicate(trimmedName, formData.subfolders)) {
      alert('Ya existe una subcarpeta con ese nombre');
      setMainSubfolderInput('');
      return;
    }

    setLoading(true);
    try {
      // Crear subcarpeta en el backend
      const newSubfolder = await folderService.addSubfolder(carpeta._id, {
        name: trimmedName,
        category: carpeta.category || 'profesional_independiente'
      });

      // Agregar al estado local
      setFormData(prev => ({
        ...prev,
        subfolders: [...prev.subfolders, { ...newSubfolder, subfolders: [] }]
      }));

      setMainSubfolderInput('');
    } catch (error) {
      console.error('Error agregando subcarpeta:', error);
      alert('Error al agregar la subcarpeta');
    } finally {
      setLoading(false);
    }
  };

  // Mostrar input para subcarpeta anidada
  const showNestedInput = (path) => {
    setEditingPath(path);
    setEditingValue('');
  };

  // Mostrar input para editar nombre de subcarpeta
  const showEditName = (path) => {
    console.log('🔍 Editando subcarpeta en ruta:', path);
    setEditingPath(path);
    
    // Obtener las subcarpetas en el nivel correcto
    const pathArray = path.split('-').map(Number);
    const parentPath = pathArray.slice(0, -1).join('-');
    const subfolders = getSubfoldersAtPath(parentPath);
    const index = pathArray[pathArray.length - 1];
    
    console.log('📁 Subcarpetas en nivel:', subfolders);
    console.log('📁 Índice a editar:', index);
    console.log('📁 Nombre a editar:', subfolders[index]?.name);
    
    setEditingValue(subfolders[index]?.name || '');
  };

  // Guardar edición de nombre
  const saveNameEdit = async () => {
    if (!editingPath || !editingValue.trim()) return;

    const trimmedName = editingValue.trim();
    const pathArray = editingPath.split('-').map(Number);
    const parentPath = pathArray.slice(0, -1).join('-');
    const currentSubfolders = getSubfoldersAtPath(parentPath);
    const index = pathArray[pathArray.length - 1];
    
    console.log('💾 Guardando edición:', {
      editingPath,
      trimmedName,
      pathArray,
      parentPath,
      currentSubfolders,
      index
    });
    
    // Verificar duplicados excluyendo el elemento actual
    const otherSubfolders = currentSubfolders.filter((_, i) => i !== index);
    if (checkDuplicate(trimmedName, otherSubfolders)) {
      alert('Ya existe una subcarpeta con ese nombre');
      return;
    }

    setLoading(true);
    try {
      // Obtener el ID de la subcarpeta a editar
      const subfolderToEdit = currentSubfolders[index];
      console.log('📁 Subcarpeta a editar:', subfolderToEdit);
      
      if (subfolderToEdit && subfolderToEdit._id) {
        console.log('🔄 Actualizando en backend:', subfolderToEdit._id, trimmedName);
        await folderService.updateFolder(subfolderToEdit._id, { name: trimmedName });
        console.log('✅ Actualización exitosa en backend');
      } else {
        console.error('❌ No se encontró ID de subcarpeta para editar');
        alert('Error: No se pudo identificar la subcarpeta a editar');
        return;
      }

      // Actualizar estado local
      setFormData(prev => {
        const newSubfolders = [...prev.subfolders];
        
        const updateSubfolders = (subfolders, path) => {
          if (path.length === 1) {
            const index = path[0];
            if (subfolders[index]) {
              subfolders[index] = {
                ...subfolders[index],
                name: trimmedName
              };
            }
          } else {
            const [currentIndex, ...remainingPath] = path;
            if (subfolders[currentIndex] && subfolders[currentIndex].subfolders) {
              updateSubfolders(subfolders[currentIndex].subfolders, remainingPath);
            }
          }
        };

        updateSubfolders(newSubfolders, pathArray);
        
        return { ...prev, subfolders: newSubfolders };
      });

      setEditingPath(null);
      setEditingValue('');
      console.log('✅ Edición completada exitosamente');
    } catch (error) {
      console.error('❌ Error actualizando nombre de subcarpeta:', error);
      alert('Error al actualizar el nombre de la subcarpeta: ' + (error.response?.data?.mensaje || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Eliminar subcarpeta
  const removeSubfolder = async (path) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta subcarpeta y todas sus subcarpetas anidadas?')) {
      return;
    }

    const pathArray = path.split('-').map(Number);
    const currentSubfolders = getSubfoldersAtPath(path);
    const index = pathArray[pathArray.length - 1];
    const subfolderToDelete = currentSubfolders[index];

    setLoading(true);
    try {
      if (subfolderToDelete && subfolderToDelete._id) {
        await folderService.deleteFolder(subfolderToDelete._id);
      }

      // Actualizar estado local
      setFormData(prev => {
        const newSubfolders = [...prev.subfolders];
        
        const removeFromSubfolders = (subfolders, path) => {
          if (path.length === 1) {
            const index = path[0];
            subfolders.splice(index, 1);
          } else {
            const [currentIndex, ...remainingPath] = path;
            if (subfolders[currentIndex] && subfolders[currentIndex].subfolders) {
              removeFromSubfolders(subfolders[currentIndex].subfolders, remainingPath);
            }
          }
        };

        removeFromSubfolders(newSubfolders, pathArray);
        
        return { ...prev, subfolders: newSubfolders };
      });
    } catch (error) {
      console.error('Error eliminando subcarpeta:', error);
      alert('Error al eliminar la subcarpeta');
    } finally {
      setLoading(false);
    }
  };

  // Guardar subcarpeta anidada
  const saveNestedSubfolder = async () => {
    if (!editingPath || !editingValue.trim()) return;

    const trimmedName = editingValue.trim();
    const currentSubfolders = getSubfoldersAtPath(editingPath);
    
    if (checkDuplicate(trimmedName, currentSubfolders)) {
      alert('Ya existe una subcarpeta con ese nombre');
      return;
    }

    setLoading(true);
    try {
      // Obtener el ID de la carpeta padre
      const pathArray = editingPath.split('-').map(Number);
      let parentFolderId = carpeta._id;
      
      if (pathArray.length > 0) {
        // Navegar hasta la carpeta padre
        let current = formData.subfolders;
        for (let i = 0; i < pathArray.length; i++) {
          if (current && current[pathArray[i]]) {
            if (i === pathArray.length - 1) {
              parentFolderId = current[pathArray[i]]._id;
            } else {
              current = current[pathArray[i]].subfolders || [];
            }
          }
        }
      }

      // Crear subcarpeta en el backend
      const newSubfolder = await folderService.addSubfolder(parentFolderId, {
        name: trimmedName,
        category: carpeta.category || 'profesional_independiente'
      });

      // Actualizar estado local
      setFormData(prev => {
        const newSubfolders = [...prev.subfolders];
        
        if (!editingPath) {
          newSubfolders.push({ ...newSubfolder, subfolders: [] });
        } else {
          const updateSubfolders = (subfolders, path) => {
            if (path.length === 1) {
              const index = path[0];
              if (subfolders[index]) {
                subfolders[index] = {
                  ...subfolders[index],
                  subfolders: [...(subfolders[index].subfolders || []), { ...newSubfolder, subfolders: [] }]
                };
              }
            } else {
              const [currentIndex, ...remainingPath] = path;
              if (subfolders[currentIndex] && subfolders[currentIndex].subfolders) {
                updateSubfolders(subfolders[currentIndex].subfolders, remainingPath);
              }
            }
          };

          updateSubfolders(newSubfolders, pathArray);
        }
        
        return { ...prev, subfolders: newSubfolders };
      });

      setEditingPath(null);
      setEditingValue('');
    } catch (error) {
      console.error('Error agregando subcarpeta anidada:', error);
      alert('Error al agregar la subcarpeta');
    } finally {
      setLoading(false);
    }
  };

  // Cancelar edición
  const cancelEditing = () => {
    setEditingPath(null);
    setEditingValue('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('El nombre de la carpeta es obligatorio');
      return;
    }

    setLoading(true);
    try {
      // Actualizar la carpeta principal
      await folderService.updateFolder(carpeta._id, {
        name: formData.name,
        description: formData.description
      });
      
      onUpdate({ ...carpeta, name: formData.name, description: formData.description });
      onClose();
    } catch (error) {
      console.error('Error actualizando carpeta:', error);
      alert('Error al actualizar la carpeta');
    } finally {
      setLoading(false);
    }
  };

  // Renderizar subcarpetas de forma recursiva
  const renderSubfolders = (subfolders, level = 0, parentPath = '') => {
    if (!Array.isArray(subfolders) || subfolders.length === 0) {
      return (
        <div className="text-center py-6 text-gray-500">
          <svg className="h-12 w-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <p className="text-sm font-medium">No hay subcarpetas</p>
          <p className="text-xs text-gray-400 mt-1">Agrega una subcarpeta usando el botón +</p>
        </div>
      );
    }

    return subfolders.map((subfolder, index) => {
      if (!subfolder || typeof subfolder !== 'object' || !subfolder.name) {
        return null;
      }

      const currentPath = parentPath ? `${parentPath}-${index}` : `${index}`;
      const isEditing = editingPath === currentPath;
      const hasNestedSubfolders = Array.isArray(subfolder.subfolders) && subfolder.subfolders.length > 0;
      const nestedCount = hasNestedSubfolders ? subfolder.subfolders.length : 0;

      return (
        <div key={`${level}-${index}-${subfolder.name}`} className="mb-4">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 hover:shadow-md transition-all duration-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <div>
                <span className="font-semibold text-gray-800 text-lg">{subfolder.name}</span>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full font-medium">
                    {nestedCount} subcarpeta{nestedCount !== 1 ? 's' : ''}
                  </span>
                  {hasNestedSubfolders && (
                    <span className="text-xs text-gray-500">
                      {countTotalSubfolders(subfolder.subfolders)} total
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => showEditName(currentPath)}
                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-200 hover:scale-105"
                title="Editar nombre"
                disabled={isEditing || loading}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => showNestedInput(currentPath)}
                className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors duration-200 hover:scale-105"
                title="Agregar subcarpeta"
                disabled={isEditing || loading}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
          </div>

          {/* Input para editar nombre o agregar subcarpeta anidada */}
          {isEditing && (
            <div className="ml-6 mt-3 p-4 bg-blue-50 rounded-xl border border-blue-200 shadow-sm">
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                  className="flex-1 px-4 py-3 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                  placeholder={editingValue ? "Nuevo nombre de la subcarpeta" : "Nombre de la subcarpeta anidada"}
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      if (editingValue) {
                        saveNameEdit();
                      } else {
                        saveNestedSubfolder();
                      }
                    } else if (e.key === 'Escape') {
                      cancelEditing();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={editingValue ? saveNameEdit : saveNestedSubfolder}
                  className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors duration-200"
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : (editingValue ? 'Guardar' : 'Agregar')}
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm font-medium transition-colors duration-200"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Renderizar subcarpetas anidadas recursivamente */}
          {hasNestedSubfolders && (
            <div className="ml-6 mt-3 border-l-2 border-blue-200 pl-4">
              {renderSubfolders(subfolder.subfolders, level + 1, currentPath)}
            </div>
          )}
        </div>
      );
    }).filter(Boolean);
  };

  if (loading && !formData.name) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Cargando estructura de carpeta...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalSubfolders = countTotalSubfolders(formData.subfolders);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-5xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg mr-4">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Editar Carpeta Anidada</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {totalSubfolders > 0 ? `${totalSubfolders} subcarpeta${totalSubfolders !== 1 ? 's' : ''} total` : 'Sin subcarpetas'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowEliminarModal(true)}
                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-200"
                title="Eliminar carpeta"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Nombre de la carpeta principal */}
            <div className="bg-gray-50 p-6 rounded-xl">
              <label className="block text-lg font-semibold text-gray-700 mb-3">
                Nombre de la carpeta principal *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-medium"
                placeholder="Ej: Documentos Básicos"
                required
              />
            </div>

            {/* Descripción */}
            <div className="bg-gray-50 p-6 rounded-xl">
              <label className="block text-lg font-semibold text-gray-700 mb-3">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                rows="3"
                placeholder="Describe el propósito de esta carpeta..."
              />
            </div>

            {/* Subcarpetas */}
            <div className="bg-gray-50 p-6 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-lg font-semibold text-gray-700">
                  Subcarpetas
                </label>
                <span className="text-sm text-gray-500 bg-blue-100 px-3 py-1 rounded-full">
                  {totalSubfolders} total
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-6">
                Puedes agregar subcarpetas dentro de esta carpeta principal y también subcarpetas dentro de las subcarpetas.
              </p>

              {/* Agregar subcarpeta principal */}
              <div className="flex space-x-3 mb-6">
                <input
                  type="text"
                  value={mainSubfolderInput}
                  onChange={(e) => setMainSubfolderInput(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                  placeholder="Nombre de la subcarpeta"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addSubfolder();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={addSubfolder}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors duration-200"
                  disabled={loading}
                >
                  {loading ? 'Agregando...' : 'Agregar'}
                </button>
              </div>

              {/* Lista de subcarpetas */}
              <div className="min-h-[200px]">
                {formData.subfolders.length > 0 ? (
                  <div className="space-y-2">
                    {renderSubfolders(formData.subfolders)}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg className="h-16 w-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <h4 className="text-lg font-medium text-gray-600 mb-2">No hay subcarpetas</h4>
                    <p className="text-sm text-gray-500">Agrega una subcarpeta usando el campo de arriba</p>
                  </div>
                )}
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors duration-200"
                disabled={loading}
              >
                {loading ? 'Actualizando...' : 'Actualizar Carpeta'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal de eliminación */}
      <EliminarSubcarpetasModal
        isOpen={showEliminarModal}
        onClose={() => setShowEliminarModal(false)}
        carpeta={carpeta}
        onEliminacionCompleta={(tipo, cantidad) => {
          console.log('Eliminación completada:', tipo, cantidad);
          if (tipo === 'completa' || tipo === 'solo_principal') {
            // Si se eliminó la carpeta principal, cerrar el editor
            onClose();
          } else if (tipo === 'seleccionadas') {
            // Si se eliminaron subcarpetas, recargar la estructura
            window.location.reload(); // Recarga simple para actualizar
          }
        }}
      />
    </div>
  );
};

export default EditarCarpetaAnidada;