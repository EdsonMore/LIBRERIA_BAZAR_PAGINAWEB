"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"

export default function CheckoutPage() {
  const router = useRouter()
  const [items, setItems] = useState<any[]>([])
  const [config, setConfig] = useState<any>({ aplicarIGV: true, porcentajeIGV: 18, aplicarEnvio: true, costoEnvio: 15 })
  const [loading, setLoading] = useState(true)
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [numeroSeguimiento, setNumeroSeguimiento] = useState("")

  // Formulario
  const [formData, setFormData] = useState({
    nombres: "",
    apellido: "",
    correo: "",
    telefono: "",
    dni: "",
    direccion: "",
  })

  const [metodoPago, setMetodoPago] = useState<"contra_entrega" | "yape" | "plin">("contra_entrega")
  const [comprobante, setComprobante] = useState<File | null>(null)
  const [previewComprobante, setPreviewComprobante] = useState<string | null>(null)

  useEffect(() => {
    cargarCarrito()
    cargarConfiguracion()
    cargarDatosUsuario() // ← AUTO-LLENAR DATOS
  }, [])

  const cargarCarrito = async () => {
    try {
      const res = await fetch("/api/carrito")
      if (res.ok) {
        const data = await res.json()
        if (!data.items || data.items.length === 0) {
          router.push("/carrito")
          return
        }
        setItems(data.items)
      }
      setLoading(false)
    } catch (error) {
      console.error(error)
      setLoading(false)
    }
  }

  const cargarConfiguracion = async () => {
    try {
      const res = await fetch("/api/configuracion-sistema")
      if (res.ok) {
        const data = await res.json()
        setConfig(data)
      }
    } catch (error) {
      console.error(error)
    }
  }

  const cargarDatosUsuario = async () => {
    try {
      const res = await fetch("/api/usuario/perfil")
      if (res.ok) {
        const data = await res.json()
        // Auto-llenar con datos del usuario
        setFormData((prev) => ({
          ...prev,
          nombres: data.nombres || "",
          apellido: data.apellidoPaterno || "",
          correo: data.correo || "",
          telefono: data.numero || "",
          dni: data.dni || "",
          direccion: data.direccion1 || "",
        }))
      }
    } catch (error) {
      console.error("Error cargando datos de usuario:", error)
    }
  }

  const calcularSubtotal = () => {
    return items.reduce((sum, item) => sum + Number(item.producto.precio) * item.cantidad, 0)
  }

  const calcularIGV = () => {
    if (!config.aplicarIGV) return 0
    return calcularSubtotal() * (config.porcentajeIGV / 100)
  }

  const calcularEnvio = () => {
    if (!config.aplicarEnvio) return 0
    return config.costoEnvio
  }

  const calcularTotal = () => {
    return calcularSubtotal() + calcularIGV() + calcularEnvio()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const validarFormulario = () => {
    if (!formData.nombres.trim() || !formData.apellido.trim() || !formData.correo.trim() || !formData.telefono.trim() || !formData.dni.trim() || !formData.direccion.trim()) {
      setError("Todos los campos son obligatorios")
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.correo)) {
      setError("El correo no es válido")
      return false
    }

    if (formData.dni.length < 7) {
      setError("El DNI debe tener al menos 7 caracteres")
      return false
    }

    setError("")
    return true
  }

  const handleProcederPago = () => {
    if (!validarFormulario()) {
      return
    }
    setShowModal(true)
  }

  const handleConfirmarPago = async () => {
    if (!validarFormulario()) {
      return
    }

    // Validar que haya comprobante para Yape/Plín
    if ((metodoPago === "yape" || metodoPago === "plin") && !comprobante) {
      setError("Debe adjuntar un comprobante de pago para " + (metodoPago === "yape" ? "Yape" : "Plín"))
      return
    }

    setProcesando(true)
    setError("")

    try {
      const res = await fetch("/api/compras/realizar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombres: formData.nombres,
          apellido: formData.apellido,
          correo: formData.correo,
          telefono: formData.telefono,
          dni: formData.dni,
          direccion: formData.direccion,
          metodoPago,
          items: items.map((item) => ({
            id: item.id,
            productoId: item.producto.id,
            cantidad: item.cantidad,
            precio_unitario: Number(item.producto.precio),
          })),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || "Error al procesar la compra")
      }

      const data = await res.json()

      // Si hay comprobante, subirlo
      if (comprobante && (metodoPago === "yape" || metodoPago === "plin")) {
        const formDataComprobante = new FormData()
        formDataComprobante.append("comprobante", comprobante)
        formDataComprobante.append("compraId", data.compraId)
        formDataComprobante.append("metodoPago", metodoPago)

        const resComprobante = await fetch("/api/compras/comprobante", {
          method: "POST",
          body: formDataComprobante,
        })

        if (!resComprobante.ok) {
          console.error("Error al subir comprobante, pero la compra se registró")
        }
      }

      setNumeroSeguimiento(data.numero_seguimiento)
      setShowSuccess(true)
      setShowModal(false)

      setTimeout(() => {
        router.push("/mis-compras")
      }, 3000)
    } catch (error: any) {
      setError(error.message || "Error al procesar la compra")
    } finally {
      setProcesando(false)
    }
  }

  const handleComprobanteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setComprobante(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewComprobante(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#C8D800] border-t-transparent"></div>
        </div>
        <Footer />
      </>
    )
  }

  if (items.length === 0) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold text-gray-600 mb-4">Tu carrito está vacío</h2>
          <button onClick={() => router.push("/productos")} className="btn-primary px-8 py-3">
            Ir a Productos
          </button>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Finalizar Compra</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulario y Métodos de Pago */}
          <div className="lg:col-span-2 space-y-6">
            {/* Datos de Entrega */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4">Datos de Entrega</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Nombres *</label>
                  <input
                    type="text"
                    name="nombres"
                    value={formData.nombres}
                    onChange={handleInputChange}
                    placeholder="Ej: Juan"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8D800]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Apellido *</label>
                  <input
                    type="text"
                    name="apellido"
                    value={formData.apellido}
                    onChange={handleInputChange}
                    placeholder="Ej: Pérez"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8D800]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Correo *</label>
                  <input
                    type="email"
                    name="correo"
                    value={formData.correo}
                    onChange={handleInputChange}
                    placeholder="Ej: juan@example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8D800]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Teléfono *</label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    placeholder="Ej: 987654321"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8D800]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">DNI *</label>
                  <input
                    type="text"
                    name="dni"
                    value={formData.dni}
                    onChange={handleInputChange}
                    placeholder="Ej: 12345678"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8D800]"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-semibold mb-2">Dirección de Entrega *</label>
                <textarea
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleInputChange}
                  placeholder="Calle, número, apartamento, ciudad..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8D800]"
                  rows={3}
                />
              </div>
            </div>

            {/* Métodos de Pago */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4">Método de Pago</h2>

              <div className="space-y-3">
                {/* Contra Entrega */}
                <label className="flex items-start p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-[#C8D800] transition-colors" style={{ borderColor: metodoPago === "contra_entrega" ? "#E91E63" : "#e5e7eb" }}>
                  <input
                    type="radio"
                    name="metodoPago"
                    value="contra_entrega"
                    checked={metodoPago === "contra_entrega"}
                    onChange={(e) => setMetodoPago(e.target.value as "contra_entrega" | "yape" | "plin")}
                    className="mt-1 mr-4 w-4 h-4 accent-[#E91E63]"
                  />
                  <div>
                    <h3 className="font-bold text-lg">Contra Entrega (Efectivo)</h3>
                    <p className="text-gray-600 text-sm">Paga cuando recibas tu pedido</p>
                  </div>
                </label>

                {/* Yape */}
                <label className="flex items-start p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-[#C8D800] transition-colors" style={{ borderColor: metodoPago === "yape" ? "#E91E63" : "#e5e7eb" }}>
                  <input
                    type="radio"
                    name="metodoPago"
                    value="yape"
                    checked={metodoPago === "yape"}
                    onChange={(e) => setMetodoPago(e.target.value as "contra_entrega" | "yape" | "plin")}
                    className="mt-1 mr-4 w-4 h-4 accent-[#E91E63]"
                  />
                  <div>
                    <h3 className="font-bold text-lg">Yape</h3>
                    <p className="text-gray-600 text-sm">Pago directo a través de Yape</p>
                  </div>
                </label>

                {/* Plin */}
                <label className="flex items-start p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-[#C8D800] transition-colors" style={{ borderColor: metodoPago === "plin" ? "#E91E63" : "#e5e7eb" }}>
                  <input
                    type="radio"
                    name="metodoPago"
                    value="plin"
                    checked={metodoPago === "plin"}
                    onChange={(e) => setMetodoPago(e.target.value as "contra_entrega" | "yape" | "plin")}
                    className="mt-1 mr-4 w-4 h-4 accent-[#E91E63]"
                  />
                  <div>
                    <h3 className="font-bold text-lg">Plín</h3>
                    <p className="text-gray-600 text-sm">Pago directo a través de Plín</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Resumen de Compra */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4">Resumen de Tu Compra</h2>

              <div className="space-y-2 mb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.producto.nombre} x{item.cantidad}</span>
                    <span>S/ {(Number(item.producto.precio) * item.cantidad).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold">S/ {calcularSubtotal().toFixed(2)}</span>
                </div>
                {config.aplicarIGV && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">IGV ({config.porcentajeIGV}%):</span>
                    <span className="font-semibold">S/ {calcularIGV().toFixed(2)}</span>
                  </div>
                )}
                {config.aplicarEnvio && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Envío:</span>
                    <span className="font-semibold">S/ {calcularEnvio().toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t pt-3 flex justify-between text-xl font-bold">
                  <span>Total:</span>
                  <span className="text-[#E91E63]">S/ {calcularTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Resumen Pegajoso */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-24">
              <h2 className="text-2xl font-bold mb-6">Resumen</h2>

              <div className="bg-gradient-to-br from-[#C8D800] to-[#E91E63] rounded-lg p-6 text-white mb-6">
                <p className="text-sm opacity-90 mb-2">Total a pagar:</p>
                <p className="text-4xl font-bold">S/ {calcularTotal().toFixed(2)}</p>
              </div>

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <button onClick={handleProcederPago} disabled={procesando} className="w-full btn-primary py-3 text-lg font-semibold rounded-lg flex items-center justify-center gap-2 mb-3 disabled:opacity-50 disabled:cursor-not-allowed">
                {procesando ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  "Proceder al Pago"
                )}
              </button>

              <button onClick={() => router.push("/carrito")} disabled={procesando} className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-[#C8D800] hover:text-[#E91E63] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                Volver al Carrito
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Confirmación */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Confirmar Orden</h2>

            {/* Información del Cliente */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h3 className="font-bold mb-2 text-sm">Datos de Entrega:</h3>
              <div className="text-sm text-gray-700 space-y-1">
                <p>
                  <strong>Nombre:</strong> {formData.nombres} {formData.apellido}
                </p>
                <p>
                  <strong>Correo:</strong> {formData.correo}
                </p>
                <p>
                  <strong>Teléfono:</strong> {formData.telefono}
                </p>
                <p>
                  <strong>DNI:</strong> {formData.dni}
                </p>
                <p>
                  <strong>Dirección:</strong> {formData.direccion}
                </p>
              </div>
            </div>

            {/* Método de Pago Específico */}
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <h3 className="font-bold mb-3 text-sm">Método de Pago:</h3>

              {metodoPago === "contra_entrega" && (
                <div>
                  <p className="text-sm font-semibold text-[#E91E63] mb-2">Contra Entrega (Efectivo)</p>
                  <p className="text-sm text-gray-600">Pagarás en efectivo cuando recibas tu pedido. Ten el monto exacto disponible.</p>
                </div>
              )}

              {metodoPago === "yape" && (
                <div className="flex flex-col items-center">
                  <p className="text-sm font-semibold text-[#E91E63] mb-4">Escanea el QR con tu app Yape</p>
                  <div className="bg-white p-4 rounded-lg border-2 border-[#C8D800]">
                    <img src="/images/qr/yape.png" alt="Yape QR" className="h-48 w-48 object-contain" />
                  </div>
                  <p className="text-xs text-gray-600 mt-3 text-center">Abre tu aplicación Yape y escanea este código para realizar el pago</p>
                  
                  {/* Sección de Comprobante */}
                  <div className="mt-4 w-full">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Adjunta tu comprobante de pago *</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleComprobanteChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8D800]"
                    />
                    {previewComprobante && (
                      <div className="mt-2">
                        <img src={previewComprobante} alt="Comprobante" className="max-h-32 rounded-lg" />
                      </div>
                    )}
                    {comprobante && <p className="text-xs text-green-600 mt-1">✓ Comprobante seleccionado</p>}
                  </div>
                </div>
              )}

              {metodoPago === "plin" && (
                <div className="flex flex-col items-center">
                  <p className="text-sm font-semibold text-[#E91E63] mb-4">Escanea el QR con tu app Plín</p>
                  <div className="bg-white p-4 rounded-lg border-2 border-[#C8D800]">
                    <img src="/images/qr/plin.png" alt="Plín QR" className="h-48 w-48 object-contain" />
                  </div>
                  <p className="text-xs text-gray-600 mt-3 text-center">Abre tu aplicación Plín y escanea este código para realizar el pago</p>
                  
                  {/* Sección de Comprobante */}
                  <div className="mt-4 w-full">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Adjunta tu comprobante de pago *</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleComprobanteChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8D800]"
                    />
                    {previewComprobante && (
                      <div className="mt-2">
                        <img src={previewComprobante} alt="Comprobante" className="max-h-32 rounded-lg" />
                      </div>
                    )}
                    {comprobante && <p className="text-xs text-green-600 mt-1">✓ Comprobante seleccionado</p>}
                  </div>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="bg-gradient-to-br from-[#C8D800] to-[#E91E63] rounded-lg p-4 text-white mb-4">
              <p className="text-sm opacity-90 mb-2">Total a pagar:</p>
              <p className="text-3xl font-bold">S/ {calcularTotal().toFixed(2)}</p>
            </div>

            {/* Botones */}
            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} disabled={procesando} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                Cancelar
              </button>
              <button onClick={handleConfirmarPago} disabled={procesando} className="flex-1 btn-primary py-2 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {procesando ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  "Confirmar Pago"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Éxito */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">¡Compra Realizada!</h2>
            <p className="text-gray-600 mb-4">Tu pedido ha sido procesado exitosamente.</p>

            <div className="bg-green-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600 mb-1">Número de Seguimiento:</p>
              <p className="text-lg font-bold text-green-600">{numeroSeguimiento}</p>
            </div>

            <p className="text-sm text-gray-500 mb-4">Redirigiendo a Mis Compras en 3 segundos...</p>
          </div>
        </div>
      )}

      <Footer />
    </>
  )
}
