import { useState, useEffect } from 'react'
import axios from 'axios'

const FormularioEspecialidad = ({ especialidadEditar, setAlerta, setEspecialidades, setMostrarFormulario }) => {
    const [formData, setFormData] = useState({
        nombre: '',
        codigo: '',
        descripcion: ''
    })

    useEffect(() => {
        if (especialidadEditar) {
            setFormData(especialidadEditar)
        }
    }, [especialidadEditar])

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

            if (especialidadEditar) {
                await axios.put(
                    `${import.meta.env.VITE_BACKEND_URL}/especialidad/${especialidadEditar._id}`,
                    formData,
                    config
                )
                setAlerta({ msg: 'Especialidad actualizada correctamente', error: false })
            } else {
                await axios.post(
                    `${import.meta.env.VITE_BACKEND_URL}/especialidad`,
                    formData,
                    config
                )
                setAlerta({ msg: 'Especialidad agregada correctamente', error: false })
            }

            const { data } = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/especialidades`,
                config
            )
            setEspecialidades(data)
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
                        Nombre
                    </label>
                    <input
                        type="text"
                        value={formData.nombre}
                        onChange={e => setFormData({...formData, nombre: e.target.value})}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="Ingrese el nombre"
                        required
                    />
                </div>

                <div className="mb-4 col-span-2">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        Descripción
                    </label>
                    <textarea
                        value={formData.descripcion}
                        onChange={e => setFormData({...formData, descripcion: e.target.value})}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="Ingrese la descripción"
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
                    {especialidadEditar ? 'Actualizar' : 'Guardar'}
                </button>
            </div>
        </form>
    )
}

export default FormularioEspecialidad