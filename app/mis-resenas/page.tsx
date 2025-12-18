"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"
import { Star, Trash2 } from "lucide-react"

export default function MisResenasPage() {
  const router = useRouter()
  const [resenas, setResenas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarResenas()
  }, [])

  const cargarResenas = async () => {
    try {
      const res = await fetch("/api/mis-resenas")
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/auth/login")
        }
        return
      }
      const data = await res.json()
      setResenas(data.resenas || [])
      setLoading(false)
    } catch (error) {
      console.error(error)
      setLoading(false)
    }
  }

  const eliminarResena = async (resenaId: number) => {
    if (!confirm("¿Está seguro de eliminar esta reseña?")) return

    try {
      const res = await fetch(`/api/resenas/${resenaId}`, { method: "DELETE" })
      if (res.ok) {
        alert("Reseña eliminada")
        cargarResenas()
      }
    } catch (error) {
      alert("Error al eliminar reseña")
    }
  }

  const renderEstrellas = (calificacion: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`w-5 h-5 ${i < calificacion ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
    ))
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "APROBADA":
        return <span className="badge bg-success">Aprobada</span>
      case "PENDIENTE":
        return <span className="badge bg-warning">Pendiente</span>
      case "RECHAZADA":
        return <span className="badge bg-danger">Rechazada</span>
      default:
        return <span className="badge bg-secondary">{estado}</span>
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#C8D800] border-t-transparent"></div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Mis Reseñas</h1>

        {resenas.length === 0 ? (
          <div className="text-center py-16">
            <Star className="w-24 h-24 mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-gray-600 mb-4">No has escrito reseñas aún</h2>
            <button onClick={() => router.push("/mis-compras")} className="btn-primary px-8 py-3">
              Ver Mis Compras
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {resenas.map((resena) => (
              <div key={resena.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Imagen del producto */}
                  <img
                    src={resena.producto?.imagen || "/placeholder.svg?height=120&width=120"}
                    alt={resena.producto?.nombre}
                    className="w-32 h-32 object-cover rounded-lg"
                  />

                  {/* Contenido */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold">{resena.producto?.nombre}</h3>
                        <p className="text-sm text-gray-600">
                          {new Date(resena.fecha).toLocaleDateString("es-PE", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      {getEstadoBadge(resena.estado)}
                    </div>

                    <div className="flex items-center gap-2 mb-3">{renderEstrellas(resena.calificacion)}</div>

                    <p className="text-gray-700 mb-4">{resena.comentario}</p>

                    {/* Acciones */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => eliminarResena(resena.id)}
                        className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Eliminar
                      </button>
                    </div>
                  </div>
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

