"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"
import { User, Mail, Phone, MapPin, Calendar, Save, Edit } from "lucide-react"

export default function PerfilPage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [showChangeUserModal, setShowChangeUserModal] = useState(false)
  const [newUser, setNewUser] = useState("")
  const [changeUserError, setChangeUserError] = useState("")
  const [changeUserMessage, setChangeUserMessage] = useState("")
  const [changingUser, setChangingUser] = useState(false)
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    nombres: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    correo: "",
    numero: "",
    dni: "",
    genero: "",
    fechaNacimiento: "",
    direccion1: "",
    direccion2: "",
  })

  useEffect(() => {
    cargarPerfil()
  }, [])

  const cargarPerfil = async () => {
    try {
      const res = await fetch("/api/auth/me")
      if (!res.ok) {
        router.push("/auth/login")
        return
      }
      const data = await res.json()
      setUsuario(data.usuario)
      setFormData({
        nombres: data.usuario.nombres || "",
        apellidoPaterno: data.usuario.apellidoPaterno || "",
        apellidoMaterno: data.usuario.apellidoMaterno || "",
        correo: data.usuario.correo || "",
        numero: data.usuario.numero || "",
        dni: data.usuario.dni || "",
        genero: data.usuario.genero || "",
        fechaNacimiento: data.usuario.fechaNacimiento || "",
        direccion1: data.usuario.direccion1 || "",
        direccion2: data.usuario.direccion2 || "",
      })
      setLoading(false)
    } catch (error) {
      console.error(error)
      router.push("/auth/login")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage("")

    try {
      const res = await fetch("/api/usuarios/actualizar-perfil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (res.ok) {
        const successMsg = "✓ ¡Perfil actualizado exitosamente!"
        setMessage(successMsg)
        cargarPerfil()
        // Auto-limpiar mensaje después de 3 segundos
        setTimeout(() => setMessage(""), 3000)
      } else {
        setMessage(data.error || "Error al actualizar perfil")
      }
    } catch (error) {
      setMessage("Error de conexión")
    } finally {
      setSaving(false)
    }
  }

  const handleChangeUser = async () => {
    setChangeUserError("")
    setChangeUserMessage("")
    setChangingUser(true)

    try {
      const res = await fetch("/api/perfil/cambiar-usuario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newUser }),
      })

      const data = await res.json()

      if (res.ok) {
        setChangeUserMessage("✓ Usuario cambio exitosamente. Redirigiendo...")
        setShowChangeUserModal(false)
        setNewUser("")
        setTimeout(() => {
          router.push("/auth/login?msg=usuario-cambiado")
        }, 1500)
      } else {
        setChangeUserError(data.error || "Error al cambiar usuario")
        setDaysRemaining(data.daysRemaining || null)
      }
    } catch (error) {
      setChangeUserError("Error de conexión")
    } finally {
      setChangingUser(false)
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

  return (
    <>
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Mi Perfil</h1>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            {/* Header con avatar */}
            <div className="flex items-center gap-6 mb-8 pb-8 border-b">
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-[#C8D800] to-[#E91E63] flex items-center justify-center text-white text-4xl font-bold">
                {usuario?.nombres?.charAt(0) || usuario?.user?.charAt(0) || "U"}
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {usuario?.nombres} {usuario?.apellidoPaterno}
                </h2>
                <p className="text-gray-600">{usuario?.correo}</p>
                <p className="text-sm text-gray-500 mt-1">Usuario: {usuario?.user}</p>
              </div>
            </div>

            {message && (
              <div
                className={`mb-6 p-4 rounded-lg ${message.includes("exitosamente") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}
              >
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Nombres *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C8D800] focus:border-transparent"
                    value={formData.nombres}
                    onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Apellido Paterno *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C8D800] focus:border-transparent"
                    value={formData.apellidoPaterno}
                    onChange={(e) => setFormData({ ...formData, apellidoPaterno: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Apellido Materno</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C8D800] focus:border-transparent"
                    value={formData.apellidoMaterno}
                    onChange={(e) => setFormData({ ...formData, apellidoMaterno: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C8D800] focus:border-transparent"
                    value={formData.correo}
                    onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C8D800] focus:border-transparent"
                    value={formData.numero}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Género</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C8D800] focus:border-transparent"
                    value={formData.genero}
                    onChange={(e) => setFormData({ ...formData, genero: e.target.value })}
                  >
                    <option value="">Seleccione</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Dirección Principal
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C8D800] focus:border-transparent"
                    value={formData.direccion1}
                    onChange={(e) => setFormData({ ...formData, direccion1: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Dirección Secundaria</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C8D800] focus:border-transparent"
                    value={formData.direccion2}
                    onChange={(e) => setFormData({ ...formData, direccion2: e.target.value })}
                  />
                </div>
              </div>

              <div className="mt-8 flex gap-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {saving ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>

            {/* Información adicional */}
            <div className="mt-8 pt-8 border-t">
              <h3 className="text-lg font-bold mb-4">Información de la Cuenta</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  Miembro desde: {new Date(usuario?.fechaRegistro).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2 text-gray-600">DNI: {formData.dni || "No especificado"}</div>
              </div>

              {/* Opción de cambiar usuario */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-blue-900">Cambiar Usuario</h4>
                    <p className="text-sm text-blue-700 mt-1">Puedes cambiar tu usuario una vez cada 30 días</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowChangeUserModal(true)
                      setChangeUserError("")
                      setChangeUserMessage("")
                      setDaysRemaining(null)
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Cambiar Usuario
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Cambiar Usuario */}
      {showChangeUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Cambiar Usuario</h2>

            {changeUserError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {changeUserError}
                {daysRemaining && <p className="mt-1 font-medium">Inténtalo en {daysRemaining} día(s)</p>}
              </div>
            )}

            {changeUserMessage && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                {changeUserMessage}
              </div>
            )}

            {!changeUserMessage && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nuevo Usuario
                  </label>
                  <input
                    type="text"
                    value={newUser}
                    onChange={(e) => setNewUser(e.target.value)}
                    placeholder="Ingrese su nuevo usuario"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C8D800] focus:border-transparent"
                    disabled={changingUser}
                  />
                </div>

                <p className="text-xs text-gray-500 mb-4">
                  ⚠️ Usuario actual: <span className="font-medium">{usuario?.user}</span>
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowChangeUserModal(false)
                      setNewUser("")
                      setChangeUserError("")
                      setChangeUserMessage("")
                    }}
                    disabled={changingUser}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleChangeUser}
                    disabled={changingUser || !newUser.trim()}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {changingUser ? "Cambiando..." : "Cambiar"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <Footer />
    </>
  )
}





