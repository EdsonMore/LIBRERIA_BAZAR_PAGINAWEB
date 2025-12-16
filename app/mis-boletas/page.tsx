"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

interface Boleta {
  id: number
  numeroBoleta: string
  compraId: number
  tipoBoleta: string
  usuario: {
    nombres: string
    apellidoPaterno: string
  }
  resumen: {
    subtotal: number
    igv: number
    costoEnvio: number
    total: number
  }
  fechaGeneracion: string
}

export default function MisBoletasPage() {
  const [boletas, setBoletas] = useState<Boleta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    cargarBoletas()
  }, [])

  const cargarBoletas = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/boletas")
      const data = await res.json()

      if (res.ok) {
        setBoletas(data.boletas || [])
      } else {
        setError(data.error || "Error al cargar boletas")
      }
    } catch (err) {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-PE", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatearMoneda = (monto: number) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
    }).format(monto)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Cargando boletas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Boletas</h1>
          <p className="text-gray-600">Descarga o visualiza tus boletas de compra</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {boletas.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 mb-4">No tienes boletas generadas aún</p>
            <p className="text-sm text-gray-400 mb-6">Las boletas se generan automáticamente cuando tu compra es entregada</p>
            <Link
              href="/mis-compras"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Ver mis compras
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {boletas.map((boleta) => (
              <div key={boleta.id} className="bg-white rounded-lg shadow hover:shadow-lg transition p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{boleta.numeroBoleta}</h3>
                        <p className="text-sm text-gray-500">Compra #{boleta.compraId}</p>
                        <p className="text-xs text-gray-400">
                          {boleta.tipoBoleta === "CLIENTE" ? "👤 Tu copia" : "👨‍💼 Copia del administrador"}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 ml-13">{formatearFecha(boleta.fechaGeneracion)}</p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Total</p>
                      <p className="text-2xl font-bold text-gray-900">{formatearMoneda(boleta.resumen.total)}</p>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/boletas/${boleta.id}`}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                      >
                        Ver
                      </Link>
                      <a
                        href={`/api/boletas/${boleta.id}/descargar`}
                        download
                        className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                      >
                        Descargar PDF
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
