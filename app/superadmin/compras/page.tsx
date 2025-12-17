"use client"

import { useState, useEffect } from "react"
import { Eye, ChevronRight, AlertCircle, CheckCircle } from "lucide-react"

interface Compra {
  id: number
  usuarioId: number
  usuario: {
    nombres: string
    apellidoPaterno: string
    correo?: string
  }
  total: number
  estado: string
  fecha: string
  fechaCompra: string
  subtotal: number
  igv: number
  igvActivo: boolean
  costoEnvio: number
  envioActivo: boolean
  metodoPago: string
  direccionEntrega: string
  numeroSeguimiento: string
  motivoRechazo: string
  detalles: any[]
}

const TRANSICIONES_PERMITIDAS: { [key: string]: string[] } = {
  PENDIENTE: ["CONFIRMADA", "CANCELADA"],
  CONFIRMADA: ["PREPARANDO", "CANCELADA"],
  PREPARANDO: ["DESPACHADO", "CANCELADA"],
  DESPACHADO: ["ENVIADA"],
  ENVIADA: ["ENTREGADA"],
  ENTREGADA: [],
  CANCELADA: [],
}

const ETIQUETA_ESTADO: { [key: string]: string } = {
  PENDIENTE: "Pendiente",
  CONFIRMADA: "Confirmada",
  PREPARANDO: "Preparando",
  DESPACHADO: "Despachado",
  ENVIADA: "Enviada",
  ENTREGADA: "Entregada",
  CANCELADA: "Cancelada",
}

