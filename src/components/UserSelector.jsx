import React, { useState, useEffect } from 'react';
import api from '../config/api';
import toast from 'react-hot-toast';

const UserSelector = ({ selectedUsers, onChange }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log('🔄 Cargando usuarios...');
      const response = await api.get('/api/users/listar');
      console.log('✅ Respuesta:', response.data);
      
      if (Array.isArray(response.data)) {
        // Si la respuesta es un array directamente
        setUsers(response.data);
      } else if (response.data && Array.isArray(response.data.users)) {
        // Si la respuesta tiene la propiedad users
        setUsers(response.data.users);
      } else {
        console.error('❌ Formato de respuesta inesperado:', response.data);
        throw new Error('Formato de respuesta inválido');
      }
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      console.error('Detalles del error:', error.response?.data || error.message);
      toast.error(error.response?.data?.msg || 'Error al cargar la lista de usuarios');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Usuarios
      </label>
      <div className="border border-gray-300 rounded-md p-3 max-h-48 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-gray-500">Cargando usuarios...</span>
          </div>
        ) : users.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-2">
            No hay usuarios disponibles
          </p>
        ) : (
          <div className="space-y-2">
            {users.map((user) => (
              <label
                key={user._id}
                className="flex items-center space-x-3 py-2 hover:bg-gray-50 px-2 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(user._id)}
                  onChange={(e) => {
                    const updatedUsers = e.target.checked
                      ? [...selectedUsers, user._id]
                      : selectedUsers.filter(id => id !== user._id);
                    onChange(updatedUsers);
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <div className="text-sm text-gray-900">{user.email}</div>
                  <div className="text-xs text-gray-500">{user.companyName}</div>
                </div>
                <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                  {user.rol}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>
      <div className="mt-2 text-xs text-gray-500 flex justify-between">
        <span>Total: {users.length} usuarios</span>
        <span>Seleccionados: {selectedUsers.length}</span>
      </div>
    </div>
  );
};

export default UserSelector;