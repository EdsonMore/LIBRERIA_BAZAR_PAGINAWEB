'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Producto {
  id: number
  nombre: string
  categoria_nombre: string
  precio: number
  stock: number
  disponible: boolean
  imagen: string
  descripcion: string
}

export function ProductosNavidad() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [indiceActual, setIndiceActual] = useState(0)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const PRODUCTOS_MOSTRAR = 6
  const TIEMPO_ROTACION = 5000 // 5 segundos

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        setCargando(true)
        const response = await fetch(`/api/productos/destacados-navidad?limit=30`)
        
        if (!response.ok) {
          throw new Error('Error al cargar productos')
        }

        const data = await response.json()
        setProductos(data.productos || [])
      } catch (err: any) {
        console.error('Error:', err)
        setError(err.message)
      } finally {
        setCargando(false)
      }
    }

    cargarProductos()
  }, [])

  // Rotación automática
  useEffect(() => {
    if (productos.length === 0) return

    const intervalo = setInterval(() => {
      setIndiceActual((prev) => {
        const siguiente = prev + PRODUCTOS_MOSTRAR
        // Si llegamos al final, volvemos al inicio
        return siguiente >= productos.length ? 0 : siguiente
      })
    }, TIEMPO_ROTACION)

    return () => clearInterval(intervalo)
  }, [productos])

  if (cargando) {
    return (
      <section className="py-16 bg-white border-t border-b border-gray-200">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-[#C8D800]">
            🎄 Especial Navidad
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-gray-200 rounded-lg h-64 animate-pulse"
              />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (error || productos.length === 0) {
    return null
  }

  const productosActuales = productos.slice(
    indiceActual,
    indiceActual + PRODUCTOS_MOSTRAR
  )

  // Rellenar con productos del inicio si no hay suficientes al final
  const productosRellenados = [
    ...productosActuales,
    ...productos.slice(0, Math.max(0, PRODUCTOS_MOSTRAR - productosActuales.length)),
  ]

  const irAnterior = () => {
    setIndiceActual((prev) => {
      const anterior = prev - PRODUCTOS_MOSTRAR
      return anterior < 0 ? Math.max(0, productos.length - PRODUCTOS_MOSTRAR) : anterior
    })
  }

  const irSiguiente = () => {
    setIndiceActual((prev) => {
      const siguiente = prev + PRODUCTOS_MOSTRAR
      return siguiente >= productos.length ? 0 : siguiente
    })
  }

  return (
    <section className="py-16 bg-white border-t border-b border-gray-200">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-4 text-[#C8D800]">
          🎄 Especial Navidad
        </h2>
        <p className="text-center text-gray-600 mb-12 text-lg">
          Descubre nuestras mejores ofertas en juguetes y decoraciones navideñas
        </p>

        <div className="relative">
          {/* Grid de productos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
            {productosRellenados.map((producto) => (
              <Link
                key={`${producto.id}-${Math.random()}`}
                href={`/producto/${producto.id}`}
                className="group"
              >
                <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col border border-gray-200">
                  {/* Imagen */}
                  <div className="relative h-40 bg-gray-50 overflow-hidden">
                    {producto.imagen ? (
                      <Image
                        src={producto.imagen}
                        alt={producto.nombre}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <span className="text-4xl">🎁</span>
                      </div>
                    )}
                    {producto.stock < 5 && (
                      <div className="absolute top-2 right-2 bg-[#E91E63] text-white px-2 py-1 rounded text-xs font-bold">
                        ¡Pocos!
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-xs text-[#C8D800] font-semibold mb-1">
                        {producto.categoria_nombre}
                      </p>
                      <h3 className="font-bold text-sm line-clamp-2 text-gray-800 group-hover:text-[#1B6B3D]">
                        {producto.nombre}
                      </h3>
                    </div>

                    {/* Precio */}
                    <div className="mt-2">
                      <p className="text-xl font-bold text-[#E80B7B]">
                        S/. {Number(producto.precio).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Stock: {producto.stock} disponibles
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Botones de navegación */}
          {productos.length > PRODUCTOS_MOSTRAR && (
            <div className="flex justify-center gap-4">
              <button
                onClick={irAnterior}
                className="bg-[#1B6B3D] hover:bg-[#00A699] text-white p-3 rounded-full transition-colors"
                aria-label="Productos anteriores"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Indicadores de página */}
              <div className="flex items-center gap-2">
                {Array.from(
                  { length: Math.ceil(productos.length / PRODUCTOS_MOSTRAR) },
                  (_, i) => (
                    <button
                      key={i}
                      onClick={() => setIndiceActual(i * PRODUCTOS_MOSTRAR)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        i === Math.floor(indiceActual / PRODUCTOS_MOSTRAR)
                          ? 'bg-[#1B6B3D]'
                          : 'bg-gray-300'
                      }`}
                      aria-label={`Ir a página ${i + 1}`}
                    />
                  )
                )}
              </div>

              <button
                onClick={irSiguiente}
                className="bg-[#1B6B3D] hover:bg-[#00A699] text-white p-3 rounded-full transition-colors"
                aria-label="Productos siguientes"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Botón Ver más */}
        <div className="text-center mt-8">
          <Link
            href="/productos?categoria=4"
            className="inline-block bg-[#1B6B3D] hover:bg-[#00A699] text-white font-bold py-3 px-8 rounded-lg transition-colors"
          >
            Ver todas las ofertas navideñas →
          </Link>
        </div>
      </div>
    </section>
  )
}
