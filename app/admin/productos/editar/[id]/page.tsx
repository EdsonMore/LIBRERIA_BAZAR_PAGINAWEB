"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"

interface Categoria {
  id: number
  nombre: string
}

interface Producto {
  id: number
  nombre: string
  descripcion: string
  precio: number
  stock: number
  categoria_id: number
  imagen: string
  disponible: boolean
}

export default function EditarProductoPage() {
  const router = useRouter()
  const params = useParams()
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(false)
  const [producto, setProducto] = useState<Producto | null>(null)

  useEffect(() => {
    cargarCategorias()
    cargarProducto()
  }, [])

  const cargarCategorias = async () => {
    try {
      const res = await fetch("/api/categorias/activas")
      if (res.ok) {
        const data = await res.json()
        setCategorias(data)
      }
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const cargarProducto = async () => {
    try {
      const res = await fetch(`/api/productos/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setProducto(data)
      }
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!producto) return

    // Validar antes de enviar
    if (producto.imagen && producto.imagen.length > 2000) {
      alert("URL de imagen demasiado larga (máximo 2000 caracteres)")
      return
    }

    setLoading(true)
    try {
      // Preparar datos optimizados para enviar
      const dataToSend = {
        nombre: producto.nombre.trim(),
        descripcion: producto.descripcion.trim(),
        precio: Number(producto.precio),
        stock: Number(producto.stock),
        categoria_id: Number(producto.categoria_id),
        imagen: producto.imagen?.trim() || "",
        disponible: producto.disponible,
      }

      const res = await fetch(`/api/admin/productos/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      })

      if (res.ok) {
        alert("Producto actualizado exitosamente")
        router.push("/admin/productos")
      } else {
        const error = await res.json()
        alert(error.error || "Error al actualizar producto")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al actualizar producto")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de eliminar este producto?")) return

    try {
      const res = await fetch(`/api/admin/productos/${params.id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        router.push("/admin/productos")
      } else {
        alert("Error al eliminar producto")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al eliminar producto")
    }
  }

  if (!producto) {
    return <div className="p-8">Cargando producto...</div>
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Editar Producto</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Producto</label>
          <input
            type="text"
            required
            value={producto.nombre}
            onChange={(e) => setProducto({ ...producto, nombre: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          <textarea
            required
            value={producto.descripcion}
            onChange={(e) => setProducto({ ...producto, descripcion: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Precio (S/)</label>
            <input
              type="number"
              step="0.01"
              required
              value={producto.precio}
              onChange={(e) => setProducto({ ...producto, precio: Number.parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
            <input
              type="number"
              required
              value={producto.stock}
              onChange={(e) => setProducto({ ...producto, stock: Number.parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
          <select
            required
            value={producto.categoria_id}
            onChange={(e) => setProducto({ ...producto, categoria_id: Number.parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URL de Imagen</label>
          <input
            type="url"
            value={producto.imagen}
            onChange={(e) => setProducto({ ...producto, imagen: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="disponible"
            checked={producto.disponible}
            onChange={(e) => setProducto({ ...producto, disponible: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="disponible" className="ml-2 block text-sm text-gray-700">
            Producto disponible
          </label>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar Cambios"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
          >
            Eliminar
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
