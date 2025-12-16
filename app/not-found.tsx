import Link from "next/link"
import Navbar from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-grow flex items-center justify-center px-4 py-16">
        <div className="text-center">
          <h1 className="text-9xl font-bold text-amber-600 mb-4">404</h1>
          <h2 className="text-3xl font-semibold text-gray-900 mb-4">Página No Encontrada</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Lo sentimos, la página que estás buscando no existe o ha sido movida.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/"
              className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors"
            >
              Ir al Inicio
            </Link>
            <Link
              href="/productos"
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold rounded-lg transition-colors"
            >
              Ver Productos
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
