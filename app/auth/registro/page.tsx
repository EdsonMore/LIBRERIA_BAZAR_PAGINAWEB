"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Home } from "lucide-react"

export default function RegistroPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    user: "",
    password: "",
    confirmPassword: "",
    correo: "",
    nombres: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    dni: "",
    numero: "",
    genero: "",
    tipoDoc: "DNI",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [userError, setUserError] = useState("")
  const [checkingUser, setCheckingUser] = useState(false)

  // Validar que el usuario sea único
  const validateUserUnique = async (username: string) => {
    if (!username) {
      setUserError("")
      return
    }

    setCheckingUser(true)
    try {
      const response = await fetch("/api/auth/check-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: username }),
      })

      const data = await response.json()

      if (data.exists) {
        setUserError("Este usuario ya está registrado")
      } else {
        setUserError("")
      }
    } catch (err) {
      console.error("Error al verificar usuario:", err)
    } finally {
      setCheckingUser(false)
    }
  }

  const handleUserChange = (value: string) => {
    setFormData({ ...formData, user: value })
    // Debounce la validación
    setTimeout(() => validateUserUnique(value), 500)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validaciones
    if (!formData.user.trim()) {
      setError("El usuario es requerido")
      return
    }

    if (userError) {
      setError("El usuario ya existe, elige otro")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      return
    }

    setLoading(true)

    try {
      // Convertir camelCase a snake_case para el backend
      const dataToSend = {
        user: formData.user,
        password: formData.password,
        correo: formData.correo,
        nombres: formData.nombres,
        apellido_paterno: formData.apellidoPaterno,
        apellido_materno: formData.apellidoMaterno,
        dni: formData.dni,
        numero: formData.numero,
        genero: formData.genero,
        tipo_doc: formData.tipoDoc,
      }

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Error al registrarse")
        setLoading(false)
        return
      }

      // Redirigir al login después del registro exitoso
      router.push("/auth/login?registered=true")
    } catch (err) {
      setError("Error de conexión. Intente nuevamente.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#667eea] via-[#764ba2] to-[#f093fb] py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-2xl w-full space-y-8 bg-white rounded-2xl shadow-2xl p-10 relative">
        <div>
          <h2
            className="text-center text-4xl font-bold"
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Crear Cuenta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">Complete el formulario para registrarse</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="user" className="block text-sm font-medium text-gray-700 mb-2">
                Usuario * {checkingUser && <span className="text-xs text-blue-500">(verificando...)</span>}
              </label>
              <div className="relative">
                <input
                  id="user"
                  name="user"
                  type="text"
                  required
                  className={`appearance-none relative block w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent transition-all ${
                    userError ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Usuario"
                  value={formData.user}
                  onChange={(e) => handleUserChange(e.target.value)}
                />
                {userError && <span className="text-xs text-red-500 mt-1">{userError}</span>}
              </div>
            </div>

            <div>
              <label htmlFor="correo" className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico *
              </label>
              <input
                id="correo"
                name="correo"
                type="email"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent transition-all"
                placeholder="correo@ejemplo.com"
                value={formData.correo}
                onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña * (mínimo 6 caracteres)
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="appearance-none relative block w-full px-4 py-3 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent transition-all"
                  placeholder="Ingrese su contraseña"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Contraseña *
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  className="appearance-none relative block w-full px-4 py-3 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent transition-all"
                  placeholder="Confirme su contraseña"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="nombres" className="block text-sm font-medium text-gray-700 mb-2">
                Nombres *
              </label>
              <input
                id="nombres"
                name="nombres"
                type="text"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent transition-all"
                placeholder="Sus nombres"
                value={formData.nombres}
                onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="apellidoPaterno" className="block text-sm font-medium text-gray-700 mb-2">
                Apellido Paterno *
              </label>
              <input
                id="apellidoPaterno"
                name="apellidoPaterno"
                type="text"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent transition-all"
                placeholder="Apellido paterno"
                value={formData.apellidoPaterno}
                onChange={(e) => setFormData({ ...formData, apellidoPaterno: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="apellidoMaterno" className="block text-sm font-medium text-gray-700 mb-2">
                Apellido Materno
              </label>
              <input
                id="apellidoMaterno"
                name="apellidoMaterno"
                type="text"
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent transition-all"
                placeholder="Apellido materno"
                value={formData.apellidoMaterno}
                onChange={(e) => setFormData({ ...formData, apellidoMaterno: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="tipoDoc" className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Documento *
              </label>
              <select
                id="tipoDoc"
                name="tipoDoc"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent transition-all"
                value={formData.tipoDoc}
                onChange={(e) => setFormData({ ...formData, tipoDoc: e.target.value })}
              >
                <option value="DNI">DNI</option>
                <option value="CARNET_EXTRANJERIA">Carnet de Extranjería</option>
                <option value="PASAPORTE">Pasaporte</option>
              </select>
            </div>

            <div>
              <label htmlFor="dni" className="block text-sm font-medium text-gray-700 mb-2">
                Número de Documento *
              </label>
              <input
                id="dni"
                name="dni"
                type="text"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent transition-all"
                placeholder="Número de documento"
                value={formData.dni}
                onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="numero" className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono
              </label>
              <input
                id="numero"
                name="numero"
                type="tel"
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent transition-all"
                placeholder="Número de teléfono"
                value={formData.numero}
                onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="genero" className="block text-sm font-medium text-gray-700 mb-2">
                Género
              </label>
              <select
                id="genero"
                name="genero"
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent transition-all"
                value={formData.genero}
                onChange={(e) => setFormData({ ...formData, genero: e.target.value })}
              >
                <option value="">Seleccione</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="O">Otro</option>
              </select>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !!userError}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-full text-white btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Registrando..." : "Crear Cuenta"}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              ¿Ya tiene una cuenta?{" "}
              <Link href="/auth/login" className="font-medium text-[#667eea] hover:text-[#764ba2] transition-colors">
                Inicie sesión aquí
              </Link>
            </p>
          </div>
        </form>

        {/* Botón Volver al Inicio */}
        <div className="absolute top-6 left-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-[#667eea] font-medium rounded-full shadow-md hover:bg-gray-50 hover:shadow-lg transition-all duration-200"
            title="Volver al inicio"
          >
            <Home size={20} />
            <span>Inicio</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
