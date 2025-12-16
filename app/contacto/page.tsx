"use client"

import { useState } from "react"
import { Mail, Phone, MapPin, Clock, Send } from "lucide-react"
import Navbar from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"
import ModalAlerta from "@/components/modal-alerta"

export default function ContactoPage() {
  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
    telefono: "",
    asunto: "Consulta General",
    mensaje: ""
  })
  const [loading, setLoading] = useState(false)
  const [modalAlerta, setModalAlerta] = useState({
    isOpen: false,
    type: "info" as "error" | "success" | "warning" | "info",
    title: "",
    message: "",
    buttons: [] as any[]
  })

  const asuntos = [
    "Consulta General",
    "Consulta de Producto",
    "Problemas Técnicos",
    "Sugerencia",
    "Otros"
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
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

    if (!formData.correo.trim()) {
      setModalAlerta({
        isOpen: true,
        type: "warning",
        title: "Campo requerido",
        message: "Por favor ingresa tu correo electrónico.",
        buttons: [{ label: "Entendido", onClick: () => setModalAlerta({ ...modalAlerta, isOpen: false }), variant: "primary" }]
      })
      return
    }

    if (!formData.mensaje.trim() || formData.mensaje.trim().length < 10) {
      setModalAlerta({
        isOpen: true,
        type: "warning",
        title: "Mensaje muy corto",
        message: "Por favor escribe un mensaje con al menos 10 caracteres.",
        buttons: [{ label: "Entendido", onClick: () => setModalAlerta({ ...modalAlerta, isOpen: false }), variant: "primary" }]
      })
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/contacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        setModalAlerta({
          isOpen: true,
          type: "success",
          title: "¡Mensaje enviado!",
          message: "Gracias por contactarnos. Te responderemos lo antes posible.",
          buttons: [{ 
            label: "Aceptar", 
            onClick: () => {
              setModalAlerta({ ...modalAlerta, isOpen: false })
              setFormData({ nombre: "", correo: "", telefono: "", asunto: "Consulta General", mensaje: "" })
            }, 
            variant: "primary" 
          }]
        })
      } else {
        const error = await res.json()
        setModalAlerta({
          isOpen: true,
          type: "error",
          title: "Error al enviar",
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
            <h1 className="text-5xl font-bold mb-4">Contáctanos</h1>
            <p className="text-xl text-blue-100">
              Estamos aquí para ayudarte. Envíanos tu consulta y te responderemos lo antes posible.
            </p>
          </div>
        </section>

        {/* Contenido principal */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Formulario */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <h2 className="text-3xl font-bold mb-6">Envíanos un mensaje</h2>
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Nombre completo
                        </label>
                        <input
                          type="text"
                          name="nombre"
                          value={formData.nombre}
                          onChange={handleChange}
                          placeholder="Tu nombre"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Correo electrónico
                        </label>
                        <input
                          type="email"
                          name="correo"
                          value={formData.correo}
                          onChange={handleChange}
                          placeholder="tu@email.com"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Teléfono (opcional)
                        </label>
                        <input
                          type="tel"
                          name="telefono"
                          value={formData.telefono}
                          onChange={handleChange}
                          placeholder="+51 999 888 777"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Asunto
                        </label>
                        <select
                          name="asunto"
                          value={formData.asunto}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
                        >
                          {asuntos.map(asunto => (
                            <option key={asunto} value={asunto}>{asunto}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Mensaje
                      </label>
                      <textarea
                        name="mensaje"
                        value={formData.mensaje}
                        onChange={handleChange}
                        placeholder="Cuéntanos en qué podemos ayudarte..."
                        rows={6}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#667eea] text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <Send className="w-5 h-5" />
                      {loading ? "Enviando..." : "Enviar Mensaje"}
                    </button>
                  </form>
                </div>
              </div>

              {/* Información de contacto */}
              <div className="space-y-6">
                {/* Dirección */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-100 p-3 rounded-full">
                      <MapPin className="w-6 h-6 text-[#667eea]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">Dirección</h3>
                      <p className="text-gray-600">Catacaos, Piura, Perú</p>
                    </div>
                  </div>
                </div>

                {/* Teléfono */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-green-100 p-3 rounded-full">
                      <Phone className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">Teléfono</h3>
                      <p className="text-gray-600">
                        <a href="tel:+51999888777" className="text-[#667eea] hover:underline">
                          +51 999 888 777
                        </a>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Correo */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-yellow-100 p-3 rounded-full">
                      <Mail className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">Correo</h3>
                      <p className="text-gray-600">
                        <a href="mailto:info@tiendabazar.com" className="text-[#667eea] hover:underline">
                          info@tiendabazar.com
                        </a>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Horarios */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-purple-100 p-3 rounded-full">
                      <Clock className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">Horarios</h3>
                      <p className="text-gray-600 text-sm">
                        Lunes - Sábado: 9am - 11pm<br />
                        Domingos: Cerrado
                      </p>
                    </div>
                  </div>
                </div>
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
