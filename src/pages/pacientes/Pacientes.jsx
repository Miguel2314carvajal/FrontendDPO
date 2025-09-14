import { useState, useEffect } from 'react'
import axios from 'axios'
import Alerta from '../../components/Alerta'
import FormularioPaciente from './FormularioPaciente'
import TablaPacientes from './TablaPacientes'

const Pacientes = () => {
    const [pacientes, setPacientes] = useState([])
    const [alerta, setAlerta] = useState({})
    const [pacienteEditar, setPacienteEditar] = useState(null)
    const [mostrarFormulario, setMostrarFormulario] = useState(false)

    useEffect(() => {
        const obtenerPacientes = async () => {
            try {
                const token = localStorage.getItem('token')
                const config = {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
                const { data } = await axios.get(
                    `${import.meta.env.VITE_BACKEND_URL}/pacientes`,
                    config
                )
                setPacientes(data)
            } catch (error) {
                console.error(error)
            }
        }
        obtenerPacientes()
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
                <h1 className="text-4xl font-black">Pacientes</h1>
                <button
                    type="button"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
                    onClick={() => {
                        setPacienteEditar(null)
                        setMostrarFormulario(!mostrarFormulario)
                    }}
                >
                    {mostrarFormulario ? 'Ver Pacientes' : 'Agregar Paciente'}
                </button>
            </div>

            {alerta.msg && <Alerta alerta={alerta} />}

            {mostrarFormulario ? (
                <FormularioPaciente 
                    pacienteEditar={pacienteEditar}
                    setAlerta={setAlerta}
                    setPacientes={setPacientes}
                    setMostrarFormulario={setMostrarFormulario}
                />
            ) : (
                <TablaPacientes 
                    pacientes={pacientes}
                    setPacienteEditar={setPacienteEditar}
                    setMostrarFormulario={setMostrarFormulario}
                    setAlerta={setAlerta}
                    setPacientes={setPacientes}
                />
            )}
        </>
    )
}

export default Pacientes