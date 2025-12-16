"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react"

export default function CarritoPage() {
  const router = useRouter()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [config, setConfig] = useState<any>({ aplicarIGV: true, porcentajeIGV: 18, aplicarEnvio: true, costoEnvio: 15 })

  useEffect(() => {
    cargarCarrito()
    cargarConfiguracion()
  }, [])

  const cargarCarrito = async () => {
    try {
      const res = await fetch("/api/carrito")
      if (res.ok) {
        const data = await res.json()
        setItems(data.items || [])
      }
      setLoading(false)
    } catch (error) {
      console.error(error)
      setLoading(false)
    }
  }

  const cargarConfiguracion = async () => {
    try {
      const res = await fetch("/api/configuracion-sistema")
      if (res.ok) {
        const data = await res.json()
        setConfig(data)
      }
    } catch (error) {
      console.error(error)
    }
  }

  const actualizarCantidad = async (itemId: number, cantidad: number) => {
    try {
      const res = await fetch("/api/carrito/actualizar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, cantidad }),
      })
      if (res.ok) {
        cargarCarrito()
      }
    } catch (error) {
      console.error(error)
    }
  }

  const eliminarItem = async (itemId: number) => {
    try {
      const res = await fetch(`/api/carrito/${itemId}`, { method: "DELETE" })
      if (res.ok) {
        cargarCarrito()
      }
    } catch (error) {
      console.error(error)
    }
  }

  const calcularSubtotal = () => {
    return items.reduce((sum, item) => sum + item.producto.precio * item.cantidad, 0)
  }

  const calcularIGV = () => {
    if (!config.aplicarIGV) return 0
    return calcularSubtotal() * (config.porcentajeIGV / 100)
  }

  const calcularEnvio = () => {
    if (!config.aplicarEnvio) return 0
    return config.costoEnvio
  }

  const calcularTotal = () => {
    return calcularSubtotal() + calcularIGV() + calcularEnvio()
  }

  const procederAlCheckout = () => {
    router.push("/checkout")
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
        <h1 className="text-4xl font-bold mb-8">Carrito de Compras</h1>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="w-24 h-24 mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-gray-600 mb-4">Tu carrito está vacío</h2>
            <button onClick={() => router.push("/productos")} className="btn-primary px-8 py-3">
              Ir a Productos
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Lista de items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow-md p-6 flex items-center gap-6">
                  <img
                    src={item.producto.imagen || "/placeholder.svg?height=100&width=100"}
                    alt={item.producto.nombre}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold">{item.producto.nombre}</h3>
                    <p className="text-gray-600">{item.producto.categoria_nombre}</p>
                    <p className="text-2xl font-bold text-[#667eea] mt-2">S/ {item.producto.precio.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => actualizarCantidad(item.id, item.cantidad - 1)}
                      disabled={item.cantidad <= 1}
                      className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-xl font-bold w-8 text-center">{item.cantidad}</span>
                    <button
                      onClick={() => actualizarCantidad(item.id, item.cantidad + 1)}
                      className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => eliminarItem(item.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Resumen */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-lg p-6 sticky top-24">
                <h2 className="text-2xl font-bold mb-6">Resumen del Pedido</h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-semibold">S/ {calcularSubtotal().toFixed(2)}</span>
                  </div>
                  {config.aplicarIGV && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">IGV ({config.porcentajeIGV}%):</span>
                      <span className="font-semibold">S/ {calcularIGV().toFixed(2)}</span>
                    </div>
                  )}
                  {config.aplicarEnvio && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Envío:</span>
                      <span className="font-semibold">S/ {calcularEnvio().toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t pt-3 flex justify-between text-xl font-bold">
                    <span>Total:</span>
                    <span className="text-[#667eea]">S/ {calcularTotal().toFixed(2)}</span>
                  </div>
                </div>

                <button onClick={procederAlCheckout} className="w-full btn-primary py-3 text-lg">
                  Proceder al Pago
                </button>

                <button
                  onClick={() => router.push("/productos")}
                  className="w-full mt-3 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-full hover:border-[#667eea] hover:text-[#667eea] transition-all"
                >
                  Seguir Comprando
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </>
  )
}
