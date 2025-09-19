import api from '../config/api.js';

export const groupService = {
  // Crear nuevo grupo
  createGroup: async (groupData) => {
    try {
      console.log('🔄 Creando grupo:', groupData);
      const response = await api.post('/api/groups/crear', groupData);
      console.log('✅ Grupo creado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error creando grupo:', error);
      throw error.response?.data || { mensaje: 'Error al crear grupo' };
    }
  },

  // Listar todos los grupos
  getGroups: async () => {
    try {
      console.log('🔄 Obteniendo grupos...');
      const response = await api.get('/api/groups/listar');
      console.log('✅ Grupos obtenidos:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error obteniendo grupos:', error);
      throw error.response?.data || { mensaje: 'Error al obtener grupos' };
    }
  },

  // Obtener un grupo específico
  getGroup: async (groupId) => {
    try {
      console.log('🔄 Obteniendo grupo:', groupId);
      const response = await api.get(`/api/groups/${groupId}`);
      console.log('✅ Grupo obtenido:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error obteniendo grupo:', error);
      throw error.response?.data || { mensaje: 'Error al obtener grupo' };
    }
  },

  // Actualizar grupo
  updateGroup: async (groupId, groupData) => {
    try {
      console.log('🔄 Actualizando grupo:', groupId, groupData);
      const response = await api.put(`/api/groups/${groupId}`, groupData);
      console.log('✅ Grupo actualizado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error actualizando grupo:', error);
      throw error.response?.data || { mensaje: 'Error al actualizar grupo' };
    }
  },

  // Eliminar grupo
  deleteGroup: async (groupId) => {
    try {
      console.log('🔄 Eliminando grupo:', groupId);
      const response = await api.delete(`/api/groups/${groupId}`);
      console.log('✅ Grupo eliminado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error eliminando grupo:', error);
      throw error.response?.data || { mensaje: 'Error al eliminar grupo' };
    }
  },

  // Agregar usuario al grupo
  addUserToGroup: async (groupId, userId) => {
    try {
      console.log('🔄 Agregando usuario al grupo:', groupId, userId);
      const response = await api.post(`/api/groups/${groupId}/usuarios`, { users: [userId] });
      console.log('✅ Usuario agregado al grupo:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error agregando usuario al grupo:', error);
      throw error.response?.data || { mensaje: 'Error al agregar usuario al grupo' };
    }
  },

  // Remover usuario del grupo
  removeUserFromGroup: async (groupId, userId) => {
    try {
      console.log('🔄 Removiendo usuario del grupo:', groupId, userId);
      const response = await api.delete(`/api/groups/${groupId}/usuarios/${userId}`);
      console.log('✅ Usuario removido del grupo:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error removiendo usuario del grupo:', error);
      throw error.response?.data || { mensaje: 'Error al remover usuario del grupo' };
    }
  },

  // Agregar usuario al grupo
  addUserToGroup: async (groupId, userId) => {
    try {
      console.log('🔄 Agregando usuario al grupo:', groupId, userId);
      const response = await api.post(`/api/groups/${groupId}/usuarios/${userId}`);
      console.log('✅ Usuario agregado al grupo:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error agregando usuario al grupo:', error);
      throw error.response?.data || { mensaje: 'Error al agregar usuario al grupo' };
    }
  }
};
