"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Download, Send, Search, Plus, Trash2 } from "lucide-react"
import ModalAlerta from "@/components/modal-alerta"
import { useOCR } from "@/hooks/use-ocr"

interface CotizacionItem {
  id?: number
  nombre_producto: string
  cantidad: number
  precio_unitario: number
  subtotal: number
  encontrado_en_bd: boolean
  producto_id?: number
}

interface Cotizacion {
  id: number
  titulo: string
  descripcion: string
  nombres: string
  correo: string
  estado: string
  fecha_creacion: string
  cantidad_items: number
  total_temporal: number
  pdf_url?: string
  archivo_url?: string
  tipo_archivo?: string
}

export default function CotizacionesPage() {
  const router = useRouter()
  const { procesarImagen, loading: ocrLoading, error: ocrError, setError: setOcrError } = useOCR()
  const [usuario, setUsuario] = useState<any>(null)
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([])
  const [cotizacionActual, setCotizacionActual] = useState<Cotizacion | null>(null)
  const [items, setItems] = useState<CotizacionItem[]>([])
  const [loading, setLoading] = useState(false)
  const [busqueda, setBusqueda] = useState("")
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: "",
    cantidad: 1,
    precio: 0,
  })
  const [observaciones, setObservaciones] = useState("")
  const [buscandoProducto, setBuscandoProducto] = useState(false)
  const [modalAlerta, setModalAlerta] = useState({
    isOpen: false,
    type: "info" as "error" | "success" | "warning" | "info",
    title: "",
    message: "",
    buttons: [] as any[],
  })
  const [productosEncontrados, setProductosEncontrados] = useState<any[]>([])
  const [productosNoEncontrados, setProductosNoEncontrados] = useState<any[]>([])
  const [analizandoImagen, setAnalizandoImagen] = useState(false)
  const [mostrarProductosExtraidos, setMostrarProductosExtraidos] = useState(false)
  const [cantidadesProductos, setCantidadesProductos] = useState<{ [key: number]: number }>({})

  // Validar SuperAdmin
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!data?.usuario?.roles?.some((r: any) => r.nombre === "ROLE_SUPER_ADMIN")) {
          router.push("/acceso-denegado")
        } else {
          setUsuario(data.usuario)
          cargarCotizaciones()
        }
      })
      .catch(() => router.push("/auth/login"))
  }, [])

  const cargarCotizaciones = async () => {
    try {
      const res = await fetch(`/api/cotizaciones/listar?estado=PENDIENTE,EN_COTIZACION&rol=SUPERADMIN`)
      const data = await res.json()
      if (data.success) {
        setCotizaciones(data.cotizaciones)
      }
    } catch (error) {
      console.error("Error cargando cotizaciones:", error)
    }
  }

  const seleccionarCotizacion = async (cot: Cotizacion) => {
    setCotizacionActual(cot)
    try {
      const res = await fetch(`/api/cotizaciones/${cot.id}/agregar-items`)
      const data = await res.json()
      if (data.success) {
        setItems(data.items)
      } else {
        setItems([])
      }
    } catch (error) {
      setItems([])
    }
    
    // Analizar imagen automáticamente si existe
    if (cot.archivo_url) {
      analizarImagenAutomaticamente(cot.archivo_url, cot.id)
    }
  }

  const analizarImagenAutomaticamente = async (archivoUrl: string, cotizacionId: number) => {
    setAnalizandoImagen(true)
    setOcrError(null)
    try {
      // Descargar imagen
      const response = await fetch(archivoUrl)
      if (!response.ok) throw new Error('Error descargando imagen')
      
      const blob = await response.blob()
      const archivo = new File([blob], 'imagen.jpg', { type: blob.type })

      // Procesar con OCR
      const resultado = await procesarImagen(archivo)
      
      if (!resultado) {
        throw new Error('Error procesando imagen')
      }

      setProductosEncontrados(resultado.productos.productosEncontrados)
      setProductosNoEncontrados(resultado.productos.productosNoEncontrados)
      setMostrarProductosExtraidos(true)

      const totalEncontrados = resultado.productos.totalEncontrados
      const totalExtraidos = resultado.productos.totalExtraidos

      setModalAlerta({
        isOpen: true,
        type: "success",
        title: "Análisis completado",
        message: `Extraídos: ${totalExtraidos} productos\nEncontrados: ${totalEncontrados} coincidencias`,
        buttons: [
          { label: "OK", onClick: () => setModalAlerta({ ...modalAlerta, isOpen: false }) }
        ],
      })
    } catch (error) {
      console.error('Error analizando imagen:', error)
      setModalAlerta({
        isOpen: true,
        type: "error",
        title: "Error",
        message: ocrError || 'Error al analizar la imagen',
        buttons: [
          { label: "OK", onClick: () => setModalAlerta({ ...modalAlerta, isOpen: false }) }
        ],
      })
    } finally {
      setAnalizandoImagen(false)
    }
  }

  const buscarProducto = async () => {
    if (nuevoProducto.nombre.length < 2) return

    setBuscandoProducto(true)
    try {
      const res = await fetch(
        `/api/cotizaciones/${cotizacionActual?.id}/buscar-producto?nombre=${encodeURIComponent(
          nuevoProducto.nombre
        )}`
      )
      const data = await res.json()

      if (data.encontrado && data.productos.length > 0) {
        // Auto-llenar con primer resultado
        setNuevoProducto({
          ...nuevoProducto,
          precio: data.productos[0].precio,
        })
        setModalAlerta({
          isOpen: true,
          type: "success",
          title: "Producto encontrado",
          message: `Se encontró: ${data.productos[0].nombre} - S/. ${data.productos[0].precio}`,
          buttons: [
            {
              label: "Usar este precio",
              onClick: () => setModalAlerta({ ...modalAlerta, isOpen: false }),
            },
          ],
        })
      } else {
        setModalAlerta({
          isOpen: true,
          type: "warning",
          title: "No encontrado",
          message: "El producto no está en el catálogo. Ingresa el precio manualmente.",
          buttons: [{ label: "OK", onClick: () => setModalAlerta({ ...modalAlerta, isOpen: false }) }],
        })
      }
    } catch (error) {
      console.error("Error buscando producto:", error)
    } finally {
      setBuscandoProducto(false)
    }
  }

  const agregarItemDesdeEncontrado = (producto: any, idx: number) => {
    const cantidad = cantidadesProductos[idx] || 1
    const nuevoItem: CotizacionItem = {
      nombre_producto: producto.nombre_producto,
      cantidad: cantidad,
      precio_unitario: producto.precio_unitario,
      subtotal: cantidad * producto.precio_unitario,
      encontrado_en_bd: true,
      producto_id: producto.producto_id,
    }
    setItems([...items, nuevoItem])
    setNuevoProducto({ nombre: "", cantidad: 1, precio: 0 })
    // Limpiar cantidad después de agregar
    setCantidadesProductos({ ...cantidadesProductos, [idx]: 1 })
  }

  const agregarItemDesdeNoEncontrado = (nombre: string) => {
    setNuevoProducto({
      nombre: nombre,
      cantidad: 1,
      precio: 0,
    })
    // Auto-foco en buscar para que el admin complete el precio
  }

  const agregarItem = () => {
    if (!nuevoProducto.nombre || nuevoProducto.cantidad <= 0 || nuevoProducto.precio <= 0) {
      setModalAlerta({
        isOpen: true,
        type: "error",
        title: "Validación",
        message: "Completa todos los campos correctamente",
        buttons: [{ label: "OK", onClick: () => setModalAlerta({ ...modalAlerta, isOpen: false }) }],
      })
      return
    }

    const nuevoItem: CotizacionItem = {
      nombre_producto: nuevoProducto.nombre,
      cantidad: nuevoProducto.cantidad,
      precio_unitario: nuevoProducto.precio,
      subtotal: nuevoProducto.cantidad * nuevoProducto.precio,
      encontrado_en_bd: false,
    }

    setItems([...items, nuevoItem])
    setNuevoProducto({ nombre: "", cantidad: 1, precio: 0 })
  }

  const eliminarItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const calcularTotal = () => {
    return items.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0)
  }

  const guardarYGenerarPDF = async () => {
    if (!cotizacionActual || items.length === 0) {
      setModalAlerta({
        isOpen: true,
        type: "error",
        title: "Error",
        message: "Debe tener al menos un producto en la cotización",
        buttons: [{ label: "OK", onClick: () => setModalAlerta({ ...modalAlerta, isOpen: false }) }],
      })
      return
    }

    setLoading(true)
    try {
      // 1. Guardar items
      await fetch(`/api/cotizaciones/${cotizacionActual.id}/agregar-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(items),
      })

      // 2. Generar PDF
      const pdfRes = await fetch(`/api/cotizaciones/${cotizacionActual.id}/generar-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ observaciones }),
      })

      const pdfData = await pdfRes.json()

      if (pdfData.success) {
        setModalAlerta({
          isOpen: true,
          type: "success",
          title: "¡PDF Generado!",
          message: `Cotización generada. Total: S/. ${pdfData.total.toFixed(2)}`,
          buttons: [
            {
              label: "Ver cotizaciones",
              onClick: () => {
                setModalAlerta({ ...modalAlerta, isOpen: false })
                setCotizacionActual(null)
                cargarCotizaciones()
              },
            },
          ],
        })
      }
    } catch (error) {
      setModalAlerta({
        isOpen: true,
        type: "error",
        title: "Error",
        message: "Error al generar el PDF",
        buttons: [{ label: "OK", onClick: () => setModalAlerta({ ...modalAlerta, isOpen: false }) }],
      })
    } finally {
      setLoading(false)
    }
  }

  if (!usuario || !usuario.roles?.some((r: any) => r.nombre === "ROLE_SUPER_ADMIN")) {
    return <div className="p-4">Cargando...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Cotizaciones de Listas Escolares</h1>
          <a
            href="/superadmin/cotizaciones/historial"
            className="px-4 py-2 bg-[#667eea] text-white rounded-lg hover:bg-[#5568d3] font-semibold transition-colors"
          >
            📋 Ver Historial
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* PANEL IZQUIERDO: LISTA DE COTIZACIONES */}
          <div>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">Solicitudes Pendientes</h2>

              {cotizaciones.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No hay cotizaciones pendientes</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {cotizaciones.map((cot) => (
                    <button
                      key={cot.id}
                      onClick={() => seleccionarCotizacion(cot)}
                      className={`w-full text-left p-4 rounded-lg transition-colors ${
                        cotizacionActual?.id === cot.id
                          ? "bg-[#667eea] text-white"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-900"
                      }`}
                    >
                      <p className="font-semibold">{cot.titulo}</p>
                      <p className="text-sm opacity-80">{cot.nombres}</p>
                      <p className="text-xs opacity-75 mt-1">
                        {new Date(cot.fecha_creacion).toLocaleDateString("es-PE")}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* PANEL DERECHO: COTIZACIÓN */}
          {cotizacionActual ? (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">{cotizacionActual.titulo}</h2>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600">Cliente</p>
                  <p className="font-semibold">{cotizacionActual.nombres}</p>
                  <p className="text-sm text-gray-600">{cotizacionActual.correo}</p>
                </div>
              </div>

              {/* AGREGAR PRODUCTOS */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-bold mb-4">Agregar Productos</h3>

                {/* MOSTRAR PRODUCTOS ENCONTRADOS AUTOMÁTICAMENTE */}
                {mostrarProductosExtraidos && (productosEncontrados.length > 0 || productosNoEncontrados.length > 0) && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-3">✨ Productos Detectados de la Imagen</h4>
                    
                    {/* Encontrados */}
                    {productosEncontrados.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-semibold text-green-700 mb-2">✓ Encontrados en catálogo ({productosEncontrados.length}):</p>
                        <div className="space-y-2">
                          {productosEncontrados.map((p: any, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 bg-white p-2 rounded border border-green-200 text-sm"
                            >
                              <div className="flex-1">
                                <p className="font-medium">{p.nombre_producto}</p>
                                <p className="text-xs text-gray-600">Extraído: "{p.nombreExtraido}" ({p.similitud}% similitud)</p>
                                <p className="text-xs text-green-700">Precio: S/. {p.precio_unitario}</p>
                              </div>
                              <input
                                type="number"
                                min="1"
                                value={cantidadesProductos[idx] || 1}
                                onChange={(e) =>
                                  setCantidadesProductos({
                                    ...cantidadesProductos,
                                    [idx]: parseInt(e.target.value) || 1,
                                  })
                                }
                                className="w-16 px-2 py-1 border rounded text-xs"
                              />
                              <button
                                onClick={() => agregarItemDesdeEncontrado(p, idx)}
                                className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 whitespace-nowrap"
                              >
                                Agregar
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* No encontrados */}
                    {productosNoEncontrados.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-orange-700 mb-2">⚠ No encontrados ({productosNoEncontrados.length}):</p>
                        <div className="space-y-2">
                          {productosNoEncontrados.map((p: any, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between bg-white p-2 rounded border border-orange-200 text-sm"
                            >
                              <p className="font-medium">{p.nombre_producto}</p>
                              <button
                                onClick={() => agregarItemDesdeNoEncontrado(p.nombre_producto)}
                                className="px-3 py-1 bg-orange-500 text-white rounded text-xs hover:bg-orange-600 whitespace-nowrap"
                              >
                                Completar precio
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* FORMULARIO MANUAL */}

                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nombre del producto"
                      value={nuevoProducto.nombre}
                      onChange={(e) => setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })}
                      className="flex-1 px-3 py-2 border rounded-lg text-sm"
                    />
                    <button
                      onClick={buscarProducto}
                      disabled={buscandoProducto}
                      className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      placeholder="Cantidad"
                      value={nuevoProducto.cantidad}
                      onChange={(e) =>
                        setNuevoProducto({ ...nuevoProducto, cantidad: parseInt(e.target.value) || 1 })
                      }
                      className="px-3 py-2 border rounded-lg text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Precio"
                      step="0.01"
                      value={nuevoProducto.precio}
                      onChange={(e) =>
                        setNuevoProducto({ ...nuevoProducto, precio: parseFloat(e.target.value) || 0 })
                      }
                      className="px-3 py-2 border rounded-lg text-sm"
                    />
                    <button
                      onClick={agregarItem}
                      className="px-3 py-2 bg-[#667eea] text-white rounded-lg text-sm hover:bg-[#764ba2] flex items-center justify-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Agregar
                    </button>
                  </div>
                </div>
              </div>

              {/* TABLA DE ITEMS */}
              {items.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-bold mb-3">Productos</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="text-left px-2 py-2">Producto</th>
                          <th className="text-center px-2 py-2">Cant.</th>
                          <th className="text-right px-2 py-2">Precio</th>
                          <th className="text-right px-2 py-2">Subtotal</th>
                          <th className="text-center px-2 py-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="px-2 py-2">{item.nombre_producto}</td>
                            <td className="text-center px-2 py-2">{item.cantidad}</td>
                            <td className="text-right px-2 py-2">S/. {(Number(item.precio_unitario) || 0).toFixed(2)}</td>
                            <td className="text-right px-2 py-2 font-semibold">
                              S/. {(Number(item.subtotal) || 0).toFixed(2)}
                            </td>
                            <td className="text-center px-2 py-2">
                              <button
                                onClick={() => eliminarItem(idx)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-right font-bold text-lg">
                      TOTAL: S/. {calcularTotal().toFixed(2)}
                    </p>
                  </div>
                </div>
              )}

              {/* OBSERVACIONES */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Observaciones (opcional)</label>
                <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Ej: Promoción aplicada, descuento por cantidad, etc."
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              {/* BOTONES */}
              <div className="flex gap-3">
                <button
                  onClick={guardarYGenerarPDF}
                  disabled={loading || items.length === 0}
                  className="flex-1 bg-[#667eea] text-white font-semibold py-2 rounded-lg hover:bg-[#764ba2] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  {loading ? "Generando..." : "Generar PDF"}
                </button>
                <button
                  onClick={() => setCotizacionActual(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg p-6 flex items-center justify-center min-h-96">
              <p className="text-gray-500 text-center">
                Selecciona una cotización para comenzar
              </p>
            </div>
          )}
        </div>
      </div>

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
