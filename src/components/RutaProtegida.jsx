import { Navigate, Outlet } from 'react-router-dom'
import { useContext } from 'react'
import { AuthContext } from '../context/AuthProvider'

const RutaProtegida = () => {
    const { auth, cargando } = useContext(AuthContext)
    
    if(cargando) return 'Cargando...'
    
    return (
        <>
            {auth._id ? <Outlet /> : <Navigate to="/" />}
        </>
    )
}

export default RutaProtegida