export default function SuperAdminComprasPage() {
  const [compras, setCompras] = useState<Compra[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState("todos")
  const [selectedCompra, setSelectedCompra] = useState<Compra | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [motivoRechazo, setMotivoRechazo] = useState("")
  const [actualizando, setActualizando] = useState(false)
  const [mensaje, setMensaje] = useState("")
  const [config, setConfig] = useState<any>(null)

  useEffect(() => {
    cargarConfiguracion()
    cargarCompras()
  }, [filtroEstado])

  const cargarConfiguracion = async () => {
    try {
      const res = await fetch("/api/configuracion")
      if (res.ok) {
        const data = await res.json()
        setConfig(data)
      }
    } catch (error) {
      console.error("Error al cargar configuración:", error)
    }
  }

  const cargarCompras = async () => {
    try {
      setLoading(true)
      const url = filtroEstado === "todos" ? "/api/admin/compras" : `/api/admin/compras?estado=${filtroEstado}`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setCompras(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Error:", error)
      setCompras([])
    } finally {
      setLoading(false)
    }
  }

  const abrirModal = async (compra: Compra) => {
    try {
      // Cargar detalles completos de la compra
      const res = await fetch(`/api/admin/compras/${compra.id}`)
      if (res.ok) {
        const compraCompleta = await res.json()
        setSelectedCompra(compraCompleta)

        // Cargar comprobante si existe
        const resComprobante = await fetch(`/api/compras/comprobante?compraId=${compra.id}`)
        if (resComprobante.ok) {
          const dataComprobante = await resComprobante.json()
          if (dataComprobante) {
            // Guardar comprobante en el selectedCompra
            setSelectedCompra((prev) => prev ? { ...prev, comprobante: dataComprobante } : null)
          }
        }
      } else {
        setSelectedCompra(compra)
      }
    } catch (error) {
      console.error("Error:", error)
      setSelectedCompra(compra)
    }
    setMotivoRechazo("")
    setMensaje("")
    setShowModal(true)
  }

  const cerrarModal = () => {
    setShowModal(false)
    setMotivoRechazo("")
    setMensaje("")
    setTimeout(() => setSelectedCompra(null), 300)
  }

  const cambiarEstado = async (nuevoEstado: string) => {
    if (!selectedCompra) return

    // Validar transición
    if (!TRANSICIONES_PERMITIDAS[selectedCompra.estado]?.includes(nuevoEstado)) {
      setMensaje(`❌ Transición no permitida: ${selectedCompra.estado} → ${nuevoEstado}`)
      return
    }

    // Validar motivo de cancelación
    if (nuevoEstado === "CANCELADA" && !motivoRechazo.trim()) {
      setMensaje("❌ El motivo de cancelación es obligatorio")
      return
    }

    try {
      setActualizando(true)
      const res = await fetch(`/api/admin/compras/${selectedCompra.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado: nuevoEstado,
          motivoRechazo: nuevoEstado === "CANCELADA" ? motivoRechazo : undefined,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setMensaje("✓ Estado actualizado exitosamente")
        setSelectedCompra({ ...selectedCompra, estado: nuevoEstado })
        setTimeout(() => {
          cargarCompras()
          cerrarModal()
        }, 1500)
      } else {
        setMensaje(`❌ ${data.error}`)
      }
    } catch (error) {
      setMensaje("❌ Error al actualizar estado")
      console.error(error)
    } finally {
      setActualizando(false)
    }
  }

  const getEstadoColor = (estado: string) => {
    const colores: { [key: string]: string } = {
      PENDIENTE: "bg-yellow-100 text-yellow-800 border-yellow-300",
      CONFIRMADA: "bg-blue-100 text-blue-800 border-blue-300",
      PREPARANDO: "bg-orange-100 text-orange-800 border-orange-300",
      DESPACHADO: "bg-purple-100 text-purple-800 border-purple-300",
      ENVIADA: "bg-indigo-100 text-indigo-800 border-indigo-300",
      ENTREGADA: "bg-green-100 text-green-800 border-green-300",
      CANCELADA: "bg-red-100 text-red-800 border-red-300",
    }
    return colores[estado] || "bg-gray-100 text-gray-800"
  }

  const transicionesDisponibles = selectedCompra
    ? TRANSICIONES_PERMITIDAS[selectedCompra.estado] || []
    : []

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <h1 className="text-xl md:text-2xl font-bold mb-6">Gestión de Compras</h1>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Encabezado y filtros */}
      <div className="space-y-4">
        <h1 className="text-2xl md:text-3xl font-bold">Gestión de Compras</h1>
        <div className="flex flex-wrap gap-2">
          {["todos", "PENDIENTE", "CONFIRMADA", "PREPARANDO", "DESPACHADO", "ENVIADA", "ENTREGADA", "CANCELADA"].map((estado) => (
            <button
              key={estado}
              onClick={() => setFiltroEstado(estado)}
              className={`px-3 md:px-4 py-2 rounded-lg font-semibold transition-all text-xs md:text-sm ${filtroEstado === estado
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
            >
              {estado === "todos" ? "Todas" : ETIQUETA_ESTADO[estado]}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de compras */}
      <div className="bg-white rounded-lg shadow-lg overflow-x-auto">
        <table className="w-full min-w-max text-sm md:text-base">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-gray-700">Pedido</th>
                <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-gray-700">Cliente</th>
                <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-gray-700">Total</th>
                <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-gray-700">Estado</th>
                <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-gray-700">Fecha</th>
                <th className="px-3 md:px-6 py-3 md:py-4 text-center text-xs md:text-sm font-semibold text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {compras.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 md:px-6 py-8 md:py-12 text-center text-gray-500 text-sm md:text-base">
                    No hay compras para mostrar
                  </td>
                </tr>
              ) : (
                compras.map((compra) => (
                  <tr key={compra.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold text-gray-900">#{compra.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {compra.usuario?.nombres} {compra.usuario?.apellidoPaterno}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">
                      S/ {(Number(compra.total) || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getEstadoColor(compra.estado)}`}>
                        {ETIQUETA_ESTADO[compra.estado]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(compra.fechaCompra).toLocaleDateString("es-PE")}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => abrirModal(compra)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
                      >
                        <Eye className="w-4 h-4" />
                        Detalles
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
      </div>

      {/* Modal de detalles */}
      {showModal && selectedCompra && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 border-b">
              <h2 className="text-2xl font-bold">Pedido #{selectedCompra.id}</h2>
              <p className="text-blue-100 mt-1">
                {new Date(selectedCompra.fechaCompra).toLocaleDateString("es-PE", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Estado actual */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-semibold">Estado Actual</p>
                    <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold border mt-2 ${getEstadoColor(selectedCompra.estado)}`}>
                      {ETIQUETA_ESTADO[selectedCompra.estado]}
                    </span>
                  </div>
                  {selectedCompra.motivoRechazo && (
                    <div className="text-right">
                      <p className="text-sm text-gray-600 font-semibold">Motivo de rechazo</p>
                      <p className="text-red-600 mt-2">{selectedCompra.motivoRechazo}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Información del cliente */}
              <div>
                <h3 className="text-lg font-bold mb-3 text-gray-800">Información del Cliente</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Nombre</p>
                    <p className="font-semibold text-gray-900">
                      {selectedCompra.usuario?.nombres} {selectedCompra.usuario?.apellidoPaterno}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Correo</p>
                    <p className="font-semibold text-gray-900">{selectedCompra.usuario?.correo || "N/A"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Dirección de Entrega</p>
                    <p className="font-semibold text-gray-900">{selectedCompra.direccionEntrega}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Método de Pago</p>
                    <p className="font-semibold text-gray-900 capitalize">{selectedCompra.metodoPago?.replace("_", " ")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Número de Seguimiento</p>
                    <p className="font-semibold text-gray-900">{selectedCompra.numeroSeguimiento || "N/A"}</p>
                  </div>
                </div>

                {/* Comprobante de pago si existe */}
                {(selectedCompra as any).comprobante && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border-2 border-[#667eea]">
                    <p className="text-sm font-bold text-gray-700 mb-3">
                      Comprobante de Pago ({(selectedCompra as any).comprobante.metodo_pago})
                    </p>
                    <img
                      src={(selectedCompra as any).comprobante.archivo_url}
                      alt="Comprobante de pago"
                      className="max-w-sm max-h-64 rounded-lg border border-gray-300 cursor-pointer"
                      onClick={() => window.open((selectedCompra as any).comprobante.archivo_url, "_blank")}
                    />
                    <p className="text-xs text-gray-600 mt-2">Haz clic para ver en tamaño completo</p>
                  </div>
                )}
              </div>

              {/* Productos */}
              <div>
                <h3 className="text-lg font-bold mb-3 text-gray-800">Productos</h3>
                <div className="space-y-2">
                  {selectedCompra.detalles?.length > 0 ? (
                    selectedCompra.detalles.map((detalle: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-semibold text-gray-900">{detalle.nombre || "Producto"}</p>
                          <p className="text-sm text-gray-600">
                            {detalle.cantidad} x S/ {(Number(detalle.precioUnitario) || 0).toFixed(2)}
                          </p>
                        </div>
                        <p className="font-bold text-blue-600">S/ {(Number(detalle.subtotal) || 0).toFixed(2)}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No hay detalles disponibles</p>
                  )}
                </div>
              </div>

              {/* Resumen */}
              <div className="bg-gray-50 p-4 rounded-lg border">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-semibold">S/ {(Number(selectedCompra.subtotal) || 0).toFixed(2)}</span>
                  </div>
                  {selectedCompra.igvActivo && config?.aplicarIGV && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">IGV (18%):</span>
                      <span className="font-semibold">S/ {(Number(selectedCompra.igv) || 0).toFixed(2)}</span>
                    </div>
                  )}
                  {selectedCompra.envioActivo && config?.aplicarEnvio && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Envío:</span>
                      <span className="font-semibold">S/ {(Number(selectedCompra.costoEnvio) || 0).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t pt-2 text-blue-600">
                    <span>Total:</span>
                    <span>S/ {(Number(selectedCompra.total) || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Mensaje de estado */}
              {mensaje && (
                <div className={`p-4 rounded-lg flex items-center gap-2 ${mensaje.includes("✓")
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                  }`}>
                  {mensaje.includes("✓") ? (
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  )}
                  {mensaje}
                </div>
              )}

              {/* Acciones disponibles */}
              {transicionesDisponibles.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold mb-3 text-gray-800">Acciones Disponibles</h3>
                  <div className="space-y-2">
                    {transicionesDisponibles.map((nuevoEstado) => (
                      <div key={nuevoEstado}>
                        {nuevoEstado === "CANCELADA" ? (
                          <div className="space-y-2">
                            <textarea
                              placeholder="Motivo del rechazo (obligatorio)"
                              value={motivoRechazo}
                              onChange={(e) => setMotivoRechazo(e.target.value)}
                              className="w-full p-3 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                              rows={3}
                            />
                            <button
                              onClick={() => cambiarEstado(nuevoEstado)}
                              disabled={actualizando || !motivoRechazo.trim()}
                              className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all"
                            >
                              {actualizando ? "Procesando..." : "Rechazar Compra"}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => cambiarEstado(nuevoEstado)}
                            disabled={actualizando}
                            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all flex items-center justify-between"
                          >
                            <span>Pasar a {ETIQUETA_ESTADO[nuevoEstado]}</span>
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Estados finales */}
              {(selectedCompra.estado === "ENTREGADA" || selectedCompra.estado === "CANCELADA") && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    ℹ️ Esta compra está en un estado final y no puede ser modificada.
                  </p>
                </div>
              )}

              {/* Botón de cierre */}
              <button
                onClick={cerrarModal}
                className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
