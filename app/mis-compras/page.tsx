"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Navbar from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"
import { Package, Eye, Star, FileText } from "lucide-react"

export default function MisComprasPage() {
  const router = useRouter()
  const [compras, setCompras] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [config, setConfig] = useState<any>({ aplicarIGV: true, aplicarEnvio: true })

  useEffect(() => {
    cargarCompras()
    cargarConfiguracion()
  }, [])

  const cargarConfiguracion = async () => {
    try {
      const res = await fetch("/api/configuracion-sistema")
      if (res.ok) {
        const data = await res.json()
        setConfig(data)
      }
    } catch (error) {
      console.error("Error al cargar configuración:", error)
    }
  }

  const cargarCompras = async () => {
    try {
      const res = await fetch("/api/mis-compras")
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/auth/login")
        }
        return
      }
      const data = await res.json()
      setCompras(data.compras || [])
      setLoading(false)
    } catch (error) {
      console.error(error)
      setLoading(false)
    }
  }

  const getEstadoBadgeClass = (estado: string) => {
    switch (estado) {
      case "PENDIENTE":
        return "badge bg-warning"
      case "CONFIRMADA":
        return "badge bg-info"
      case "PREPARANDO":
        return "badge bg-primary"
      case "ENVIADA":
        return "badge bg-info"
      case "DESPACHADO":
        return "badge bg-secondary"
      case "ENTREGADA":
        return "badge bg-success"
      case "CANCELADA":
        return "badge bg-danger"
      default:
        return "badge bg-secondary"
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#667eea] border-t-transparent"></div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Mis Compras</h1>

        {compras.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-24 h-24 mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-gray-600 mb-4">No tienes compras aún</h2>
            <button onClick={() => router.push("/productos")} className="btn-primary px-8 py-3">
              Ir a Productos
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {compras.map((compra) => (
              <div key={compra.id} className="compra-card bg-white p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold">Pedido #{compra.id}</h3>
                    <p className="text-gray-600 text-sm">
                      Fecha:{" "}
                      {new Date(compra.fechaCompra).toLocaleDateString("es-PE", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="mt-4 md:mt-0">
                    <span className={getEstadoBadgeClass(compra.estado)}>{compra.estado}</span>
                  </div>
                </div>

                {/* Detalles de productos */}
                <div className="space-y-3 mb-4">
                  {compra.detalles.map((detalle: any, index: number) => (
                    <div key={index} className="flex items-center gap-4 pb-3 border-b last:border-b-0">
                      <img
                        src={detalle.producto?.imagen || "/placeholder.svg?height=60&width=60"}
                        alt={detalle.producto?.nombre}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <p className="font-semibold">{detalle.producto?.nombre}</p>
                        <p className="text-sm text-gray-600">
                          Cantidad: {detalle.cantidad} x S/ {(Number(detalle.precioUnitario) || 0).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#667eea]">S/ {(Number(detalle.subtotal) || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totales */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span>S/ {(Number(compra.subtotal) || 0).toFixed(2)}</span>
                    </div>
                    {compra.igvActivo && config.aplicarIGV && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">IGV:</span>
                        <span>S/ {(Number(compra.igv) || 0).toFixed(2)}</span>
                      </div>
                    )}
                    {compra.envioActivo && config.aplicarEnvio && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Envío:</span>
                        <span>S/ {(Number(compra.costoEnvio) || 0).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span className="text-[#667eea]">S/ {(Number(compra.total) || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Información de entrega */}
                <div className="text-sm text-gray-600 mb-4">
                  <p>
                    <strong>Dirección de entrega:</strong> {compra.direccionEntrega}
                  </p>
                  <p>
                    <strong>Método de pago:</strong> {compra.metodoPago}
                  </p>
                  {compra.numeroSeguimiento && (
                    <p>
                      <strong>Número de seguimiento:</strong> {compra.numeroSeguimiento}
                    </p>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex gap-3 flex-wrap">
                  <Link
                    href={`/mis-compras/${compra.id}`}
                    className="flex-1 min-w-[150px] px-4 py-2 border-2 border-[#667eea] text-[#667eea] rounded-full hover:bg-[#667eea] hover:text-white transition-all text-center flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Ver Detalles
                  </Link>
                  {compra.estado === "ENTREGADA" && (
                    <>
                      <Link
                        href={`/boletas?compraId=${compra.id}`}
                        className="flex-1 min-w-[150px] px-4 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition-all text-center flex items-center justify-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        Ver Boleta
                      </Link>
                      <Link
                        href={`/mis-compras-resena?compraId=${compra.id}`}
                        className="flex-1 min-w-[150px] px-4 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-full hover:shadow-lg transition-all text-center flex items-center justify-center gap-2"
                      >
                        <Star className="w-4 h-4" />
                        Dejar Reseña
                      </Link>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </>
  )
}
