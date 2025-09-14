import { useState, useEffect } from 'react'
import axios from 'axios'

const FormularioCita = ({ citaEditar, setAlerta, setCitas, setMostrarFormulario }) => {
    const [pacientes, setPacientes] = useState([])
    const [especialidades, setEspecialidades] = useState([])
    const [formData, setFormData] = useState({
        codigo: '',
        descripcion: '',
        id_paciente: '',
        id_especialidad: ''
    })

    useEffect(() => {
        const obtenerDatos = async () => {
            try {
                const token = localStorage.getItem('token')
                const config = {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
                const [pacientesRes, especialidadesRes] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_BACKEND_URL}/pacientes`, config),
                    axios.get(`${import.meta.env.VITE_BACKEND_URL}/especialidades`, config)
                ])
                setPacientes(pacientesRes.data)
                setEspecialidades(especialidadesRes.data)
            } catch (error) {
                console.error(error)
                setAlerta({
                    msg: 'Error al cargar los datos',
                    error: true
                })
            }
        }
        obtenerDatos()
    }, [])

    useEffect(() => {
        if (citaEditar) {
            setFormData({
                codigo: citaEditar.codigo,
                descripcion: citaEditar.descripcion,
                id_paciente: citaEditar.id_paciente?._id,
                id_especialidad: citaEditar.id_especialidad?._id
            })
        }
    }, [citaEditar])

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (Object.values(formData).includes('')) {
            setAlerta({
                msg: 'Todos los campos son obligatorios',
                error: true
            })
            return
        }

        try {
            const token = localStorage.getItem('token')
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                }
            }

            if (citaEditar) {
                await axios.put(
                    `${import.meta.env.VITE_BACKEND_URL}/cita/${citaEditar._id}`,
                    formData,
                    config
                )
                setAlerta({ msg: 'Cita actualizada correctamente', error: false })
            } else {
                await axios.post(
                    `${import.meta.env.VITE_BACKEND_URL}/cita`,
                    formData,
                    config
                )
                setAlerta({ msg: 'Cita agregada correctamente', error: false })
            }

            const { data } = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/citas`,
                config
            )
            setCitas(data)
            setMostrarFormulario(false)
        } catch (error) {
            setAlerta({
                msg: error.response?.data?.msg || 'Hubo un error',
                error: true
            })
        }
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        Código
                    </label>
                    <input
                        type="text"
                        value={formData.codigo}
                        onChange={e => setFormData({...formData, codigo: e.target.value})}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="Ingrese el código"
                        required
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        Paciente
                    </label>
                    <select
                        value={formData.id_paciente}
                        onChange={e => setFormData({...formData, id_paciente: e.target.value})}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                    >
                        <option value="">-- Seleccione un paciente --</option>
                        {pacientes.map(paciente => (
                            <option key={paciente._id} value={paciente._id}>
                                {paciente.nombre} {paciente.apellido}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        Especialidad
                    </label>
                    <select
                        value={formData.id_especialidad}
                        onChange={e => setFormData({...formData, id_especialidad: e.target.value})}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                    >
                        <option value="">-- Seleccione una especialidad --</option>
                        {especialidades.map(especialidad => (
                            <option key={especialidad._id} value={especialidad._id}>
                                {especialidad.nombre} - {especialidad.codigo}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mb-4 col-span-2">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        Descripción
                    </label>
                    <textarea
                        value={formData.descripcion}
                        onChange={e => setFormData({...formData, descripcion: e.target.value})}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="Ingrese una descripción"
                        rows="3"
                        required
                    />
                </div>
            </div>

            <div className="flex items-center justify-end">
                <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                    {citaEditar ? 'Actualizar' : 'Guardar'}
                </button>
            </div>
        </form>
    )
}

export default FormularioCita