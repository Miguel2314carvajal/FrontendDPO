import React, { useState } from 'react';

const NestedFolderCreator = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  parentFolder = null,
  parentPath = []
}) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'profesional_independiente',
    description: '',
    subfolders: []
  });

  const [editingSubfolder, setEditingSubfolder] = useState({
    index: null,
    name: '',
    subfolders: []
  });

  const [nestedInputs, setNestedInputs] = useState({});

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addSubfolder = () => {
    if (editingSubfolder.name.trim()) {
      // Verificar que no existe ya una subcarpeta con el mismo nombre
      const existingSubfolder = formData.subfolders.find(
        sub => sub.name === editingSubfolder.name.trim()
      );
      
      if (existingSubfolder) {
        alert('Ya existe una subcarpeta con ese nombre');
        return;
      }

      const newSubfolder = {
        name: editingSubfolder.name.trim(),
        category: formData.category,
        subfolders: editingSubfolder.subfolders || []
      };

      setFormData(prev => ({
        ...prev,
        subfolders: [...prev.subfolders, newSubfolder]
      }));

      setEditingSubfolder({
        index: null,
        name: '',
        subfolders: []
      });
    }
  };

  const addNestedSubfolder = (parentIndex) => {
    // Mostrar input para la subcarpeta anidada
    setNestedInputs(prev => ({
      ...prev,
      [parentIndex]: ''
    }));
  };

  const saveNestedSubfolder = (parentIndex) => {
    const subfolderName = nestedInputs[parentIndex];
    if (subfolderName && subfolderName.trim()) {
      const newSubfolder = {
        name: subfolderName.trim(),
        category: formData.category,
        subfolders: []
      };

      setFormData(prev => {
        const newSubfolders = [...prev.subfolders];
        
        // Verificar que el índice existe y el objeto es válido
        if (newSubfolders[parentIndex] && typeof newSubfolders[parentIndex] === 'object') {
          if (!newSubfolders[parentIndex].subfolders) {
            newSubfolders[parentIndex].subfolders = [];
          }
          
          // Verificar que no existe ya una subcarpeta con el mismo nombre
          const existingSubfolder = newSubfolders[parentIndex].subfolders.find(
            sub => sub.name === newSubfolder.name
          );
          
          if (!existingSubfolder) {
            newSubfolders[parentIndex].subfolders.push(newSubfolder);
          } else {
            alert('Ya existe una subcarpeta con ese nombre');
            return prev;
          }
        } else {
          console.error('Índice de subcarpeta padre inválido:', parentIndex);
          return prev;
        }
        
        return { ...prev, subfolders: newSubfolders };
      });

      // Limpiar el input
      setNestedInputs(prev => {
        const newInputs = { ...prev };
        delete newInputs[parentIndex];
        return newInputs;
      });
    }
  };

  const cancelNestedSubfolder = (parentIndex) => {
    setNestedInputs(prev => {
      const newInputs = { ...prev };
      delete newInputs[parentIndex];
      return newInputs;
    });
  };

  const removeSubfolder = (index) => {
    setFormData(prev => ({
      ...prev,
      subfolders: prev.subfolders.filter((_, i) => i !== index)
    }));
  };

  const removeNestedSubfolder = (parentIndex, subIndex) => {
    setFormData(prev => {
      const newSubfolders = [...prev.subfolders];
      newSubfolders[parentIndex].subfolders = newSubfolders[parentIndex].subfolders.filter((_, i) => i !== subIndex);
      return { ...prev, subfolders: newSubfolders };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('El nombre de la carpeta es obligatorio');
      return;
    }

    onSubmit({
      ...formData,
      parentFolder: parentFolder?._id || null,
      parentPath
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'profesional_independiente',
      description: '',
      subfolders: []
    });
    setEditingSubfolder({
      index: null,
      name: '',
      subfolders: []
    });
    setNestedInputs({});
  };

  const renderSubfolderTree = (subfolders, level = 0) => {
    // Verificar que subfolders es un array válido
    if (!Array.isArray(subfolders) || subfolders.length === 0) {
      return null;
    }

    return subfolders.map((subfolder, index) => {
      // Verificar que subfolder es un objeto válido
      if (!subfolder || typeof subfolder !== 'object' || !subfolder.name) {
        console.warn('Subcarpeta inválida en índice:', index, subfolder);
        return null;
      }

      return (
        <div key={`${level}-${index}-${subfolder.name}`} className="ml-4 border-l-2 border-gray-200 pl-4">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center space-x-2">
              <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span className="font-medium text-gray-700">{subfolder.name}</span>
              <span className="text-xs text-gray-500">({Array.isArray(subfolder.subfolders) ? subfolder.subfolders.length : 0} subcarpetas)</span>
            </div>
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => addNestedSubfolder(index)}
                className="p-1 text-green-600 hover:bg-green-100 rounded"
                title="Agregar subcarpeta"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => removeSubfolder(index)}
                className="p-1 text-red-600 hover:bg-red-100 rounded"
                title="Eliminar subcarpeta"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Input para agregar subcarpeta anidada */}
          {nestedInputs[index] !== undefined && (
            <div className="ml-6 mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={nestedInputs[index] || ''}
                  onChange={(e) => setNestedInputs(prev => ({
                    ...prev,
                    [index]: e.target.value
                  }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Nombre de la subcarpeta anidada"
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      saveNestedSubfolder(index);
                    } else if (e.key === 'Escape') {
                      cancelNestedSubfolder(index);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => saveNestedSubfolder(index)}
                  className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                >
                  ✓
                </button>
                <button
                  type="button"
                  onClick={() => cancelNestedSubfolder(index)}
                  className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Renderizar subcarpetas anidadas recursivamente */}
          {Array.isArray(subfolder.subfolders) && subfolder.subfolders.length > 0 && (
            <div className="ml-4">
              {renderSubfolderTree(subfolder.subfolders, level + 1)}
            </div>
          )}
        </div>
      );
    }).filter(Boolean); // Filtrar elementos null/undefined
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <svg className="h-6 w-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900">
                Crear Carpeta Anidada
              </h3>
            </div>
            <button
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {parentPath.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Ubicación:</strong> {parentPath.join(' > ')}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nombre de la carpeta principal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la carpeta principal *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Documentos Básicos"
                required
              />
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría *
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="profesional_independiente">Profesional Independiente</option>
                <option value="transporte_escolar">Transporte Escolar</option>
                <option value="encargador_seguros">Encargador de Seguros</option>
              </select>
            </div>

            {/* Subcarpetas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subcarpetas (opcional)
              </label>
              <p className="text-sm text-gray-500 mb-3">
                Puedes agregar subcarpetas dentro de esta carpeta principal y también subcarpetas dentro de las subcarpetas.
              </p>

              {/* Agregar subcarpeta */}
              <div className="flex space-x-2 mb-4">
                <input
                  type="text"
                  value={editingSubfolder.name}
                  onChange={(e) => setEditingSubfolder(prev => ({ ...prev, name: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nombre de la subcarpeta"
                />
                <button
                  type="button"
                  onClick={addSubfolder}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Agregar
                </button>
              </div>

              {/* Lista de subcarpetas */}
              {formData.subfolders.length > 0 && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 mb-3">Estructura de subcarpetas:</h4>
                  {renderSubfolderTree(formData.subfolders)}
                </div>
              )}
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-700">
                {formData.subfolders.length > 0 ? 
                  `Esta carpeta se creará con ${formData.subfolders.length} subcarpeta(s) y sus respectivas subcarpetas anidadas` :
                  `Esta carpeta se creará para almacenar archivos relacionados con "${formData.name || 'la carpeta'}"`
                }
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Crear Carpeta Anidada
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NestedFolderCreator;
