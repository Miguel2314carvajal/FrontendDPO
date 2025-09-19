import React, { useState, useEffect } from 'react';
import { folderService } from '../services/folderService';

const EliminarSubcarpetasModal = ({ 
  isOpen, 
  onClose, 
  carpeta, 
  onEliminacionCompleta 
}) => {
  const [opcionEliminacion, setOpcionEliminacion] = useState(null);
  const [subcarpetasSeleccionadas, setSubcarpetasSeleccionadas] = useState([]);
  const [todasLasSubcarpetas, setTodasLasSubcarpetas] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && carpeta) {
      cargarTodasLasSubcarpetas();
    }
  }, [isOpen, carpeta]);

  const cargarTodasLasSubcarpetas = async () => {
    try {
      setLoading(true);
      console.log('🔍 Cargando subcarpetas para:', carpeta.name);
      
      // Obtener estructura jerárquica completa
      const response = await folderService.getHierarchicalStructure();
      console.log('📁 Estructura completa recibida:', response);
      
      // Buscar la carpeta específica en la estructura jerárquica
      const findFolderInHierarchy = (folders, targetId) => {
        for (const folder of folders) {
          console.log('🔍 Buscando en carpeta:', folder.name, 'ID:', folder._id, 'Target:', targetId);
          if (folder._id === targetId) {
            console.log('✅ Carpeta encontrada:', folder.name);
            return folder;
          }
          if (folder.subcarpetas && folder.subcarpetas.length > 0) {
            console.log('🔍 Buscando en subcarpetas de:', folder.name);
            const found = findFolderInHierarchy(folder.subcarpetas, targetId);
            if (found) return found;
          }
        }
        return null;
      };

      const folderData = findFolderInHierarchy(response || [], carpeta._id);
      console.log('📁 Datos de la carpeta encontrada:', folderData);
      
      if (folderData && folderData.subcarpetas) {
        console.log('📁 Subcarpetas directas encontradas:', folderData.subcarpetas.length);
        // Aplanar todas las subcarpetas recursivamente
        const subcarpetasAplanadas = aplanarSubcarpetas(folderData.subcarpetas);
        console.log('📁 Total de subcarpetas aplanadas:', subcarpetasAplanadas.length);
        setTodasLasSubcarpetas(subcarpetasAplanadas);
      } else {
        console.log('⚠️ No se encontraron subcarpetas');
        setTodasLasSubcarpetas([]);
      }
    } catch (error) {
      console.error('❌ Error cargando subcarpetas:', error);
      setTodasLasSubcarpetas([]);
    } finally {
      setLoading(false);
    }
  };

  // Función recursiva para aplanar todas las subcarpetas
  const aplanarSubcarpetas = (subcarpetas, nivel = 0, ruta = []) => {
    let resultado = [];
    
    console.log('🔍 Aplanando subcarpetas en nivel', nivel, ':', subcarpetas.length, 'elementos');
    
    subcarpetas.forEach((subcarpeta, index) => {
      const nuevaRuta = [...ruta, index];
      const subcarpetaConRuta = {
        ...subcarpeta,
        nivel,
        ruta: nuevaRuta.join('-'),
        rutaCompleta: nuevaRuta
      };
      
      console.log('📁 Agregando subcarpeta:', subcarpeta.name, 'nivel:', nivel);
      resultado.push(subcarpetaConRuta);
      
      // Verificar si tiene subcarpetas anidadas
      if (subcarpeta.subcarpetas && subcarpeta.subcarpetas.length > 0) {
        console.log('🔍 Subcarpeta', subcarpeta.name, 'tiene', subcarpeta.subcarpetas.length, 'subcarpetas anidadas');
        const subcarpetasAnidadas = aplanarSubcarpetas(
          subcarpeta.subcarpetas, 
          nivel + 1, 
          nuevaRuta
        );
        console.log('📁 Subcarpetas anidadas encontradas:', subcarpetasAnidadas.length);
        resultado = resultado.concat(subcarpetasAnidadas);
      } else {
        console.log('📁 Subcarpeta', subcarpeta.name, 'no tiene subcarpetas anidadas');
      }
    });
    
    console.log('📊 Total de subcarpetas en nivel', nivel, ':', resultado.length);
    return resultado;
  };

  const handleSeleccionarSubcarpeta = (subcarpeta) => {
    setSubcarpetasSeleccionadas(prev => {
      const existe = prev.some(s => s._id === subcarpeta._id);
      if (existe) {
        return prev.filter(s => s._id !== subcarpeta._id);
      } else {
        return [...prev, subcarpeta];
      }
    });
  };

  const handleSeleccionarTodas = () => {
    if (subcarpetasSeleccionadas.length === todasLasSubcarpetas.length) {
      setSubcarpetasSeleccionadas([]);
    } else {
      setSubcarpetasSeleccionadas([...todasLasSubcarpetas]);
    }
  };

  const handleEliminar = async () => {
    if (opcionEliminacion === 'todas') {
      // Eliminar carpeta principal y todas las subcarpetas
      await eliminarCarpetaCompleta();
    } else if (opcionEliminacion === 'seleccionadas') {
      // Eliminar solo las subcarpetas seleccionadas
      await eliminarSubcarpetasSeleccionadas();
    } else if (opcionEliminacion === 'solo_principal') {
      // Eliminar solo la carpeta principal
      await eliminarSoloCarpetaPrincipal();
    }
  };

  const eliminarCarpetaCompleta = async () => {
    try {
      setLoading(true);
      await folderService.deleteFolder(carpeta._id);
      onEliminacionCompleta('completa');
      onClose();
    } catch (error) {
      console.error('Error eliminando carpeta completa:', error);
      alert('Error al eliminar la carpeta completa');
    } finally {
      setLoading(false);
    }
  };

  const eliminarSubcarpetasSeleccionadas = async () => {
    try {
      setLoading(true);
      
      // Eliminar cada subcarpeta seleccionada
      for (const subcarpeta of subcarpetasSeleccionadas) {
        await folderService.deleteFolder(subcarpeta._id);
      }
      
      onEliminacionCompleta('seleccionadas', subcarpetasSeleccionadas.length);
      onClose();
    } catch (error) {
      console.error('Error eliminando subcarpetas seleccionadas:', error);
      alert('Error al eliminar las subcarpetas seleccionadas');
    } finally {
      setLoading(false);
    }
  };

  const eliminarSoloCarpetaPrincipal = async () => {
    try {
      setLoading(true);
      await folderService.deleteFolder(carpeta._id);
      onEliminacionCompleta('solo_principal');
      onClose();
    } catch (error) {
      console.error('Error eliminando solo carpeta principal:', error);
      alert('Error al eliminar la carpeta principal');
    } finally {
      setLoading(false);
    }
  };

  const renderSubcarpeta = (subcarpeta) => {
    const indentacion = subcarpeta.nivel * 20;
    
    return (
      <div 
        key={subcarpeta._id}
        className="flex items-center p-3 hover:bg-gray-50 rounded-lg"
        style={{ marginLeft: `${indentacion}px` }}
      >
        <input
          type="checkbox"
          checked={subcarpetasSeleccionadas.some(s => s._id === subcarpeta._id)}
          onChange={() => handleSeleccionarSubcarpeta(subcarpeta)}
          className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <div className="flex items-center flex-1">
          <svg className="h-5 w-5 text-yellow-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <div>
            <span className="font-medium text-gray-800">{subcarpeta.name}</span>
            <div className="text-xs text-gray-500">
              Nivel {subcarpeta.nivel} • {subcarpeta.subcarpetas?.length || 0} subcarpetas
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg mr-4">
                <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Eliminar Carpeta</h3>
                <p className="text-sm text-gray-500 mt-1">
                  "{carpeta?.name}" tiene {todasLasSubcarpetas.length} subcarpetas
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Opciones de eliminación */}
          <div className="space-y-4 mb-6">
            <div 
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                opcionEliminacion === 'todas' 
                  ? 'border-red-500 bg-red-50' 
                  : 'border-gray-200 hover:border-red-300'
              }`}
              onClick={() => setOpcionEliminacion('todas')}
            >
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center">
                  {opcionEliminacion === 'todas' && (
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-red-600">CARPETA + TODAS LAS SUBCARPETAS</h4>
                  <p className="text-sm text-gray-600">Eliminará la carpeta principal y todas sus subcarpetas</p>
                </div>
              </div>
            </div>

            <div 
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                opcionEliminacion === 'seleccionadas' 
                  ? 'border-yellow-500 bg-yellow-50' 
                  : 'border-gray-200 hover:border-yellow-300'
              }`}
              onClick={() => setOpcionEliminacion('seleccionadas')}
            >
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center">
                  {opcionEliminacion === 'seleccionadas' && (
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-yellow-600">SELECCIONAR SUBCARPETAS</h4>
                  <p className="text-sm text-gray-600">Eliminar solo las subcarpetas seleccionadas</p>
                </div>
              </div>
            </div>

            <div 
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                opcionEliminacion === 'solo_principal' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-blue-300'
              }`}
              onClick={() => setOpcionEliminacion('solo_principal')}
            >
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center">
                  {opcionEliminacion === 'solo_principal' && (
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-blue-600">SOLO ESTA CARPETA</h4>
                  <p className="text-sm text-gray-600">Eliminará solo la carpeta principal (las subcarpetas quedarán huérfanas)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de subcarpetas (solo si se selecciona la opción de seleccionar) */}
          {opcionEliminacion === 'seleccionadas' && (
            <div className="border border-gray-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-800">Seleccionar Subcarpetas para Eliminar</h4>
                <button
                  onClick={handleSeleccionarTodas}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  {subcarpetasSeleccionadas.length === todasLasSubcarpetas.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
                </button>
              </div>
              
              <div className="max-h-64 overflow-y-auto">
                {loading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-600">Cargando subcarpetas...</p>
                  </div>
                ) : todasLasSubcarpetas.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <p>No hay subcarpetas para eliminar</p>
                  </div>
                ) : (
                  todasLasSubcarpetas.map(renderSubcarpeta)
                )}
              </div>
              
              {subcarpetasSeleccionadas.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>{subcarpetasSeleccionadas.length}</strong> subcarpeta{subcarpetasSeleccionadas.length !== 1 ? 's' : ''} seleccionada{subcarpetasSeleccionadas.length !== 1 ? 's' : ''} para eliminar
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium transition-colors duration-200"
            >
              Cancelar
            </button>
            <button
              onClick={handleEliminar}
              disabled={loading || (opcionEliminacion === 'seleccionadas' && subcarpetasSeleccionadas.length === 0)}
              className={`px-6 py-3 rounded-lg font-medium transition-colors duration-200 ${
                loading || (opcionEliminacion === 'seleccionadas' && subcarpetasSeleccionadas.length === 0)
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {loading ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EliminarSubcarpetasModal;
