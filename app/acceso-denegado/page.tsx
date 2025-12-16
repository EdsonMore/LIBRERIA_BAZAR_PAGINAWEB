import Link from "next/link"

export default function AccesoDenegadoPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
      <div className="max-w-md w-full text-center space-y-6 bg-white rounded-2xl shadow-2xl p-10">
        <div className="text-6xl">🚫</div>
        <h1 className="text-4xl font-bold text-red-600">Acceso Denegado</h1>
        <p className="text-gray-600">No tiene permisos para acceder a esta página.</p>
        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full py-3 px-4 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white font-medium rounded-full hover:shadow-lg transition-all"
          >
            Volver al Inicio
          </Link>
          <Link
            href="/auth/login"
            className="block w-full py-3 px-4 border-2 border-gray-300 text-gray-700 font-medium rounded-full hover:border-[#667eea] hover:text-[#667eea] transition-all"
          >
            Iniciar Sesión
          </Link>
        </div>
      </div>
    </div>
  )
}
