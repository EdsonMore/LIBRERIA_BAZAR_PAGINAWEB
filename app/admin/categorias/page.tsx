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

export default function AdminCategoriasPage() {
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

  if (loading) {
    return <div className="p-8">Cargando categorías...</div>
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Categorías</h1>
        <button
          onClick={() => {
            setEditando(null)
            setShowModal(true)
          }}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Nueva Categoría
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categorias.map((categoria) => (
          <div key={categoria.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold">{categoria.nombre}</h3>
              <span
                className={`px-2 py-1 text-xs rounded-full ${categoria.activa ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
              >
                {categoria.activa ? "Activa" : "Inactiva"}
              </span>
            </div>
            <p className="text-gray-600 text-sm mb-4">{categoria.descripcion || "Sin descripción"}</p>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">{categoria.cantidadProductos} productos</span>
              <button
                onClick={() => {
                  setEditando(categoria)
                  setShowModal(true)
                }}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Editar
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">{editando ? "Editar Categoría" : "Nueva Categoría"}</h2>
            <form onSubmit={handleGuardar}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  defaultValue={editando?.nombre}
                  required
                  className="w-full px-4 py-2 border rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Descripción</label>
                <textarea
                  name="descripcion"
                  defaultValue={editando?.descripcion}
                  className="w-full px-4 py-2 border rounded"
                  rows={3}
                />
              </div>
              <div className="flex gap-4">
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditando(null)
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
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
