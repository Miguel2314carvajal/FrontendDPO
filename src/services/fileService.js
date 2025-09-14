import api from '../config/api.js';

export const fileService = {
  // Listar archivos de una carpeta
  getFiles: async (folderId) => {
    try {
      const response = await api.get(`/api/files/listar?folderId=${folderId}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo archivos:', error);
      throw error.response?.data || { mensaje: 'Error al obtener archivos' };
    }
  },

  // Subir archivo
  uploadFile: async (formData) => {
    try {
      console.log('📤 Subiendo archivo con FormData:', formData);
      
      const response = await api.post('/api/files/subir', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 segundos para archivos grandes
      });

      console.log('✅ Archivo subido exitosamente:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error subiendo archivo:', error);
      throw error.response?.data || { mensaje: 'Error al subir archivo' };
    }
  },

  // Eliminar archivo
  deleteFile: async (fileId) => {
    try {
      const response = await api.delete(`/api/files/${fileId}`);
      return response.data;
    } catch (error) {
      console.error('Error eliminando archivo:', error);
      throw error.response?.data || { mensaje: 'Error al eliminar archivo' };
    }
  },

  // Descargar archivo
  downloadFile: async (fileId, fileName) => {
    try {
      const response = await api.get(`/api/files/descargar/${fileId}`, {
        responseType: 'blob',
      });

      // Crear URL para descarga
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      console.error('Error descargando archivo:', error);
      throw error.response?.data || { mensaje: 'Error al descargar archivo' };
    }
  },

  // Ver archivo en nueva pestaña
  viewFile: async (fileId) => {
    try {
      const token = localStorage.getItem('token');
      const url = `${api.defaults.baseURL}/api/files/servir/${fileId}?token=${token}`;
      window.open(url, '_blank');
      return { success: true };
    } catch (error) {
      console.error('Error viendo archivo:', error);
      throw error.response?.data || { mensaje: 'Error al ver archivo' };
    }
  }
};
