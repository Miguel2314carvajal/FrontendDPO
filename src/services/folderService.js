import api from '../config/api.js';

export const folderService = {
  // Listar todas las carpetas del usuario
  getFolders: async () => {
    try {
      console.log('🔄 Haciendo petición a /api/folders/listar...');
      const response = await api.get('/api/folders/listar');
      console.log('✅ Respuesta de carpetas:', response.data);
      
      // El backend devuelve un array directo, no un objeto con 'carpetas'
      const folders = Array.isArray(response.data) ? response.data : [];
      console.log('📁 Carpetas procesadas:', folders.length);
      
      // Devolver en el formato esperado por el frontend
      return {
        carpetas: folders
      };
    } catch (error) {
      console.error('❌ Error obteniendo carpetas:', error);
      console.error('❌ Error details:', error.response?.data);
      throw error.response?.data || { mensaje: 'Error al obtener carpetas' };
    }
  },

  // Obtener detalles de una carpeta específica
  getFolderDetails: async (folderId) => {
    try {
      const response = await api.get(`/api/folders/${folderId}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo detalles de carpeta:', error);
      throw error.response?.data || { mensaje: 'Error al obtener detalles de carpeta' };
    }
  },

  // Obtener una carpeta específica (alias para getFolderDetails)
  getFolder: async (folderId) => {
    try {
      const response = await api.get(`/api/folders/${folderId}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo carpeta:', error);
      throw error.response?.data || { mensaje: 'Error al obtener carpeta' };
    }
  },

  // Crear nueva carpeta (solo admin)
  createFolder: async (folderData) => {
    try {
      const response = await api.post('/api/folders/crear', folderData);
      return response.data;
    } catch (error) {
      console.error('Error creando carpeta:', error);
      throw error.response?.data || { mensaje: 'Error al crear carpeta' };
    }
  },

  // Actualizar carpeta (solo admin)
  updateFolder: async (folderId, folderData) => {
    try {
      const response = await api.put(`/api/folders/${folderId}`, folderData);
      return response.data;
    } catch (error) {
      console.error('Error actualizando carpeta:', error);
      throw error.response?.data || { mensaje: 'Error al actualizar carpeta' };
    }
  },

  // Eliminar carpeta (solo admin)
  deleteFolder: async (folderId) => {
    try {
      const response = await api.delete(`/api/folders/${folderId}`);
      return response.data;
    } catch (error) {
      console.error('Error eliminando carpeta:', error);
      throw error.response?.data || { mensaje: 'Error al eliminar carpeta' };
    }
  },

  // Asignar usuarios a una carpeta (solo admin)
  assignUsersToFolder: async (folderId, userIds) => {
    try {
      console.log('🔄 Asignando usuarios a carpeta:', folderId, userIds);
      const response = await api.put(`/api/folders/${folderId}/usuarios`, { usuarios: userIds });
      console.log('✅ Usuarios asignados:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error asignando usuarios:', error);
      throw error.response?.data || { mensaje: 'Error al asignar usuarios' };
    }
  },

  // Crear carpetas de prueba (solo admin)
  createTestFolders: async () => {
    try {
      console.log('🔄 Creando carpetas de prueba...');
      const response = await api.post('/api/folders/crear-prueba');
      console.log('✅ Carpetas de prueba creadas:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error creando carpetas de prueba:', error);
      throw error.response?.data || { mensaje: 'Error al crear carpetas de prueba' };
    }
  },

  // Limpiar todas las carpetas (solo admin)
  clearAllFolders: async () => {
    try {
      console.log('🔄 Limpiando todas las carpetas...');
      const response = await api.post('/api/folders/limpiar');
      console.log('✅ Carpetas limpiadas:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error limpiando carpetas:', error);
      throw error.response?.data || { mensaje: 'Error al limpiar carpetas' };
    }
  },

  // Debug de carpetas
  debugFolders: async () => {
    try {
      console.log('🔄 Debug de carpetas...');
      const response = await api.get('/api/folders/debug');
      console.log('✅ Debug completado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error en debug:', error);
      throw error.response?.data || { mensaje: 'Error en debug' };
    }
  },

  // Obtener carpetas por categoría
  getFoldersByCategory: async (category) => {
    try {
      console.log('🔄 Obteniendo carpetas para categoría:', category);
      const response = await api.get(`/api/folders/categoria/${category}`);
      console.log('✅ Carpetas por categoría:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error obteniendo carpetas por categoría:', error);
      throw error.response?.data || { mensaje: 'Error al obtener carpetas por categoría' };
    }
  }
};
