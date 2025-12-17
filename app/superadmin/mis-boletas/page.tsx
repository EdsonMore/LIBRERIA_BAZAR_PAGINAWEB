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

export default function MisBoletasSuperAdminPage() {
  const [boletas, setBoletas] = useState<Boleta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    cargarBoletas()
  }, [])

  const cargarBoletas = async () => {
    try {
      setLoading(true)
      // Parámetro para obtener las boletas del usuario actual
      const res = await fetch("/api/boletas")
      const data = await res.json()

      if (res.ok) {
        // Filtrar solo boletas del superadmin (tipo SUPERADMIN)
        // Si tipo_boleta es NULL, asumimos que son boletas del cliente
        const boletasSuperAdmin = (data.boletas || []).filter(
          (b: Boleta) => b.tipoBoleta === "SUPERADMIN" || b.tipoBoleta === "Admin"
        )
        setBoletas(boletasSuperAdmin)
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
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 text-sm md:text-base">Cargando boletas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 md:py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Mis Boletas (SuperAdmin)</h1>
          <p className="text-sm md:text-base text-gray-600">Copia del administrador de todas las entregas procesadas</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 text-sm md:text-base">{error}</p>
          </div>
        )}

        {boletas.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 md:p-12 text-center">
            <p className="text-gray-500 mb-4 text-sm md:text-base">No tienes boletas de administrador generadas aún</p>
            <p className="text-xs md:text-sm text-gray-400 mb-6">Se generan automáticamente cuando marcas una compra como entregada</p>
            <Link
              href="/superadmin/compras"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm md:text-base"
            >
              Ir a Gestión de Compras
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4">
              <p className="text-blue-800 text-xs md:text-sm">
                📋 Total de boletas de administrador: <strong>{boletas.length}</strong>
              </p>
            </div>

            {boletas.map((boleta) => (
              <div key={boleta.id} className="bg-white rounded-lg shadow hover:shadow-lg transition p-4 md:p-6">
                <div className="flex flex-col gap-4 md:gap-0 md:flex-row md:items-center md:justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start md:items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-6 h-6 text-purple-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm md:text-base truncate">{boleta.numeroBoleta}</h3>
                        <p className="text-xs md:text-sm text-gray-500">Compra #{boleta.compraId}</p>
                        <p className="text-xs text-gray-400">👨‍💼 Copia del administrador</p>
                        <p className="text-xs text-purple-600 font-medium truncate">
                          Cliente: {boleta.usuario.nombres} {boleta.usuario.apellidoPaterno}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs md:text-sm text-gray-600 ml-13">{formatearFecha(boleta.fechaGeneracion)}</p>
                  </div>

                  <div className="flex flex-col items-stretch md:items-end gap-3">
                    <div className="text-right">
                      <p className="text-xs md:text-sm text-gray-600">Total</p>
                      <p className="text-xl md:text-2xl font-bold text-gray-900">{formatearMoneda(boleta.resumen.total)}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Link
                        href={`/boletas/${boleta.id}`}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-xs md:text-sm font-medium text-center"
                      >
                        Ver
                      </Link>
                      <a
                        href={`/api/boletas/${boleta.id}/descargar`}
                        download
                        className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-xs md:text-sm font-medium text-center"
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
