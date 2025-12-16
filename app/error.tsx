"use client"

import { useEffect } from "react"
import Link from "next/link"
import Navbar from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-grow flex items-center justify-center px-4 py-16">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-red-600 mb-4">500</h1>
          <h2 className="text-3xl font-semibold text-gray-900 mb-4">Error del Servidor</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">Algo salió mal. Por favor intenta nuevamente.</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={reset}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors"
            >
              Intentar Nuevamente
            </button>
            <Link
              href="/"
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold rounded-lg transition-colors"
            >
              Ir al Inicio
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
