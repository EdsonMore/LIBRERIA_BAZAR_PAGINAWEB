"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Navbar from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"
import { Star, AlertCircle, CheckCircle2 } from "lucide-react"

export default function MisComprasResenaContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const compraId = searchParams.get("compraId")

  const [compra, setCompra] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [resenas, setResenas] = useState<any[]>([])

  const [formData, setFormData] = useState<{
    [key: number]: { calificacion: number; comentario: string }
  }>({})

  useEffect(() => {
    verificarAutenticacion()
  }, [])

  useEffect(() => {
    if (compraId) {
      cargarCompra()
    }
  }, [compraId])

  const verificarAutenticacion = async () => {
    try {
      const res = await fetch("/api/auth/me")
      if (res.status === 401) {
        router.push("/auth/login?redirect=" + encodeURIComponent(window.location.pathname + window.location.search))
      }
    } catch (error) {
      console.error("Error verificando autenticación:", error)
    }
  }

  const cargarCompra = async () => {
    try {
      const res = await fetch(`/api/mis-compras/${compraId}`)
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/auth/login")
          return
        }
        throw new Error("Compra no encontrada")
      }
      const data = await res.json()

      // Verificar que la compra esté ENTREGADA
      if (data.compra.estado !== "ENTREGADA") {
        setError("Solo puedes dejar reseñas de productos que ya han sido entregados")
        setLoading(false)
        return
      }

      setCompra(data.compra)
      setResenas(data.compra.detalles || [])
      
      // Inicializar formData con valores por defecto para cada producto
      const initialFormData: { [key: number]: { calificacion: number; comentario: string } } = {}
      data.compra.detalles?.forEach((detalle: any) => {
        initialFormData[detalle.productoId] = { calificacion: 5, comentario: "" }
      })
      setFormData(initialFormData)
      
      setLoading(false)
    } catch (error: any) {
      setError(error.message || "Error al cargar la compra")
      setLoading(false)
    }
  }

  const handleGuardarResena = async (productoId: number) => {
    const productoData = formData[productoId]
    
    console.log("🔍 DEBUG - Datos a enviar:", {
      productoId,
      compraId,
      calificacion: productoData?.calificacion,
      comentario: productoData?.comentario,
      productoDatoCompleto: productoData,
    })
    
    if (!productoData || !productoData.comentario?.trim()) {
      setError("El comentario no puede estar vacío")
      return
    }

    setGuardando(true)
    setError("")
    setSuccess(false)

    try {
      const payload = {
        productoId: Number(productoId),
        compraId: Number(compraId),
        calificacion: Number(productoData.calificacion),
        comentario: productoData.comentario,
      }
      
      console.log("📤 Enviando payload:", payload)
      
      const res = await fetch("/api/resenas/crear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        console.error("❌ Error del servidor:", data)
        throw new Error(data.error || "Error al guardar la reseña")
      }

      console.log("✅ Reseña guardada exitosamente")
      setSuccess(true)
      setFormData({})

      setTimeout(() => {
        router.push("/mis-resenas")
      }, 2000)
    } catch (error: any) {
      console.error("⚠️ Error en handleGuardarResena:", error)
      setError(error.message || "Error al guardar la reseña")
    } finally {
      setGuardando(false)
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
        <div className="container mx-auto px-4 py-16">
          <div className="bg-yellow-50 border border-yellow-400 text-yellow-800 px-4 py-3 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 mt-1 flex-shrink-0" />
            <div>
              <p className="font-semibold">No se encontró la compra</p>
              <p className="text-sm mt-1">Por favor, intenta nuevamente desde Mis Compras</p>
              <button
                onClick={() => router.push("/mis-compras")}
                className="mt-3 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-semibold"
              >
                Volver a Mis Compras
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  if (error && error.includes("entregados")) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <div className="bg-blue-50 border border-blue-400 text-blue-800 px-4 py-3 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 mt-1 flex-shrink-0" />
            <div>
              <p className="font-semibold">Esta compra aún no ha sido entregada</p>
              <p className="text-sm mt-1">Solo podrás dejar reseñas una vez que recibas los productos</p>
              <p className="text-sm font-semibold mt-2">Estado actual: {compra.estado}</p>
              <button
                onClick={() => router.push("/mis-compras")}
                className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold"
              >
                Volver a Mis Compras
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Dejar Reseñas</h1>

        {success && (
          <div className="bg-green-50 border border-green-400 text-green-800 px-4 py-3 rounded-lg flex items-start gap-2 mb-6">
            <CheckCircle2 className="w-5 h-5 mt-1 flex-shrink-0" />
            <div>
              <p className="font-semibold">¡Reseña enviada exitosamente!</p>
              <p className="text-sm mt-1">Tu reseña está pendiente de aprobación. Serás redirigido en breve...</p>
            </div>
          </div>
        )}

        {error && !error.includes("entregados") && (
          <div className="bg-red-50 border border-red-400 text-red-800 px-4 py-3 rounded-lg flex items-start gap-2 mb-6">
            <AlertCircle className="w-5 h-5 mt-1 flex-shrink-0" />
            <div>
              <p className="font-semibold">Error</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Productos de la Compra */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {compra.detalles?.map((detalle: any) => (
            <div key={detalle.id} className="bg-white rounded-lg shadow-md p-6 border-2 border-gray-200 hover:border-[#667eea] transition-colors">
              {/* Encabezado del Producto */}
              <div className="mb-4 pb-4 border-b">
                {/* Imagen del Producto */}
                {detalle.producto?.imagen && (
                  <div className="mb-3">
                    <img 
                      src={detalle.producto.imagen} 
                      alt={detalle.producto.nombre}
                      className="w-full h-40 object-cover rounded-lg"
                    />
                  </div>
                )}
                <h3 className="font-bold text-lg text-gray-800 mb-1">{detalle.producto?.nombre}</h3>
                <p className="text-sm text-gray-600">Cantidad: {detalle.cantidad}</p>
                <p className="text-sm text-gray-600">Precio: S/ {Number(detalle.precioUnitario)?.toFixed(2) || "N/A"}</p>
              </div>

              {/* Formulario de Reseña */}
              <div className="space-y-4">
                {/* Calificación */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Calificación *</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() =>
                          setFormData({
                            ...formData,
                            [detalle.productoId]: {
                              ...formData[detalle.productoId],
                              calificacion: star,
                            },
                          })
                        }
                        className={`p-1 transition-colors ${
                          (formData[detalle.productoId]?.calificacion || 0) >= star
                            ? "text-yellow-400"
                            : "text-gray-300"
                        }`}
                      >
                        <Star className="w-6 h-6 fill-current" />
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {formData[detalle.productoId]?.calificacion || 0} de 5 estrellas
                  </p>
                </div>

                {/* Comentario */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tu Comentario *</label>
                  <textarea
                    value={formData[detalle.productoId]?.comentario || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        [detalle.productoId]: {
                          ...formData[detalle.productoId],
                          comentario: e.target.value,
                        },
                      })
                    }
                    placeholder="Cuéntanos tu experiencia con este producto..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667eea] text-sm"
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">Mínimo 10 caracteres</p>
                </div>

                {/* Aviso */}
                <div className="bg-blue-50 rounded-lg p-3 text-xs text-gray-700">
                  <p>
                    <strong>Nota:</strong> Tu reseña será revisada por nuestro equipo antes de ser publicada. Gracias por tu honestidad.
                  </p>
                </div>

                {/* Botón */}
                <button
                  onClick={() => handleGuardarResena(detalle.productoId)}
                  disabled={guardando || !formData[detalle.productoId]?.comentario?.trim()}
                  className="w-full btn-primary py-2 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {guardando ? "Enviando..." : "Enviar Reseña"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Botón Volver */}
        <div className="mt-8">
          <button
            onClick={() => router.push("/mis-compras")}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-[#667eea] hover:text-[#667eea] transition-all"
          >
            Volver a Mis Compras
          </button>
        </div>
      </div>

      <Footer />
    </>
  )
}
