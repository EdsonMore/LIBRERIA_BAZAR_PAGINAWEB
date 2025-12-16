"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import Navbar from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"
import { Search, Filter, ShoppingCart } from "lucide-react"

export default function ProductosPage() {
  const searchParams = useSearchParams()
  const [productos, setProductos] = useState<any[]>([])
  const [categorias, setCategorias] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState({
    categoria: searchParams.get("categoria") || "",
    busqueda: searchParams.get("q") || "",
    page: 1,
  })
  const [pagination, setPagination] = useState<any>(null)

  useEffect(() => {
    // Cargar categorías
    fetch("/api/categorias/activas")
      .then((res) => res.json())
      .then((data) => setCategorias(data))
      .catch(console.error)
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filtros.categoria) params.set("categoria", filtros.categoria)
    if (filtros.busqueda) params.set("q", filtros.busqueda)
    params.set("page", filtros.page.toString())

    fetch(`/api/productos?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setProductos(data.productos)
        setPagination(data.pagination)
        setLoading(false)
      })
      .catch((error) => {
        console.error(error)
        setLoading(false)
      })
  }, [filtros])

  const agregarAlCarrito = async (productoId: number) => {
    try {
      const res = await fetch("/api/carrito/agregar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productoId, cantidad: 1 }),
      })

      if (res.ok) {
        window.dispatchEvent(new CustomEvent("carritoActualizado", { detail: { cantidad: 1 } }))
        alert("Producto agregado al carrito")
      } else {
        const data = await res.json()
        alert(data.error || "Error al agregar al carrito")
      }
    } catch (error) {
      alert("Error de conexión")
    }
  }

  return (
    <>
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-center">Nuestros Productos</h1>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar productos..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
                value={filtros.busqueda}
                onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value, page: 1 })}
              />
            </div>

            {/* Categoría */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#667eea] focus:border-transparent appearance-none"
                value={filtros.categoria}
                onChange={(e) => setFiltros({ ...filtros, categoria: e.target.value, page: 1 })}
              >
                <option value="">Todas las categorías</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Botón limpiar */}
            <button
              onClick={() => setFiltros({ categoria: "", busqueda: "", page: 1 })}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>

        {/* Grid de productos */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#667eea] border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Cargando productos...</p>
          </div>
        ) : productos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600">No se encontraron productos</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {productos.map((producto) => (
                <div key={producto.id} className="product-card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <Link href={`/producto/${producto.id}`} className="block">
                    <img
                      src={producto.imagen || "/placeholder.svg?height=250&width=250"}
                      alt={producto.nombre}
                      className="w-full h-40 sm:h-64 object-cover"
                    />
                  </Link>
                  <div className="p-3 sm:p-4">
                    <span className="badge bg-primary text-xs">{producto.categoria_nombre}</span>
                    <Link href={`/producto/${producto.id}`} className="block">
                      <h3 className="text-sm sm:text-lg font-bold mt-2 hover:text-[#667eea] transition-colors line-clamp-2">
                        {producto.nombre}
                      </h3>
                    </Link>
                    <p className="card-text text-xs sm:text-sm mt-1 sm:mt-2 line-clamp-2">{producto.descripcion}</p>
                    <div className="mt-2 sm:mt-4 flex items-center justify-between">
                      <span className="text-lg sm:text-2xl font-bold text-[#667eea]">S/ {parseFloat(producto.precio).toFixed(2)}</span>
                      {producto.stock > 0 ? (
                        <span className="badge bg-success text-xs">Disp.</span>
                      ) : (
                        <span className="badge bg-danger text-xs">Agotado</span>
                      )}
                    </div>
                    <div className="mt-2 sm:mt-4 flex gap-2">
                      <Link
                        href={`/producto/${producto.id}`}
                        className="flex-1 py-1.5 sm:py-2 btn-secondary text-xs sm:text-sm text-center rounded-lg"
                      >
                        Ver Detalles
                      </Link>
                      <button
                        onClick={() => agregarAlCarrito(producto.id)}
                        disabled={producto.stock === 0}
                        className="flex-1 py-1.5 sm:py-2 btn-primary text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 rounded-lg"
                      >
                        <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Agregar</span>
                        <span className="sm:hidden">+</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginación */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                <button
                  onClick={() => setFiltros({ ...filtros, page: filtros.page - 1 })}
                  disabled={filtros.page === 1}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span className="px-4 py-2">
                  Página {filtros.page} de {pagination.totalPages}
                </span>
                <button
                  onClick={() => setFiltros({ ...filtros, page: filtros.page + 1 })}
                  disabled={filtros.page === pagination.totalPages}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </>
  )
}
