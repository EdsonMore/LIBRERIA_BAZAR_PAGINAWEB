"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
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

function BoletasCompraContent() {
  const searchParams = useSearchParams()
  const compraId = searchParams.get("compraId")
  const [boletas, setBoletas] = useState<Boleta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    cargarBoletas()
  }, [compraId])

  const cargarBoletas = async () => {
    if (!compraId) {
      setError("Compra no especificada")
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const res = await fetch(`/api/boletas?compraId=${compraId}`)
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
          <Link href="/mis-compras" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Volver a mis compras
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Boletas de la Compra #{compraId}</h1>
          <p className="text-gray-600">Consulta y descarga las boletas generadas</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {boletas.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 mb-4">No hay boletas para esta compra</p>
            <Link href="/mis-compras" className="text-blue-600 hover:underline">
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
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${
                          boleta.tipoBoleta === "CLIENTE" ? "bg-blue-600" : "bg-purple-600"
                        }`}
                      >
                        {boleta.tipoBoleta === "CLIENTE" ? "👤" : "👨‍💼"}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{boleta.numeroBoleta}</h3>
                        <p className="text-sm text-gray-500">
                          {boleta.tipoBoleta === "CLIENTE" ? "Tu copia" : "Copia del administrador"}
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
                        Descargar
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

export default function BoletasCompraPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando...</div>}>
      <BoletasCompraContent />
    </Suspense>
  )
}
