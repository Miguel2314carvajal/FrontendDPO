import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import AuthProvider, { useAuth } from './context/AuthProvider'
import Login from './pages/Login'
import Dashboard from './layout/Dashboard'
import UserManagement from './pages/UserManagement'
import NewUser from './pages/NewUser'
import FolderManagement from './pages/FolderManagement'
import FileUpload from './pages/FileUpload'
import FileManagement from './pages/FileManagement'
import FolderFiles from './pages/FolderFiles'
import UserFolderView from './pages/UserFolderView'
import ChangePassword from './pages/ChangePassword'
import GroupManagement from './pages/GroupManagement'
import { useContext } from 'react'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard/carpeta/:folderId" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard/users" element={
            <ProtectedRoute>
              <UserManagement />
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard/new-user" element={
            <ProtectedRoute>
              <NewUser />
            </ProtectedRoute>
          } />

          <Route path="/dashboard/group" element={
            <ProtectedRoute>
              <GroupManagement />
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard/folders" element={
            <ProtectedRoute>
              <FolderManagement />
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard/upload" element={
            <ProtectedRoute>
              <FileUpload />
            </ProtectedRoute>
          } />
          
              <Route path="/dashboard/files/:folderId" element={
                <ProtectedRoute>
                  <FolderFiles />
                </ProtectedRoute>
              } />
              
              <Route path="/dashboard/user-folder/:folderId" element={
                <ProtectedRoute>
                  <UserFolderView />
                </ProtectedRoute>
              } />
              
              <Route path="/dashboard/change-password" element={
                <ProtectedRoute>
                  <ChangePassword />
                </ProtectedRoute>
              } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

const PublicRoute = ({ children }) => {
  const { auth, cargando } = useAuth()
  
  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  return (!auth || !auth._id) ? children : <Navigate to="/dashboard" />
}

const ProtectedRoute = ({ children }) => {
  const { auth, cargando } = useAuth()
  
  console.log('🔒 ProtectedRoute - cargando:', cargando, 'auth:', auth)
  console.log('🔒 ProtectedRoute - auth._id:', auth?._id)
  
  if (cargando) {
    console.log('⏳ ProtectedRoute - Mostrando spinner de carga...')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  // Verificar que auth existe y tiene _id
  const isAuthenticated = auth && auth._id
  console.log('🔒 ProtectedRoute - isAuthenticated:', isAuthenticated)
  
  if (isAuthenticated) {
    console.log('✅ ProtectedRoute - Usuario autenticado, mostrando children')
    return children
  } else {
    console.log('❌ ProtectedRoute - Usuario no autenticado, redirigiendo a login')
    return <Navigate to="/" />
  }
}

export default App
