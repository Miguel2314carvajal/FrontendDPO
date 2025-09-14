import { useState, useEffect } from 'react'
import axios from 'axios'
import Alerta from '../../components/Alerta'
import FormularioEspecialidad from './FormularioEspecialidad'
import TablaEspecialidades from './TablaEspecialidades'

const Especialidades = () => {
    const [especialidades, setEspecialidades] = useState([])
    const [alerta, setAlerta] = useState({})
    const [especialidadEditar, setEspecialidadEditar] = useState(null)
    const [mostrarFormulario, setMostrarFormulario] = useState(false)

    useEffect(() => {
        const obtenerEspecialidades = async () => {
            try {
                const token = localStorage.getItem('token')
                const config = {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
                const { data } = await axios.get(
                    `${import.meta.env.VITE_BACKEND_URL}/especialidades`,
                    config
                )
                setEspecialidades(data)
            } catch (error) {
                console.error(error)
            }
        }
        obtenerEspecialidades()
    }, [])

    useEffect(() => {
        if(alerta.msg) {
            const timer = setTimeout(() => {
                setAlerta({})
            }, 3000)
            return () => clearTimeout(timer)
        }
    }, [alerta])

    return (
        <>
            <div className="flex justify-between items-center">
                <h1 className="text-4xl font-black">Especialidades</h1>
                <button
                    type="button"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
                    onClick={() => {
                        setEspecialidadEditar(null)
                        setMostrarFormulario(!mostrarFormulario)
                    }}
                >
                    {mostrarFormulario ? 'Ver Especialidades' : 'Agregar Especialidad'}
                </button>
            </div>

            {alerta.msg && <Alerta alerta={alerta} />}

            {mostrarFormulario ? (
                <FormularioEspecialidad 
                    especialidadEditar={especialidadEditar}
                    setAlerta={setAlerta}
                    setEspecialidades={setEspecialidades}
                    setMostrarFormulario={setMostrarFormulario}
                />
            ) : (
                <TablaEspecialidades 
                    especialidades={especialidades}
                    setEspecialidadEditar={setEspecialidadEditar}
                    setMostrarFormulario={setMostrarFormulario}
                    setAlerta={setAlerta}
                    setEspecialidades={setEspecialidades}
                />
            )}
        </>
    )
}

export default Especialidades