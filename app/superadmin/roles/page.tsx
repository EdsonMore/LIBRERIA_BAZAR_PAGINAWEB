"use client"

import type React from "react"

import { useState, useEffect } from "react"

interface Rol {
  id: number
  nombre: string
  descripcion: string
  cantidadUsuarios: number
}

export default function SuperAdminRolesPage() {
  const [roles, setRoles] = useState<Rol[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState<Rol | null>(null)

  useEffect(() => {
    cargarRoles()
  }, [])

  const cargarRoles = async () => {
    try {
      const res = await fetch("/api/admin/roles")
      if (res.ok) {
        const data = await res.json()
        setRoles(data)
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
      const res = await fetch("/api/admin/roles", {
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
        cargarRoles()
      }
    } catch (error) {
      console.error("Error:", error)
    }
  }

  if (loading) {
    return <div className="p-8">Cargando roles...</div>
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Roles y Permisos</h1>
        <button
          onClick={() => {
            setEditando(null)
            setShowModal(true)
          }}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Nuevo Rol
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((rol) => (
          <div key={rol.id} className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-2">{rol.nombre}</h3>
            <p className="text-gray-600 text-sm mb-4">{rol.descripcion || "Sin descripción"}</p>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">{rol.cantidadUsuarios} usuarios</span>
              <button
                onClick={() => {
                  setEditando(rol)
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
            <h2 className="text-xl font-bold mb-4">{editando ? "Editar Rol" : "Nuevo Rol"}</h2>
            <form onSubmit={handleGuardar}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Nombre del Rol</label>
                <input
                  type="text"
                  name="nombre"
                  defaultValue={editando?.nombre}
                  required
                  placeholder="ROLE_NOMBRE"
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
