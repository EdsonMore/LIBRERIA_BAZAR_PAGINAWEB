"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import Navbar from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"
import { ArrowLeft, Package, Clock, MapPin, CreditCard } from "lucide-react"

export default function DetalleComprPage() {
  const router = useRouter()
  const params = useParams()
  const compraId = params.id
  const [compra, setCompra] = useState<any>(null)
  const [comprobante, setComprobante] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [config, setConfig] = useState<any>({ aplicarIGV: true, aplicarEnvio: true })

  useEffect(() => {
    cargarDetalles()
    cargarConfiguracion()
  }, [compraId])

  const cargarConfiguracion = async () => {
    try {
      const res = await fetch("/api/configuracion-sistema")
      if (res.ok) {
        const data = await res.json()
        setConfig({
          aplicarIGV: data.aplicarIGV ?? true,
          aplicarEnvio: data.aplicarEnvio ?? true,
          porcentajeIGV: data.porcentajeIGV ?? 18,
        })
      }
    } catch (error) {
      console.error("Error al cargar configuración:", error)
    }
  }

  const cargarDetalles = async () => {
    try {
      const res = await fetch(`/api/mis-compras/${compraId}`)
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/auth/login")
        }
        return
      }
      const data = await res.json()
      setCompra(data.compra)

      // Cargar comprobante si existe
      if (data.compra.id) {
        const resComprobante = await fetch(`/api/compras/comprobante?compraId=${data.compra.id}`)
        if (resComprobante.ok) {
          const dataComprobante = await resComprobante.json()
          setComprobante(dataComprobante)
        }
      }

      setLoading(false)
    } catch (error) {
      console.error(error)
      setLoading(false)
    }
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "PENDIENTE":
        return "bg-yellow-100 text-yellow-800"
      case "CONFIRMADA":
        return "bg-blue-100 text-blue-800"
      case "PREPARANDO":
        return "bg-purple-100 text-purple-800"
      case "ENVIADA":
        return "bg-cyan-100 text-cyan-800"
      case "DESPACHADO":
        return "bg-indigo-100 text-indigo-800"
      case "ENTREGADA":
        return "bg-green-100 text-green-800"
      case "CANCELADA":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
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

  if (!compra) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold text-gray-600 mb-4">Compra no encontrada</h2>
          <Link href="/mis-compras" className="btn-primary">
            Volver a Mis Compras
          </Link>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-12">
        {/* Botón Volver */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[#667eea] hover:text-[#764ba2] mb-8 font-semibold"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver
        </button>

        {/* Encabezado */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Pedido #{compra.id}</h1>
              <p className="text-gray-600">
                Fecha:{" "}
                {new Date(compra.fechaCompra).toLocaleDateString("es-PE", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <span className={`px-6 py-2 rounded-full font-semibold ${getEstadoColor(compra.estado)}`}>
              {compra.estado}
            </span>
          </div>

          {/* Información de entrega */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
            <div className="space-y-4">
              <div className="flex gap-3">
                <MapPin className="w-5 h-5 text-[#667eea] flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-gray-700">Dirección de entrega</p>
                  <p className="text-gray-600">{compra.direccionEntrega}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <CreditCard className="w-5 h-5 text-[#667eea] flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-gray-700">Método de pago</p>
                  <p className="text-gray-600 capitalize">{compra.metodoPago?.replace("_", " ")}</p>
                </div>
              </div>

              {/* Comprobante de pago si existe */}
              {comprobante && (
                <div className="flex gap-3 bg-blue-50 p-4 rounded-lg">
                  <div className="w-full">
                    <p className="font-semibold text-gray-700 mb-2">Comprobante de Pago ({comprobante.metodo_pago})</p>
                    <img
                      src={comprobante.archivo_url}
                      alt="Comprobante de pago"
                      className="max-w-sm max-h-64 rounded-lg border-2 border-[#667eea] cursor-pointer"
                      onClick={() => window.open(comprobante.archivo_url, "_blank")}
                    />
                    <p className="text-xs text-gray-500 mt-2">Haz clic para ver en tamaño completo</p>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-4">
              {compra.numeroSeguimiento && (
                <div className="flex gap-3">
                  <Package className="w-5 h-5 text-[#667eea] flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-700">Número de seguimiento</p>
                    <p className="text-gray-600">{compra.numeroSeguimiento}</p>
                  </div>
                </div>
              )}
              {compra.motivoRechazo && (
                <div className="flex gap-3">
                  <Clock className="w-5 h-5 text-red-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-700">Motivo de rechazo</p>
                    <p className="text-red-600">{compra.motivoRechazo}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Productos */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">Productos</h2>
          {!compra.detalles || compra.detalles.length === 0 ? (
            <p className="text-gray-500">No hay detalles disponibles</p>
          ) : (
            <div className="space-y-4">
              {compra.detalles.map((detalle: any, index: number) => (
                <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                  <img
                    src={detalle.producto?.imagen || "/placeholder.svg?height=80&width=80"}
                    alt={detalle.producto?.nombre || "Producto"}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-lg">{detalle.producto?.nombre || "Producto"}</p>
                    <p className="text-sm text-gray-600">{detalle.producto?.descripcion || ""}</p>
                    <p className="text-sm text-gray-600 mt-2">
                      Cantidad: {detalle.cantidad} x S/ {(Number(detalle.precioUnitario) || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#667eea] text-lg">
                      S/ {(Number(detalle.subtotal) || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resumen de totales */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Resumen de la compra</h2>
          <div className="bg-gray-50 rounded-lg p-6 space-y-3">
            <div className="flex justify-between text-gray-700">
              <span>Subtotal:</span>
              <span>S/ {(Number(compra.subtotal) || 0).toFixed(2)}</span>
            </div>
            {compra.igvActivo && config.aplicarIGV && (
              <div className="flex justify-between text-gray-700">
                <span>IGV ({config.porcentajeIGV || 18}%):</span>
                <span>S/ {(Number(compra.igv) || 0).toFixed(2)}</span>
              </div>
            )}
            {compra.envioActivo && config.aplicarEnvio && (
              <div className="flex justify-between text-gray-700">
                <span>Costo de envío:</span>
                <span>S/ {(Number(compra.costoEnvio) || 0).toFixed(2)}</span>
              </div>
            )}
            <div className="border-t pt-3 flex justify-between text-lg font-bold text-[#667eea]">
              <span>Total:</span>
              <span>S/ {(Number(compra.total) || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
