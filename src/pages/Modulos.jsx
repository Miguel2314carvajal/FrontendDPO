import { Link } from 'react-router-dom'
import { 
    UserIcon, 
    BookOpenIcon,
    ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline'

const Modulos = () => {
    const modulos = [
        {
            nombre: "PACIENTES",
            icono: <UserIcon className="w-16 h-16 text-white" />,
            ruta: "/dashboard/pacientes"
        },
        {
            nombre: "ESPECIALIDADES",
            icono: <BookOpenIcon className="w-16 h-16 text-white" />,
            ruta: "/dashboard/especialidades"
        },
        {
            nombre: "CITAS",
            icono: <ClipboardDocumentListIcon className="w-16 h-16 text-white" />,
            ruta: "/dashboard/citas"
        }
    ]

    return (
        <div className="container mx-auto p-8">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800">Módulos</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modulos.map((modulo, index) => (
                    <Link 
                        key={index}
                        to={modulo.ruta}
                        className="bg-blue-900 hover:bg-blue-800 transition-colors p-8 rounded-lg shadow-lg flex flex-col items-center justify-center gap-4"
                    >
                        {modulo.icono}
                        <span className="text-white text-center font-semibold">
                            {modulo.nombre}
                        </span>
                    </Link>
                ))}
            </div>
        </div>
    )
}

export default Modulos 