import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthProvider';
import { authService } from '../services/authService';
import { folderService } from '../services/folderService';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const NewUser = () => {
  const [loading, setLoading] = useState(false);
  const [folders, setFolders] = useState([]);
  const [selectedFolders, setSelectedFolders] = useState([]);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    companyName: '',
    maxSessions: 3,
  });

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    try {
      const response = await folderService.getFolders();
      // Filtrar solo carpetas principales (sin parentFolder)
      const mainFolders = response.carpetas?.filter(folder => !folder.parentFolder) || [];
      setFolders(mainFolders);
    } catch (error) {
      console.error('Error cargando carpetas:', error);
      toast.error('Error al cargar carpetas');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFolderSelect = (folder) => {
    const isSelected = selectedFolders.some(f => f._id === folder._id);
    
    if (isSelected) {
      setSelectedFolders(selectedFolders.filter(f => f._id !== folder._id));
    } else {
      setSelectedFolders([...selectedFolders, folder]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar campos requeridos
    if (!formData.email || !formData.companyName) {
      toast.error('Email y Empresa son obligatorios');
      return;
    }

    if (selectedFolders.length === 0) {
      toast.error('Debes seleccionar al menos una carpeta para el usuario');
      return;
    }

    setLoading(true);
    try {
      // Preparar datos con múltiples carpetas
      const userData = {
        email: formData.email,
        companyName: formData.companyName,
        maxSessions: formData.maxSessions,
        folders: selectedFolders.map(folder => folder._id)
      };

      await authService.createUser(userData);
      toast.success(
        `Usuario creado correctamente con acceso a ${selectedFolders.length} carpeta${selectedFolders.length !== 1 ? 's' : ''}. Se enviará un email con las credenciales temporales.`
      );
      navigate('/dashboard/users');
    } catch (error) {
      console.error('Error creando usuario:', error);
      toast.error(error.mensaje || 'Error al crear el usuario');
    } finally {
      setLoading(false);
    }
  };

  const filteredFolders = folders.filter(folder =>
    folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDisplayText = () => {
    if (selectedFolders.length === 0) {
      return 'Seleccionar carpetas';
    } else if (selectedFolders.length === 1) {
      return selectedFolders[0].name;
    } else {
      return `${selectedFolders.length} carpetas seleccionadas`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="mr-4 p-2 text-gray-600 hover:text-gray-900"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center">
                <svg className="h-8 w-8 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                <h1 className="text-3xl font-bold text-gray-900">Crear Nuevo Usuario</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Información del Usuario */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-6">
                <svg className="h-6 w-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <h2 className="text-xl font-bold text-gray-900">Información del Usuario</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Correo electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="ejemplo@email.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Empresa *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    placeholder="Nombre de la empresa"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Límite de dispositivos *
                  </label>
                  <div className="flex space-x-4 mb-3">
                    {[1, 2, 3].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleInputChange('maxSessions', num)}
                        className={`w-12 h-12 rounded-full border-2 font-bold transition-colors ${
                          formData.maxSessions === num
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">
                    Selecciona cuántos dispositivos pueden usar esta cuenta simultáneamente
                  </p>
                </div>
              </div>
            </div>

            {/* Asignación de Carpetas */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-6">
                <svg className="h-6 w-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <h2 className="text-xl font-bold text-gray-900">Asignación de Carpetas</h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Carpetas Asignadas *
                </label>
                <button
                  type="button"
                  onClick={() => setShowFolderModal(true)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <span className="text-gray-700">{getDisplayText()}</span>
                  </div>
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Información importante */}
            <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-lg">
              <div className="flex">
                <svg className="h-6 w-6 text-blue-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-lg font-medium text-blue-800 mb-2">Información importante:</h3>
                  <ul className="text-blue-700 space-y-1">
                    <li>• El usuario recibirá un email con credenciales temporales</li>
                    <li>• Se le asignará acceso a todas las carpetas seleccionadas</li>
                    <li>• Puedes seleccionar múltiples carpetas usando los checkboxes</li>
                    <li>• Podrá cambiar su contraseña después del primer login</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creando Usuario...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Crear Usuario
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Folder Selection Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Seleccionar Carpetas</h3>
                <button
                  onClick={() => setShowFolderModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Buscar carpeta..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredFolders.map((folder) => {
                  const isSelected = selectedFolders.some(f => f._id === folder._id);
                  return (
                    <div
                      key={folder._id}
                      onClick={() => handleFolderSelect(folder)}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <svg className="h-5 w-5 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                          <div>
                            <p className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                              {folder.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {folder.files?.length || 0} archivos
                            </p>
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300'
                        }`}>
                          {isSelected && (
                            <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  {selectedFolders.length} carpeta{selectedFolders.length !== 1 ? 's' : ''} seleccionada{selectedFolders.length !== 1 ? 's' : ''}
                </p>
                <button
                  onClick={() => setShowFolderModal(false)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewUser;
