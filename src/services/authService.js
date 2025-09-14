import api from '../config/api.js';

// Generar deviceId único para web (basado en localStorage)
let cachedDeviceId = null;

const generateDeviceId = () => {
  // Usar cache si ya existe
  if (cachedDeviceId) {
    return cachedDeviceId;
  }
  
  let deviceId = localStorage.getItem('deviceId');
  
  if (!deviceId) {
    // Generar nuevo deviceId único
    deviceId = `web_${Date.now()}_${Math.random().toString(36).substr(2, 15)}`;
    localStorage.setItem('deviceId', deviceId);
    console.log('📱 Nuevo deviceId generado para web:', deviceId);
  } else {
    console.log('📱 DeviceId existente reutilizado:', deviceId);
  }
  
  // Cachear el deviceId
  cachedDeviceId = deviceId;
  return deviceId;
};

// Interceptor para agregar deviceId a todas las peticiones
api.interceptors.request.use((config) => {
  const deviceId = generateDeviceId();
  config.headers['x-device-id'] = deviceId;
  return config;
});

// Interceptor para manejar respuestas
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado, limpiar localStorage y cache
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      cachedDeviceId = null; // Limpiar cache del deviceId
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  // Login de usuario
  login: async (credentials) => {
    try {
      console.log('🌐 URL del backend:', api.defaults.baseURL);
      console.log('🌐 URL completa:', `${api.defaults.baseURL}/api/users/login`);
      console.log('🔐 Iniciando login web con:', credentials.email);
      
      const deviceId = generateDeviceId();
      const response = await api.post('/api/users/login', {
        ...credentials,
        deviceId
      }, {
        headers: {
          'x-device-id': deviceId
        }
      });

      // El backend devuelve los datos del usuario directamente en response.data
      // Estructura: { companyName, token, _id, rol, email, folders }
      const userData = {
        _id: response.data._id,
        email: response.data.email,
        rol: response.data.rol,
        companyName: response.data.companyName,
        folders: response.data.folders || []
      };
      
      // Guardar datos en localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', response.data.token);
      
      console.log('✅ Login web exitoso');
      console.log('📱 Respuesta completa:', response.data);
      console.log('📱 Datos del usuario extraídos:', userData);
      console.log('📱 Token:', response.data.token);
      
      // Devolver en el formato esperado por el frontend
      const result = {
        user: userData,
        token: response.data.token
      };
      
      console.log('📱 Resultado final del login:', result);
      return result;
    } catch (error) {
      console.error('❌ Error en login web:', error);
      throw error.response?.data || { mensaje: 'Error en el login' };
    }
  },

  // Logout
  logout: async () => {
    try {
      const deviceId = localStorage.getItem('deviceId');
      if (deviceId) {
        await api.post('/api/users/cerrar-sesion-actual', { deviceId });
        console.log('✅ Sesión cerrada en el backend');
      }
    } catch (error) {
      console.error('⚠️ Error cerrando sesión:', error);
    } finally {
      // Limpiar localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('deviceId');
      console.log('✅ Logout web completado');
    }
  },

  // Obtener perfil del usuario
  getProfile: async () => {
    try {
      const response = await api.get('/api/users/perfil');
      console.log('📱 Perfil obtenido:', response.data);
      
      // El backend devuelve los datos del usuario directamente
      const userData = {
        _id: response.data._id,
        email: response.data.email,
        rol: response.data.rol,
        companyName: response.data.companyName,
        nombre: response.data.nombre,
        cedula: response.data.cedula,
        maxSessions: response.data.maxSessions
      };
      
      return {
        user: userData
      };
    } catch (error) {
      throw error.response?.data || { mensaje: 'Error al obtener perfil' };
    }
  },

  // Verificar si el usuario está autenticado
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token && user);
  },

  // Obtener usuario actual
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Obtener token
  getToken: () => {
    return localStorage.getItem('token');
  },

  // Listar todos los usuarios (solo admin)
  listUsers: async () => {
    try {
      const response = await api.get('/api/users/listar');
      return response.data;
    } catch (error) {
      console.error('Error listando usuarios:', error);
      throw error.response?.data || { mensaje: 'Error al listar usuarios' };
    }
  },

  // Crear nuevo usuario (solo admin)
  createUser: async (userData) => {
    try {
      const response = await api.post('/api/users/registro', userData);
      return response.data;
    } catch (error) {
      console.error('Error creando usuario:', error);
      throw error.response?.data || { mensaje: 'Error al crear usuario' };
    }
  },

  // Obtener usuario por ID (solo admin)
  getUserById: async (userId) => {
    try {
      const response = await api.get(`/api/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo usuario:', error);
      throw error.response?.data || { mensaje: 'Error al obtener usuario' };
    }
  },

  // Actualizar usuario (solo admin)
  updateUser: async (userId, userData) => {
    try {
      const response = await api.put(`/api/users/actualizar/${userId}`, userData);
      return response.data;
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      throw error.response?.data || { mensaje: 'Error al actualizar usuario' };
    }
  },

  // Eliminar usuario (solo admin)
  deleteUser: async (userId) => {
    try {
      const response = await api.delete(`/api/users/eliminar/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      throw error.response?.data || { mensaje: 'Error al eliminar usuario' };
    }
  },

  // Restablecer contraseña de usuario (solo administradores)
  resetUserPassword: async (userId, newPassword) => {
    try {
      const response = await api.post(`/api/users/reset-password/${userId}`, {
        newPassword
      });
      return response.data;
    } catch (error) {
      console.error('Error restableciendo contraseña:', error);
      throw error.response?.data || { mensaje: 'Error al restablecer contraseña' };
    }
  },

  // Cambiar contraseña del usuario actual
  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await api.post('/api/users/cambiar-contrasena', {
        currentPassword,
        newPassword
      });
      return response.data;
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      throw error.response?.data || { mensaje: 'Error al cambiar contraseña' };
    }
  },

  // Limpiar cache del deviceId
  clearDeviceIdCache: () => {
    cachedDeviceId = null;
    localStorage.removeItem('deviceId');
  }
};

export default api;
