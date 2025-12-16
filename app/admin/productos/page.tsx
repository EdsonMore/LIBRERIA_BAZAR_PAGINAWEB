"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface Producto {
  id: number
  nombre: string
  precio: number
  stock: number
  disponible: boolean
  categoriaNombre: string
  imagen: string
}

export default function AdminProductosPage() {
  const router = useRouter()
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [buscar, setBuscar] = useState("")

  useEffect(() => {
    cargarProductos()
  }, [])

  const cargarProductos = async () => {
    try {
      const res = await fetch("/api/admin/productos")
      if (res.ok) {
        const data = await res.json()
        setProductos(data)
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const productosFiltrados = productos.filter((p) => p.nombre.toLowerCase().includes(buscar.toLowerCase()))

  if (loading) {
    return <div className="p-8">Cargando productos...</div>
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Productos</h1>
        <button
          onClick={() => router.push("/admin/productos/crear")}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Nuevo Producto
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar productos..."
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
          className="px-4 py-2 border rounded w-full max-w-md"
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {productosFiltrados.map((producto) => (
              <tr key={producto.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <img
                      src={producto.imagen || "/placeholder.svg"}
                      alt={producto.nombre}
                      className="h-10 w-10 rounded object-cover"
                    />
                    <span className="ml-3 font-medium">{producto.nombre}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{producto.categoriaNombre}</td>
                <td className="px-6 py-4 whitespace-nowrap">S/ {producto.precio.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap">{producto.stock}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${producto.disponible ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                  >
                    {producto.disponible ? "Disponible" : "No disponible"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => router.push(`/admin/productos/editar/${producto.id}`)}
                    className="text-blue-600 hover:text-blue-800 mr-3"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
