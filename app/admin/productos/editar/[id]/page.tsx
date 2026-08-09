"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { EscanerCodigo } from "@/components/ui/escaner-codigo"

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
  codigoBarras: string
  disponible: boolean
}

export default function EditarProductoPage() {
  const router = useRouter()
  const params = useParams()
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(false)
  const [escanerAbierto, setEscanerAbierto] = useState(false)
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
        // IMPORTANTE: Solo guardamos los campos necesarios para editar
        // Descartamos relacionados, reseñas, y otros campos innecesarios
        setProducto({
          id: data.id,
          nombre: data.nombre || "",
          descripcion: data.descripcion || "",
          precio: data.precio || 0,
          stock: data.stock || 0,
          categoria_id: data.categoria_id || 0,
          imagen: data.imagen || "",
          codigoBarras: data.codigoBarras || "",
          disponible: data.disponible || false,
        })
      }
    } catch (error) {
      console.error("Error al cargar producto:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!producto) return

    // Validar nombre
    if (!producto.nombre?.trim()) {
      alert("El nombre del producto es obligatorio")
      return
    }

    // Validar descripción
    if (!producto.descripcion?.trim()) {
      alert("La descripción es obligatoria")
      return
    }

    // Validar precio
    const precioNum = parseFloat(String(producto.precio))
    if (isNaN(precioNum) || precioNum < 0) {
      alert("El precio debe ser un número válido mayor a 0")
      return
    }

    // Validar stock
    const stockNum = parseInt(String(producto.stock))
    if (isNaN(stockNum) || stockNum < 0) {
      alert("El stock debe ser un número entero válido")
      return
    }

    // Redondear precio a 2 decimales
    const precioDosDecimales = Math.round(precioNum * 100) / 100

    setLoading(true)
    try {
      // IMPORTANTE: Enviar SOLO los 7 campos necesarios, nada más
      // Esto asegura que el payload sea pequeño y sin datos innecesarios
      const dataToSend = {
        nombre: producto.nombre.trim(),
        descripcion: producto.descripcion.trim(),
        precio: precioDosDecimales,
        stock: stockNum,
        categoria_id: Number(producto.categoria_id),
        imagen: producto.imagen || "",
        codigo_barras: producto.codigoBarras || "",
        disponible: Boolean(producto.disponible),
      }

      console.log("Enviando datos:", dataToSend)
      console.log("Tamaño del payload:", JSON.stringify(dataToSend).length, "bytes")

      const res = await fetch(`/api/admin/productos/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      })

      if (!res.ok) {
        let errorMsg = "Error al actualizar producto"
        try {
          const errorData = await res.json()
          errorMsg = errorData.error || errorMsg
        } catch {
          errorMsg = `Error ${res.status}: ${res.statusText}`
        }
        alert(errorMsg)
        return
      }

      alert("Producto actualizado exitosamente")
      router.push("/admin/productos")
    } catch (error) {
      console.error("Error:", error)
      alert(error instanceof Error ? error.message : "Error al actualizar producto")
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
              type="text"
              inputMode="decimal"
              pattern="[0-9]+(\\.[0-9]{1,2})?"
              required
              value={producto.precio}
              onChange={(e) => {
                const value = e.target.value
                // Permitir solo números y un punto
                if (/^\d*\.?\d*$/.test(value) || value === "") {
                  setProducto({ ...producto, precio: value === "" ? 0 : value })
                }
              }}
              onBlur={(e) => {
                const value = parseFloat(String(e.target.value))
                if (!isNaN(value)) {
                  // Redondear a 2 decimales
                  const rounded = Math.round(value * 100) / 100
                  setProducto({ ...producto, precio: rounded })
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              required
              value={producto.stock}
              onChange={(e) => {
                const value = e.target.value
                // Permitir solo números
                if (/^\d*$/.test(value) || value === "") {
                  setProducto({ ...producto, stock: value === "" ? 0 : value })
                }
              }}
              onBlur={(e) => {
                const value = parseInt(e.target.value)
                if (!isNaN(value)) {
                  setProducto({ ...producto, stock: value })
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Código de Barras</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={producto.codigoBarras}
              onChange={(e) => setProducto({ ...producto, codigoBarras: e.target.value })}
              placeholder="Ej: 7754001234567"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => setEscanerAbierto(true)}
              className="px-3 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700"
            >
              📷 Escanear
            </button>
          </div>
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

      <EscanerCodigo
        open={escanerAbierto}
        onOpenChange={setEscanerAbierto}
        onCodigoLeido={(codigo) => {
          setProducto((prev) => (prev ? { ...prev, codigoBarras: codigo } : prev))
        }}
        titulo="Escanear código de barras"
      />
    </div>
  )
}
