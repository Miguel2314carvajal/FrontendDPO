import { useState, useEffect } from 'react'
import axios from 'axios'

const FormularioPaciente = ({ pacienteEditar, setAlerta, setPacientes, setMostrarFormulario }) => {
    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        fecha_nacimiento: '',
        genero: '',
        ciudad: '',
        direccion: '',
        telefono: '',
        email: ''
    })

    useEffect(() => {
        if (pacienteEditar) {
            const pacienteFormateado = {
                ...pacienteEditar,
                fecha_nacimiento: new Date(pacienteEditar.fecha_nacimiento).toISOString().split('T')[0]
            }
            setFormData(pacienteFormateado)
        }
    }, [pacienteEditar])

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

            if (pacienteEditar) {
                await axios.put(
                    `${import.meta.env.VITE_BACKEND_URL}/paciente/${pacienteEditar._id}`,
                    formData,
                    config
                )
                setAlerta({ msg: 'Paciente actualizado correctamente', error: false })
            } else {
                await axios.post(
                    `${import.meta.env.VITE_BACKEND_URL}/paciente`,
                    formData,
                    config
                )
                setAlerta({ msg: 'Paciente agregado correctamente', error: false })
            }

            const { data } = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/pacientes`,
                config
            )
            setPacientes(data)
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
                        Nombre
                    </label>
                    <input
                        type="text"
                        value={formData.nombre}
                        onChange={e => setFormData({...formData, nombre: e.target.value})}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="Ingrese el nombre"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        Apellido
                    </label>
                    <input
                        type="text"
                        value={formData.apellido}
                        onChange={e => setFormData({...formData, apellido: e.target.value})}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="Ingrese el apellido"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        Género
                    </label>
                    <select
                        value={formData.genero}
                        onChange={e => setFormData({...formData, genero: e.target.value})}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    >
                        <option value="">Seleccione el género</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Femenino">Femenino</option>
                        <option value="Otro">Otro</option>
                    </select>
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        Email
                    </label>
                    <input
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="Ingrese el email"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        Teléfono
                    </label>
                    <input
                        type="text"
                        value={formData.telefono}
                        onChange={e => setFormData({...formData, telefono: e.target.value})}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="Ingrese el teléfono"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        Ciudad
                    </label>
                    <input
                        type="text"
                        value={formData.ciudad}
                        onChange={e => setFormData({...formData, ciudad: e.target.value})}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="Ingrese la ciudad"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        Fecha de Nacimiento
                    </label>
                    <input
                        type="date"
                        value={formData.fecha_nacimiento}
                        onChange={e => setFormData({...formData, fecha_nacimiento: e.target.value})}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                </div>

                <div className="mb-4 col-span-2">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        Dirección
                    </label>
                    <textarea
                        value={formData.direccion}
                        onChange={e => setFormData({...formData, direccion: e.target.value})}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="Ingrese la dirección"
                        rows="3"
                    />
                </div>
            </div>

            <div className="flex items-center justify-end">
                <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                    {pacienteEditar ? 'Actualizar' : 'Guardar'}
                </button>
            </div>
        </form>
    )
}

export default FormularioPaciente