const Alerta = ({alerta}) => {
    return (
        <div className={`${alerta.error ? 'bg-red-100 border-red-400 text-red-700' : 'bg-green-100 border-green-400 text-green-700'} border px-4 py-3 rounded relative mb-4`}>
            {alerta.msg}
        </div>
    )
}

export default Alerta 