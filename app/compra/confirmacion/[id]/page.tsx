'use dynamic'

import { redirect } from "next/navigation"
import Navbar from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"
import { getSession } from "@/lib/auth"

interface DetalleCompra {
  productoNombre: string
  productoImagen: string
  cantidad: number
  precioUnitario: number
  subtotal: number
}

interface Compra {
  id: number
  fechaCompra: string
  estado: string
  metodoPago: string
  direccionEntrega: string
  subtotal: number
  igv: number
  costoEnvio: number
  total: number
  numeroSeguimiento: string
  detalles: DetalleCompra[]
}

async function obtenerCompra(id: string): Promise<Compra | null> {
  try {
    const session = await getSession()
    if (!session) return null

    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/compras/${id}`, {
      cache: "no-store",
      headers: {
        Cookie: `session=${session}`,
      },
    })

    if (!res.ok) return null
    return res.json()
  } catch (error) {
    console.error("Error al obtener compra:", error)
    return null
  }
}

export default async function ConfirmacionPage({ params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) {
    redirect("/auth/login")
  }

  const compra = await obtenerCompra(params.id)
  if (!compra) {
    redirect("/mis-compras")
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-grow py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Mensaje de éxito */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8 text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">¡Pedido Confirmado!</h1>
            <p className="text-gray-600">Tu pedido ha sido registrado exitosamente</p>
          </div>

          {/* Información del pedido */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Información del Pedido</h2>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Número de Pedido</p>
                <p className="font-semibold">#{compra.id.toString().padStart(6, "0")}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Estado</p>
                <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                  {compra.estado}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Fecha</p>
                <p className="font-semibold">{new Date(compra.fechaCompra).toLocaleDateString("es-ES")}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Método de Pago</p>
                <p className="font-semibold">{compra.metodoPago}</p>
              </div>
            </div>

            {compra.numeroSeguimiento && (
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-sm text-blue-800">
                  <strong>Número de Seguimiento:</strong> {compra.numeroSeguimiento}
                </p>
              </div>
            )}

            <div className="mt-4">
              <p className="text-sm text-gray-600">Dirección de Entrega</p>
              <p className="font-medium">{compra.direccionEntrega}</p>
            </div>
          </div>

          {/* Productos */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Productos</h2>
            <div className="space-y-4">
              {compra.detalles.map((detalle, index) => (
                <div key={index} className="flex items-center gap-4 pb-4 border-b last:border-0">
                  <img
                    src={detalle.productoImagen || "/placeholder.svg"}
                    alt={detalle.productoNombre}
                    className="w-20 h-20 object-cover rounded"
                  />
                  <div className="flex-grow">
                    <h3 className="font-semibold">{detalle.productoNombre}</h3>
                    <p className="text-sm text-gray-600">
                      Cantidad: {detalle.cantidad} x S/ {detalle.precioUnitario.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">S/ {detalle.subtotal.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resumen */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Resumen</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span>S/ {compra.subtotal.toFixed(2)}</span>
              </div>
              {compra.igv > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">IGV</span>
                  <span>S/ {compra.igv.toFixed(2)}</span>
                </div>
              )}
              {compra.costoEnvio > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Envío</span>
                  <span>S/ {compra.costoEnvio.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between items-center">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-2xl font-bold text-amber-600">S/ {compra.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="mt-8 flex gap-4 justify-center">
            <a
              href="/mis-compras"
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold rounded-lg transition-colors"
            >
              Ver Mis Compras
            </a>
            <a
              href="/productos"
              className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors"
            >
              Seguir Comprando
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
