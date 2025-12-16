"use client"

import { useState, useEffect } from "react"
import { Star, Trash2, Eye, Check, X } from "lucide-react"

interface Resena {
  id: number
  productoId: number
  productNombre: string
  usuarioId: number
  usuarioNombre: string
  calificacion: number
  contenido: string
  fecha: string
  estado: string
}

export default function SuperAdminResenasPage() {
  const [resenas, setResenas] = useState<Resena[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState("todas")
  const [selectedResena, setSelectedResena] = useState<Resena | null>(null)
  const [showDetalles, setShowDetalles] = useState(false)
  const [procesandoAccion, setProcesandoAccion] = useState(false)

  useEffect(() => {
    cargarResenas()
  }, [filtroEstado])

  const cargarResenas = async () => {
    try {
      const res = await fetch("/api/admin/resenas")
      if (res.ok) {
        let data = await res.json()
        if (Array.isArray(data)) {
          if (filtroEstado !== "todas") {
            data = data.filter((r: Resena) => r.estado === filtroEstado)
          }
          setResenas(data)
        } else {
          setResenas([])
        }
      } else {
        setResenas([])
      }
    } catch (error) {
      console.error("Error:", error)
      setResenas([])
    } finally {
      setLoading(false)
    }
  }

  const abrirDetalles = (resena: Resena) => {
    setSelectedResena(resena)
    setShowDetalles(true)
  }

  const cerrarDetalles = () => {
    setShowDetalles(false)
    setTimeout(() => setSelectedResena(null), 300)
  }

  const aprobarResena = async (id: number) => {
    if (!confirm("¿Estás seguro que deseas aprobar esta reseña?")) return
    try {
      setProcesandoAccion(true)
      const res = await fetch(`/api/admin/resenas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "APROBADA" }),
      })
      if (res.ok) {
        cerrarDetalles()
        cargarResenas()
      } else {
        alert("Error al aprobar la reseña")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al aprobar la reseña")
    } finally {
      setProcesandoAccion(false)
    }
  }

  const rechazarResena = async (id: number) => {
    if (!confirm("¿Estás seguro que deseas rechazar esta reseña?")) return
    try {
      setProcesandoAccion(true)
      const res = await fetch(`/api/admin/resenas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "RECHAZADA" }),
      })
      if (res.ok) {
        cerrarDetalles()
        cargarResenas()
      } else {
        alert("Error al rechazar la reseña")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al rechazar la reseña")
    } finally {
      setProcesandoAccion(false)
    }
  }

  const eliminarResena = async (id: number) => {
    if (!confirm("¿Estás seguro que deseas eliminar esta reseña?")) return
    try {
      setProcesandoAccion(true)
      const res = await fetch(`/api/admin/resenas/${id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        cerrarDetalles()
        cargarResenas()
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setProcesandoAccion(false)
    }
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
          />
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Gestión de Reseñas - SuperAdmin</h1>
        <div>Cargando reseñas...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Reseñas - SuperAdmin</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setFiltroEstado("todas")}
            className={`px-4 py-2 rounded ${
              filtroEstado === "todas" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFiltroEstado("PENDIENTE")}
            className={`px-4 py-2 rounded ${
              filtroEstado === "PENDIENTE" ? "bg-yellow-600 text-white" : "bg-gray-200 text-gray-700"
            }`}
          >
            Pendientes
          </button>
          <button
            onClick={() => setFiltroEstado("APROBADA")}
            className={`px-4 py-2 rounded ${
              filtroEstado === "APROBADA" ? "bg-green-600 text-white" : "bg-gray-200 text-gray-700"
            }`}
          >
            Aprobadas
          </button>
          <button
            onClick={() => setFiltroEstado("RECHAZADA")}
            className={`px-4 py-2 rounded ${
              filtroEstado === "RECHAZADA" ? "bg-red-600 text-white" : "bg-gray-200 text-gray-700"
            }`}
          >
            Rechazadas
          </button>
        </div>
      </div>

      {resenas.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          <p>No hay reseñas registradas</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Producto</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Usuario</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Calificación</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Estado</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Fecha</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {resenas.map((resena) => (
                <tr key={resena.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900">{resena.productNombre}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{resena.usuarioNombre}</td>
                  <td className="px-6 py-4 text-sm">{renderStars(resena.calificacion)}</td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        resena.estado === "APROBADA"
                          ? "bg-green-100 text-green-800"
                          : resena.estado === "RECHAZADA"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {resena.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(resena.fecha).toLocaleDateString("es-PE")}
                  </td>
                  <td className="px-6 py-4 text-sm flex gap-2">
                    <button
                      onClick={() => abrirDetalles(resena)}
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      Ver
                    </button>
                    <button
                      onClick={() => eliminarResena(resena.id)}
                      className="text-red-600 hover:text-red-800 flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showDetalles && selectedResena && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="sticky top-0 bg-gray-100 p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Detalles de Reseña #{selectedResena.id}</h2>
              <button
                onClick={cerrarDetalles}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600">Producto</p>
                  <p className="font-semibold">{selectedResena.productNombre}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Usuario</p>
                  <p className="font-semibold">{selectedResena.usuarioNombre}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Calificación</p>
                  <div className="mt-1">{renderStars(selectedResena.calificacion)}</div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estado</p>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold inline-block ${
                      selectedResena.estado === "APROBADA"
                        ? "bg-green-100 text-green-800"
                        : selectedResena.estado === "RECHAZADA"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {selectedResena.estado}
                  </span>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Contenido de la Reseña</h3>
                <p className="text-gray-700 leading-relaxed">{selectedResena.contenido}</p>
                <p className="text-sm text-gray-500 mt-4">
                  Fecha: {new Date(selectedResena.fecha).toLocaleDateString("es-PE", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              {/* Acciones según estado */}
              <div className="mt-6 border-t pt-4 flex gap-3">
                {selectedResena.estado === "PENDIENTE" && (
                  <>
                    <button
                      onClick={() => aprobarResena(selectedResena.id)}
                      disabled={procesandoAccion}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Aprobar
                    </button>
                    <button
                      onClick={() => rechazarResena(selectedResena.id)}
                      disabled={procesandoAccion}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Rechazar
                    </button>
                  </>
                )}
                <button
                  onClick={() => eliminarResena(selectedResena.id)}
                  disabled={procesandoAccion}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
