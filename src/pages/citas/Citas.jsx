import { useState, useEffect } from 'react'
import axios from 'axios'
import Alerta from '../../components/Alerta'
import FormularioCita from './FormularioCita'
import TablaCitas from './TablaCitas'

const Citas = () => {
    const [citas, setCitas] = useState([])
    const [alerta, setAlerta] = useState({})
    const [citaEditar, setCitaEditar] = useState(null)
    const [mostrarFormulario, setMostrarFormulario] = useState(false)

    useEffect(() => {
        const obtenerCitas = async () => {
            try {
                const token = localStorage.getItem('token')
                const config = {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
                const { data } = await axios.get(
                    `${import.meta.env.VITE_BACKEND_URL}/citas`,
                    config
                )
                setCitas(data)
            } catch (error) {
                console.error(error)
            }
        }
        obtenerCitas()
    }, [])

    useEffect(() => {
        if(alerta.msg) {
            const timer = setTimeout(() => {
                setAlerta({})
            },  )
            return () => clearTimeout(timer)
        }
    }, [alerta])

    return (
        <>
            <div className="flex justify-between items-center">
                <h1 className="text-4xl font-black">Citas</h1>
                <button
                    type="button"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
                    onClick={() => {
                        setCitaEditar(null)
                        setMostrarFormulario(!mostrarFormulario)
                    }}
                >
                    {mostrarFormulario ? 'Ver Citas' : 'Agregar Cita'}
                </button>
            </div>

            {alerta.msg && <Alerta alerta={alerta} />}

            {mostrarFormulario ? (
                <FormularioCita 
                    citaEditar={citaEditar}
                    setAlerta={setAlerta}
                    setCitas={setCitas}
                    setMostrarFormulario={setMostrarFormulario}
                />
            ) : (
                <TablaCitas 
                    citas={citas}
                    setCitaEditar={setCitaEditar}
                    setMostrarFormulario={setMostrarFormulario}
                    setAlerta={setAlerta}
                    setCitas={setCitas}
                />
            )}
        </>
    )
}

export default Citas