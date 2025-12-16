"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"

interface DetalleCompra {
  productoId: number
  nombre: string
  cantidad: number
  precioUnitario: number
  subtotal: number
  imagen: string
}

interface Boleta {
  id: number
  numeroBoleta: string
  compraId: number
  tipoBoleta: string
  fechaGeneracion: string
  fechaCompra: string
  cliente: {
    nombres: string
    apellidoPaterno: string
    correo: string
    telefono: string
  }
  entrega: {
    direccion: string
    numeroSeguimiento: string
  }
  metodoPago: string
  detalles: DetalleCompra[]
  resumen: {
    subtotal: number
    igv: number
    igvActivo: boolean
    costoEnvio: number
    envioActivo: boolean
    total: number
  }
}

export default function VisualizarBoletaPage() {
  const params = useParams()
  const boletaId = params.id as string
  const [boleta, setBoleta] = useState<Boleta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    cargarBoleta()
  }, [boletaId])

  const cargarBoleta = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/boletas/${boletaId}`)
      const data = await res.json()

      if (res.ok) {
        setBoleta(data)
      } else {
        setError(data.error || "Error al cargar la boleta")
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

  const handleImprimir = () => {
    window.print()
  }

  const handleDescargar = async () => {
    try {
      const response = await fetch(`/api/boletas/${boletaId}/descargar`)
      if (!response.ok) {
        alert("Error al descargar la boleta")
        return
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `boleta-${boleta?.numeroBoleta}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error al descargar:", error)
      alert("Error al descargar la boleta")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Cargando boleta...</p>
        </div>
      </div>
    )
  }

  if (error || !boleta) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "No se pudo cargar la boleta"}</p>
          <Link href="/mis-boletas" className="text-blue-600 hover:underline">
            Volver a mis boletas
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Controles de impresión */}
        <div className="mb-6 flex gap-2 print:hidden">
          <button
            onClick={handleImprimir}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Imprimir
          </button>
          <button
            onClick={handleDescargar}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
          >
            Descargar PDF
          </button>
          <Link
            href="/mis-boletas"
            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium text-center"
          >
            Volver
          </Link>
        </div>

        {/* Contenido de la boleta */}
        <div className="bg-white rounded-lg shadow-lg p-8 print:shadow-none">
          {/* Encabezado */}
          <div className="border-b-2 border-gray-300 pb-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">BOLETA</h1>
                <p className="text-lg text-gray-600 mt-1">{boleta.numeroBoleta}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {boleta.tipoBoleta === "CLIENTE" ? "👤 Tu copia de la boleta" : "👨‍💼 Copia del administrador"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Compra #{boleta.compraId}</p>
                <p className="text-sm font-semibold text-gray-900">{formatearFecha(boleta.fechaGeneracion)}</p>
              </div>
            </div>
          </div>

          {/* Información del cliente */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Cliente</h2>
              <p className="text-gray-900 font-medium">{boleta.cliente.nombres} {boleta.cliente.apellidoPaterno}</p>
              <p className="text-gray-600 text-sm">{boleta.cliente.correo}</p>
              <p className="text-gray-600 text-sm">{boleta.cliente.telefono}</p>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Entrega</h2>
              <p className="text-gray-900 text-sm mb-2">{boleta.entrega.direccion}</p>
              <p className="text-gray-600 text-sm">
                <span className="font-semibold">Seguimiento:</span> {boleta.entrega.numeroSeguimiento}
              </p>
              <p className="text-gray-600 text-sm">
                <span className="font-semibold">Pago:</span> {boleta.metodoPago}
              </p>
            </div>
          </div>

          {/* Detalles de compra */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Detalle de compra</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left py-3 text-sm font-semibold text-gray-900">Producto</th>
                    <th className="text-center py-3 text-sm font-semibold text-gray-900">Cantidad</th>
                    <th className="text-right py-3 text-sm font-semibold text-gray-900">P.U.</th>
                    <th className="text-right py-3 text-sm font-semibold text-gray-900">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {boleta.detalles.map((detalle) => (
                    <tr key={detalle.productoId} className="border-b border-gray-200">
                      <td className="py-3 text-sm text-gray-900">{detalle.nombre}</td>
                      <td className="py-3 text-sm text-center text-gray-600">{detalle.cantidad}</td>
                      <td className="py-3 text-sm text-right text-gray-600">{formatearMoneda(detalle.precioUnitario)}</td>
                      <td className="py-3 text-sm text-right font-medium text-gray-900">{formatearMoneda(detalle.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Resumen de totales */}
          <div className="border-t-2 border-gray-300 pt-6 mb-6">
            <div className="flex justify-end mb-4 max-w-xs ml-auto">
              <div className="w-full">
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="text-gray-900 font-medium">{formatearMoneda(boleta.resumen.subtotal)}</span>
                </div>

                {boleta.resumen.igvActivo && (
                  <div className="flex justify-between py-2 text-sm">
                    <span className="text-gray-600">IGV (18%):</span>
                    <span className="text-gray-900">{formatearMoneda(boleta.resumen.igv)}</span>
                  </div>
                )}

                {boleta.resumen.envioActivo && (
                  <div className="flex justify-between py-2 text-sm">
                    <span className="text-gray-600">Costo de envío:</span>
                    <span className="text-gray-900">{formatearMoneda(boleta.resumen.costoEnvio)}</span>
                  </div>
                )}

                <div className="border-t border-gray-300 mt-2 pt-2 flex justify-between">
                  <span className="text-lg font-bold text-gray-900">Total:</span>
                  <span className="text-lg font-bold text-blue-600">{formatearMoneda(boleta.resumen.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pie de página */}
          <div className="border-t border-gray-300 pt-6 text-center text-xs text-gray-600">
            <p>Gracias por tu compra. Esta boleta es un comprobante de la transacción.</p>
            <p className="mt-2">Para más información, contacta con nuestro equipo de soporte.</p>
          </div>
        </div>
      </div>

      {/* Estilos para impresión */}
      <style>{`
        @media print {
          body {
            background-color: white;
          }
          .print\\:hidden {
            display: none;
          }
          .print\\:shadow-none {
            box-shadow: none;
          }
        }
      `}</style>
    </div>
  )
}
