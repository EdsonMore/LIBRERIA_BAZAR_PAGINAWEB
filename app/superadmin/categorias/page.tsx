"use client"

import type React from "react"

import { useState, useEffect } from "react"

interface Categoria {
  id: number
  nombre: string
  descripcion: string
  activa: boolean
  cantidadProductos: number
}

export default function SuperAdminCategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState<Categoria | null>(null)

  useEffect(() => {
    cargarCategorias()
  }, [])

  const cargarCategorias = async () => {
    try {
      const res = await fetch("/api/admin/categorias")
      if (res.ok) {
        const data = await res.json()
        setCategorias(data)
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleGuardar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    try {
      const res = await fetch("/api/admin/categorias", {
        method: editando ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editando?.id,
          nombre: formData.get("nombre"),
          descripcion: formData.get("descripcion"),
          activa: formData.get("activa") === "on",
        }),
      })

      if (res.ok) {
        setShowModal(false)
        setEditando(null)
        cargarCategorias()
      }
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const toggleActiva = async (id: number, activa: boolean) => {
    try {
      const res = await fetch("/api/admin/categorias/toggle", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, activa: !activa }),
      })

      if (res.ok) {
        cargarCategorias()
      }
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const handleEliminar = async (id: number) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta categoría?")) {
      return
    }

    try {
      const res = await fetch(`/api/admin/categorias/${id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        cargarCategorias()
      } else {
        const error = await res.json()
        alert(error.error || "Error al eliminar categoría")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al eliminar categoría")
    }
  }

  if (loading) {
    return <div className="p-4 md:p-8">Cargando categorías...</div>
  }

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0">
        <h1 className="text-xl md:text-2xl font-bold">Gestión de Categorías - SuperAdmin</h1>
        <button
          onClick={() => {
            setEditando(null)
            setShowModal(true)
          }}
          className="w-full md:w-auto px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm md:text-base"
        >
          Nueva Categoría
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {categorias.map((categoria) => (
          <div key={categoria.id} className="bg-white rounded-lg shadow p-4 md:p-6 space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
              <h3 className="text-lg md:text-xl font-semibold">{categoria.nombre}</h3>
              <span
                className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${categoria.activa ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
              >
                {categoria.activa ? "Activa" : "Inactiva"}
              </span>
            </div>
            <p className="text-gray-600 text-sm">{categoria.descripcion || "Sin descripción"}</p>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2">
              <span className="text-sm text-gray-500">{categoria.cantidadProductos} productos</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setEditando(categoria)
                    setShowModal(true)
                  }}
                  className="text-blue-600 hover:text-blue-800 text-xs md:text-sm font-medium"
                >
                  Editar
                </button>
                <button
                  onClick={() => toggleActiva(categoria.id, categoria.activa)}
                  className="text-purple-600 hover:text-purple-800 text-xs md:text-sm font-medium"
                >
                  {categoria.activa ? "Desact." : "Activ."}
                </button>
                <button
                  onClick={() => handleEliminar(categoria.id)}
                  className="text-red-600 hover:text-red-800 text-xs md:text-sm font-medium"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 md:p-8 max-w-md w-full">
            <h2 className="text-xl md:text-2xl font-bold mb-4">{editando ? "Editar Categoría" : "Nueva Categoría"}</h2>
            <form onSubmit={handleGuardar} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  defaultValue={editando?.nombre}
                  required
                  className="w-full px-4 py-2 border rounded text-sm md:text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Descripción</label>
                <textarea
                  name="descripcion"
                  defaultValue={editando?.descripcion}
                  className="w-full px-4 py-2 border rounded text-sm md:text-base"
                  rows={3}
                />
              </div>
              {editando && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="activa"
                    id="activa"
                    defaultChecked={editando.activa}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <label htmlFor="activa" className="ml-2 text-sm">
                    Categoría activa
                  </label>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-4">
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm md:text-base">
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditando(null)
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm md:text-base"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
