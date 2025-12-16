"use client"

import { useState } from "react"
import { FileText, Send, AlertCircle, CheckCircle } from "lucide-react"
import Navbar from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"
import ModalAlerta from "@/components/modal-alerta"

export default function LibroReclamacionesPage() {
  const [formData, setFormData] = useState({
    nombre: "",
    apellidos: "",
    email: "",
    telefono: "",
    tipoDocumento: "DNI",
    numeroDocumento: "",
    direccion: "",
    tipoSolicitud: "Reclamo",
    fechaIncidente: "",
    detalleSolicitud: "",
    terminos: false
  })
  const [loading, setLoading] = useState(false)
  const [modalAlerta, setModalAlerta] = useState({
    isOpen: false,
    type: "info" as "error" | "success" | "warning" | "info",
    title: "",
    message: "",
    buttons: [] as any[]
  })

  const tiposDocumento = ["DNI", "Pasaporte", "Licencia de Conducir", "RUC"]
  const tiposSolicitud = ["Reclamo", "Queja", "Sugerencia", "Felicitación"]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validaciones
    if (!formData.nombre.trim()) {
      setModalAlerta({
        isOpen: true,
        type: "warning",
        title: "Campo requerido",
        message: "Por favor ingresa tu nombre.",
        buttons: [{ label: "Entendido", onClick: () => setModalAlerta({ ...modalAlerta, isOpen: false }), variant: "primary" }]
      })
      return
    }

    if (!formData.apellidos.trim()) {
      setModalAlerta({
        isOpen: true,
        type: "warning",
        title: "Campo requerido",
        message: "Por favor ingresa tus apellidos.",
        buttons: [{ label: "Entendido", onClick: () => setModalAlerta({ ...modalAlerta, isOpen: false }), variant: "primary" }]
      })
      return
    }

    if (!formData.email.trim()) {
      setModalAlerta({
        isOpen: true,
        type: "warning",
        title: "Campo requerido",
        message: "Por favor ingresa tu correo electrónico.",
        buttons: [{ label: "Entendido", onClick: () => setModalAlerta({ ...modalAlerta, isOpen: false }), variant: "primary" }]
      })
      return
    }

    if (!formData.numeroDocumento.trim()) {
      setModalAlerta({
        isOpen: true,
        type: "warning",
        title: "Campo requerido",
        message: "Por favor ingresa tu número de documento.",
        buttons: [{ label: "Entendido", onClick: () => setModalAlerta({ ...modalAlerta, isOpen: false }), variant: "primary" }]
      })
      return
    }

    if (!formData.detalleSolicitud.trim() || formData.detalleSolicitud.trim().length < 20) {
      setModalAlerta({
        isOpen: true,
        type: "warning",
        title: "Detalle insuficiente",
        message: "Por favor describe tu solicitud con al menos 20 caracteres.",
        buttons: [{ label: "Entendido", onClick: () => setModalAlerta({ ...modalAlerta, isOpen: false }), variant: "primary" }]
      })
      return
    }

    if (!formData.terminos) {
      setModalAlerta({
        isOpen: true,
        type: "warning",
        title: "Aceptación requerida",
        message: "Debes aceptar los términos y condiciones para continuar.",
        buttons: [{ label: "Entendido", onClick: () => setModalAlerta({ ...modalAlerta, isOpen: false }), variant: "primary" }]
      })
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/libro-reclamaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        const data = await res.json()
        setModalAlerta({
          isOpen: true,
          type: "success",
          title: "¡Reclamación registrada!",
          message: `Tu reclamo ha sido registrado exitosamente. Número de expediente: ${data.expediente}. Recibirás una respuesta en máximo 48 horas.`,
          buttons: [{ 
            label: "Aceptar", 
            onClick: () => {
              setModalAlerta({ ...modalAlerta, isOpen: false })
              setFormData({
                nombre: "",
                apellidos: "",
                email: "",
                telefono: "",
                tipoDocumento: "DNI",
                numeroDocumento: "",
                direccion: "",
                tipoSolicitud: "Reclamo",
                fechaIncidente: "",
                detalleSolicitud: "",
                terminos: false
              })
            }, 
            variant: "primary" 
          }]
        })
      } else {
        const error = await res.json()
        setModalAlerta({
          isOpen: true,
          type: "error",
          title: "Error al registrar",
          message: error.error || "Ocurrió un error. Intenta de nuevo.",
          buttons: [{ label: "Entendido", onClick: () => setModalAlerta({ ...modalAlerta, isOpen: false }), variant: "primary" }]
        })
      }
    } catch (error) {
      setModalAlerta({
        isOpen: true,
        type: "error",
        title: "Error de conexión",
        message: "No pudimos conectar con el servidor. Intenta de nuevo.",
        buttons: [{ label: "Entendido", onClick: () => setModalAlerta({ ...modalAlerta, isOpen: false }), variant: "primary" }]
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-5xl font-bold mb-4">Libro de Reclamaciones</h1>
            <p className="text-xl text-blue-100">
              Tu satisfacción es nuestra prioridad. Escríbenos tus comentarios, quejas o sugerencias.
            </p>
          </div>
        </section>

        {/* Información importante */}
        <section className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="inline-block bg-green-100 p-4 rounded-full mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Tiempo de Respuesta</h3>
                <p className="text-gray-600">Máximo 48 horas</p>
              </div>
              <div className="text-center">
                <div className="inline-block bg-blue-100 p-4 rounded-full mb-4">
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Confidencialidad</h3>
                <p className="text-gray-600">Datos 100% seguros</p>
              </div>
              <div className="text-center">
                <div className="inline-block bg-purple-100 p-4 rounded-full mb-4">
                  <AlertCircle className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Soporte</h3>
                <p className="text-gray-600">+51 999 888 777</p>
              </div>
            </div>
          </div>
        </section>

        {/* Formulario */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Información Personal */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Información Personal</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre *</label>
                        <input
                          type="text"
                          name="nombre"
                          value={formData.nombre}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Apellidos *</label>
                        <input
                          type="text"
                          name="apellidos"
                          value={formData.apellidos}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Correo *</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Teléfono (opcional)</label>
                        <input
                          type="tel"
                          name="telefono"
                          value={formData.telefono}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Documentación */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Documentación</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Documento *</label>
                        <select
                          name="tipoDocumento"
                          value={formData.tipoDocumento}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
                        >
                          {tiposDocumento.map(tipo => (
                            <option key={tipo} value={tipo}>{tipo}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Número de Documento *</label>
                        <input
                          type="text"
                          name="numeroDocumento"
                          value={formData.numeroDocumento}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dirección */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Dirección</label>
                    <input
                      type="text"
                      name="direccion"
                      value={formData.direccion}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
                    />
                  </div>

                  {/* Tipo de Solicitud */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Tipo de Solicitud</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Solicitud *</label>
                        <select
                          name="tipoSolicitud"
                          value={formData.tipoSolicitud}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
                        >
                          {tiposSolicitud.map(tipo => (
                            <option key={tipo} value={tipo}>{tipo}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha del Incidente *</label>
                        <input
                          type="date"
                          name="fechaIncidente"
                          value={formData.fechaIncidente}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Detalle */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Detalle de su Solicitud *</label>
                    <textarea
                      name="detalleSolicitud"
                      value={formData.detalleSolicitud}
                      onChange={handleChange}
                      placeholder="Describa detalladamente su reclamo, queja o sugerencia..."
                      rows={6}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
                    />
                  </div>

                  {/* Términos */}
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      name="terminos"
                      checked={formData.terminos}
                      onChange={handleChange}
                      className="mt-1 w-5 h-5 text-[#667eea] rounded focus:ring-2 focus:ring-[#667eea]"
                    />
                    <label className="text-sm text-gray-700">
                      Acepto los términos y condiciones y autorizo el tratamiento de mis datos personales
                    </label>
                  </div>

                  {/* Botón */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#667eea] text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Send className="w-5 h-5" />
                    {loading ? "Enviando..." : "Enviar Reclamación"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />

      {/* Modal de Alerta */}
      <ModalAlerta
        isOpen={modalAlerta.isOpen}
        type={modalAlerta.type}
        title={modalAlerta.title}
        message={modalAlerta.message}
        buttons={modalAlerta.buttons}
        onClose={() => setModalAlerta({ ...modalAlerta, isOpen: false })}
      />
    </>
  )
}
