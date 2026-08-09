"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ShoppingCart, Star, StarHalf, ChevronLeft } from "lucide-react"
import ModalAlerta from "./modal-alerta"

interface ProductoDetalleProps {
  producto: any
  relacionados: any[]
  resenas: any[]
}

export default function ProductoDetalle({ producto, relacionados, resenas: reseniasIniciales }: ProductoDetalleProps) {
  const router = useRouter()
  const [cantidad, setCantidad] = useState(1)
  const [resenas, setResenas] = useState(reseniasIniciales || [])
  const [usuario, setUsuario] = useState<any>(null)
  const [formularioAbierto, setFormularioAbierto] = useState(false)
  const [nuevaResena, setNuevaResena] = useState({
    calificacion: 5,
    comentario: ""
  })
  const [cargandoResena, setCargandoResena] = useState(false)

  // Estados para modales
  const [modalAlerta, setModalAlerta] = useState({
    isOpen: false,
    type: "info" as "error" | "success" | "warning" | "info",
    title: "",
    message: "",
    buttons: [] as any[]
  })

  useEffect(() => {
    // Cargar datos del usuario
    const cargarUsuario = async () => {
      try {
        const res = await fetch("/api/usuario/perfil")
        if (res.ok) {
          const data = await res.json()
          setUsuario(data)
        }
      } catch (error) {
        console.error("Error cargando usuario:", error)
      }
    }
    cargarUsuario()
  }, [])

  const agregarAlCarrito = async () => {
    try {
      const res = await fetch("/api/carrito/agregar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productoId: producto.id, cantidad }),
      })

      if (res.ok) {
        // Emitir evento para actualizar contador del navbar
        window.dispatchEvent(new CustomEvent("carritoActualizado", { detail: { cantidad } }))
        alert("Producto agregado al carrito")
        setCantidad(1)
      } else {
        const data = await res.json()
        alert(data.error || "Error al agregar al carrito")
      }
    } catch (error) {
      alert("Error de conexión")
    }
  }

  const enviarResena = async () => {
    if (!nuevaResena.comentario.trim()) {
      setModalAlerta({
        isOpen: true,
        type: "warning",
        title: "Campo vacío",
        message: "Por favor escribe un comentario antes de enviar tu reseña.",
        buttons: [
          {
            label: "Entendido",
            onClick: () => setModalAlerta({ ...modalAlerta, isOpen: false }),
            variant: "primary"
          }
        ]
      })
      return
    }

    if (!usuario) {
      // Modal para usuario no autenticado
      setModalAlerta({
        isOpen: true,
        type: "warning",
        title: "Debes iniciar sesión",
        message: "Para dejar una reseña es necesario que estés logueado. ¿Deseas ir al login ahora?",
        buttons: [
          {
            label: "Ir al Login",
            onClick: () => {
              setModalAlerta({ ...modalAlerta, isOpen: false })
              router.push(`/auth/login?redirect=${encodeURIComponent(`/producto/${producto.id}`)}`)
            },
            variant: "primary"
          },
          {
            label: "Cancelar",
            onClick: () => setModalAlerta({ ...modalAlerta, isOpen: false }),
            variant: "secondary"
          }
        ]
      })
      return
    }

    try {
      setCargandoResena(true)
      const res = await fetch("/api/resenas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productoId: producto.id,
          calificacion: nuevaResena.calificacion,
          comentario: nuevaResena.comentario
        })
      })

      if (res.status === 401) {
        // Si no está autenticado, mostrar modal
        setModalAlerta({
          isOpen: true,
          type: "warning",
          title: "Sesión expirada",
          message: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
          buttons: [
            {
              label: "Ir al Login",
              onClick: () => {
                setModalAlerta({ ...modalAlerta, isOpen: false })
                router.push(`/auth/login?redirect=${encodeURIComponent(`/producto/${producto.id}`)}`)
              },
              variant: "primary"
            },
            {
              label: "Cancelar",
              onClick: () => setModalAlerta({ ...modalAlerta, isOpen: false }),
              variant: "secondary"
            }
          ]
        })
        return
      }

      if (res.ok) {
        const data = await res.json()
        setResenas([data.resena, ...resenas])
        setNuevaResena({ calificacion: 5, comentario: "" })
        setFormularioAbierto(false)
        setCargandoResena(false)
        
        // Modal de éxito
        setModalAlerta({
          isOpen: true,
          type: "success",
          title: "¡Reseña enviada!",
          message: "Tu reseña ha sido registrada exitosamente. Pendiente de aprobación del administrador para ser publicada.",
          buttons: [
            {
              label: "Perfecto",
              onClick: () => setModalAlerta({ ...modalAlerta, isOpen: false }),
              variant: "primary"
            }
          ]
        })
      } else {
        const error = await res.json()
        
        // Verificar si es error de reseña duplicada
        if (error.error?.includes("Ya has reseñado") || error.error?.includes("una reseña por producto")) {
          setModalAlerta({
            isOpen: true,
            type: "warning",
            title: "Reseña ya registrada",
            message: "Ya has reseñado este producto anteriormente. Solo se permite una reseña por producto. Tu reseña anterior está siendo evaluada.",
            buttons: [
              {
                label: "Entendido",
                onClick: () => setModalAlerta({ ...modalAlerta, isOpen: false }),
                variant: "primary"
              }
            ]
          })
        } else {
          setModalAlerta({
            isOpen: true,
            type: "error",
            title: "Error al enviar reseña",
            message: error.error || "Ocurrió un error al enviar tu reseña. Intenta de nuevo.",
            buttons: [
              {
                label: "Entendido",
                onClick: () => setModalAlerta({ ...modalAlerta, isOpen: false }),
                variant: "primary"
              }
            ]
          })
        }
      }
    } catch (error) {
      setCargandoResena(false)
      setModalAlerta({
        isOpen: true,
        type: "error",
        title: "Error de conexión",
        message: "No pudimos conectar con el servidor. Por favor, intenta de nuevo.",
        buttons: [
          {
            label: "Entendido",
            onClick: () => setModalAlerta({ ...modalAlerta, isOpen: false }),
            variant: "primary"
          }
        ]
      })
    }
  }

  const calcularPromedioCalificacion = () => {
    if (resenas.length === 0) return 0
    const suma = resenas.reduce((acc, r) => acc + r.calificacion, 0)
    return suma / resenas.length
  }

  const renderEstrellas = (calificacion: number) => {
    const estrellas = []
    const fullStars = Math.floor(calificacion)
    const hasHalfStar = calificacion % 1 !== 0

    for (let i = 0; i < fullStars; i++) {
      estrellas.push(<Star key={`full-${i}`} className="w-5 h-5 fill-yellow-400 text-yellow-400" />)
    }

    if (hasHalfStar) {
      estrellas.push(<StarHalf key="half" className="w-5 h-5 fill-yellow-400 text-yellow-400" />)
    }

    const emptyStars = 5 - Math.ceil(calificacion)
    for (let i = 0; i < emptyStars; i++) {
      estrellas.push(<Star key={`empty-${i}`} className="w-5 h-5 text-gray-300" />)
    }

    return estrellas
  }

  const promedio = calcularPromedioCalificacion()

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href="/productos" className="text-[#E91E63] hover:underline flex items-center gap-2">
          <ChevronLeft className="w-4 h-4" />
          Volver a Productos
        </Link>
      </div>

      {/* Detalle del producto */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
          {/* Imagen */}
          <div>
            <img
              src={producto.imagen || "/placeholder.svg?height=500&width=500"}
              alt={producto.nombre}
              className="w-full h-auto rounded-lg"
            />
          </div>

          {/* Información */}
          <div>
            <span className="badge bg-primary">{producto.categoria_nombre}</span>
            <h1 className="text-4xl font-bold mt-4 mb-4">{producto.nombre}</h1>

            {/* Calificación */}
            {resenas.length > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex">{renderEstrellas(promedio)}</div>
                <span className="text-gray-600">
                  {promedio.toFixed(1)} ({resenas.length} reseñas)
                </span>
              </div>
            )}

            <p className="text-gray-600 text-lg mb-6">{producto.descripcion}</p>

            {/* Código de barras (solo si existe) */}
            {producto.codigoBarras && (
              <div className="mb-6 flex items-center gap-2">
                <span className="badge bg-gray-100 text-gray-700">
                  Código: <span className="font-mono font-semibold tracking-widest">{producto.codigoBarras}</span>
                </span>
              </div>
            )}

            {/* Precio */}
            <div className="mb-6">
              <span className="text-5xl font-bold text-[#E91E63]">S/ {Number(producto.precio).toFixed(2)}</span>
            </div>

            {/* Stock */}
            <div className="mb-6">
              {producto.stock > 0 ? (
                <div>
                  <span className="badge bg-success">Disponible</span>
                  <p className="text-sm text-gray-600 mt-2">Stock: {producto.stock} unidades</p>
                </div>
              ) : (
                <span className="badge bg-danger">Agotado</span>
              )}
            </div>

            {/* Cantidad */}
            {producto.stock > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Cantidad:</label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                    className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    -
                  </button>
                  <span className="text-xl font-bold">{cantidad}</span>
                  <button
                    onClick={() => setCantidad(Math.min(producto.stock, cantidad + 1))}
                    className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Botón agregar al carrito */}
            <button
              onClick={agregarAlCarrito}
              disabled={producto.stock === 0}
              className="w-full btn-primary py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              <ShoppingCart className="w-6 h-6" />
              Agregar al Carrito
            </button>
          </div>
        </div>
      </div>

      {/* Formulario de Reseñas */}
      <div className="mt-12 bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-3xl font-bold mb-6">Opiniones de Clientes</h2>
        
        {/* Estadísticas de reseñas */}
        {resenas.length > 0 && (
          <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-8">
              <div className="text-center">
                <div className="text-5xl font-bold text-yellow-500">{promedio.toFixed(1)}</div>
                <div className="flex justify-center mt-2">{renderEstrellas(promedio)}</div>
                <p className="text-gray-600 text-sm mt-2">{resenas.length} reseñas</p>
              </div>
            </div>
          </div>
        )}

        {/* Formulario para usuario logueado */}
        {usuario ? (
          <div className="mb-8">
            {!formularioAbierto ? (
              <button
                onClick={() => setFormularioAbierto(true)}
                className="w-full px-6 py-3 bg-[#E91E63] text-white rounded-lg hover:bg-[#C8D800] hover:text-[#2B2E4A] transition-colors font-semibold"
              >
                ✍️ Dejar una Reseña
              </button>
            ) : (
              <div className="border-2 border-gray-200 rounded-lg p-6 bg-gray-50">
                <h3 className="font-bold text-lg mb-4">Tu Opinión</h3>
                
                {/* Calificación */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-3">Calificación</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setNuevaResena({ ...nuevaResena, calificacion: star })}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-8 h-8 cursor-pointer ${
                            star <= nuevaResena.calificacion
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comentario */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2">Tu Comentario</label>
                  <textarea
                    value={nuevaResena.comentario}
                    onChange={(e) => setNuevaResena({ ...nuevaResena, comentario: e.target.value })}
                    placeholder="Comparte tu experiencia con este producto..."
                    maxLength={500}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8D800]"
                  />
                  <p className="text-xs text-gray-500 mt-1">{nuevaResena.comentario.length}/500</p>
                </div>

                {/* Botones */}
                <div className="flex gap-3">
                  <button
                    onClick={enviarResena}
                    disabled={!nuevaResena.comentario.trim()}
                    className="flex-1 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-semibold"
                  >
                    Publicar Reseña
                  </button>
                  <button
                    onClick={() => {
                      setFormularioAbierto(false)
                      setNuevaResena({ calificacion: 5, comentario: "" })
                    }}
                    className="flex-1 px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-semibold"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mb-8 p-6 bg-yellow-50 border-l-4 border-yellow-400 rounded">
            <p className="text-gray-700">
              <Link href="/auth/login" className="text-[#E91E63] hover:underline font-semibold">
                Inicia sesión
              </Link>
              {" "}para dejar una reseña y compartir tu experiencia.
            </p>
          </div>
        )}

        {/* Lista de reseñas */}
        <div className="space-y-4">
          {resenas.length > 0 ? (
            resenas.map((resena) => (
              <div key={resena.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex gap-3 items-center">
                      <div className="flex">{renderEstrellas(resena.calificacion)}</div>
                      <p className="font-bold text-gray-900">
                        {resena.nombres || "Usuario"} {resena.apellidoPaterno || ""}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(resena.fecha).toLocaleDateString("es-PE", {
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                      })}
                    </p>
                  </div>
                </div>
                <p className="text-gray-700 leading-relaxed">{resena.comentario}</p>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No hay reseñas aún. ¡Sé el primero en dejar una!</p>
            </div>
          )}
        </div>
      </div>

      {/* Productos relacionados */}
      {relacionados.length > 0 && (
        <div className="mt-12">
          <h2 className="text-3xl font-bold mb-6">Productos Relacionados</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relacionados.map((prod) => (
              <Link key={prod.id} href={`/producto/${prod.id}`} className="product-card bg-white">
                <img
                  src={prod.imagen || "/placeholder.svg?height=250&width=250"}
                  alt={prod.nombre}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-bold text-lg hover:text-[#C8D800] transition-colors">{prod.nombre}</h3>
                  <p className="text-2xl font-bold text-[#E91E63] mt-2">S/ {Number(prod.precio).toFixed(2)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Alerta */}
      <ModalAlerta
        isOpen={modalAlerta.isOpen}
        type={modalAlerta.type}
        title={modalAlerta.title}
        message={modalAlerta.message}
        buttons={modalAlerta.buttons}
        onClose={() => setModalAlerta({ ...modalAlerta, isOpen: false })}
      />
    </div>
  )
}
