import axios from 'axios'
import { PencilIcon, TrashIcon } from '@heroicons/react/24/solid'
import { useState } from 'react'

const TablaCitas = ({ citas, setCitaEditar, setMostrarFormulario, setAlerta, setCitas }) => {
    const [citaSeleccionada, setCitaSeleccionada] = useState(null);
    const [mostrarModal, setMostrarModal] = useState(false);

    const handleEliminar = async (id) => {
        if (confirm('¿Deseas eliminar esta cita?')) {
            try {
                const token = localStorage.getItem('token')
                await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/cita/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                })
                
                const nuevasCitas = citas.filter(cita => cita._id !== id)
                setCitas(nuevasCitas)
                setAlerta({ msg: 'Cita eliminada correctamente', error: false })
            } catch (error) {
                setAlerta({
                    msg: error.response?.data?.msg || 'Error al eliminar la cita',
                    error: true
                })
            }
        }
    }

    const handleVerCita = (cita) => {
        setCitaSeleccionada(cita);
        setMostrarModal(true);
    };

    return (
        <>
            <div className="mt-8">
                <table className="min-w-full bg-white">
                    <thead className="bg-gray-800 text-white">
                        <tr>
                            <th className="py-3 px-4 text-left">Código</th>
                            <th className="py-3 px-4 text-left">Paciente</th>
                            <th className="py-3 px-4 text-left">Especialidad</th>
                            <th className="py-3 px-4 text-left">Descripción</th>
                            <th className="py-3 px-4 text-left">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-700">
                        {citas.map(cita => (
                            <tr key={cita._id} className="border-b hover:bg-gray-50">
                                <td className="py-3 px-4">{cita.codigo}</td>
                                <td className="py-3 px-4">
                                    {cita.id_paciente?.nombre} {cita.id_paciente?.apellido}
                                </td>
                                <td className="py-3 px-4">{cita.id_especialidad?.nombre}</td>
                                <td className="py-3 px-4">{cita.descripcion}</td>
                                <td className="py-3 px-4 flex gap-3">
                                    <button
                                        onClick={() => handleVerCita(cita)}
                                        className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setCitaEditar(cita)
                                            setMostrarFormulario(true)
                                        }}
                                        className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded"
                                    >
                                        <PencilIcon className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => handleEliminar(cita._id)}
                                        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded"
                                    >
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal para ver detalles */}
            {mostrarModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">Detalles de la Cita</h3>
                            <button
                                onClick={() => setMostrarModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-semibold text-gray-500">Código</p>
                                <p>{citaSeleccionada?.codigo}</p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-500">Paciente</p>
                                <p>
                                    {citaSeleccionada?.id_paciente?.nombre} {citaSeleccionada?.id_paciente?.apellido}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-500">Especialidad</p>
                                <p>
                                    {citaSeleccionada?.id_especialidad?.nombre}
                                    <br />
                                    <span className="text-sm text-gray-500">
                                        Código: {citaSeleccionada?.id_especialidad?.codigo}
                                    </span>
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-500">Descripción</p>
                                <p>{citaSeleccionada?.descripcion}</p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-500">Fecha de Creación</p>
                                <p>{new Date(citaSeleccionada?.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default TablaCitas