"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Home } from "lucide-react"
import ModalAlerta from "@/components/modal-alerta"

export default function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    user: "",
    password: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [modalAlerta, setModalAlerta] = useState({
    isOpen: false,
    type: "info" as "error" | "success" | "warning" | "info",
    title: "",
    message: "",
    buttons: [] as any[]
  })

  useEffect(() => {
    const msg = searchParams.get("msg")
    const redirect = searchParams.get("redirect")

    if (msg === "primero-debes-loguearte") {
      setModalAlerta({
        isOpen: true,
        type: "info",
        title: "Inicia sesión para continuar",
        message: "Para dejar una reseña en nuestros productos, es necesario que tengas una cuenta y estés logueado. Después de iniciar sesión, serás redirigido de vuelta al producto.",
        buttons: [
          {
            label: "Entendido",
            onClick: () => setModalAlerta({ ...modalAlerta, isOpen: false }),
            variant: "primary"
          }
        ]
      })
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Error al iniciar sesión")
        setLoading(false)
        return
      }

      // Redirigir según el rol del usuario
      if (data.usuario.roles.some((r: any) => r.nombre === "ROLE_SUPER_ADMIN")) {
        router.push("/superAdmin")
      } else if (data.usuario.roles.some((r: any) => r.nombre === "ROLE_ADMIN")) {
        router.push("/admin")
      } else {
        router.push("/")
      }
    } catch (err) {
      setError("Error de conexión. Intente nuevamente.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#667eea] via-[#764ba2] to-[#f093fb] py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-md w-full space-y-8 bg-white rounded-2xl shadow-2xl p-10 relative">
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
            Iniciar Sesión
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">Accede a tu cuenta de Tienda Bazar</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="user" className="block text-sm font-medium text-gray-700 mb-2">
                Usuario
              </label>
              <input
                id="user"
                name="user"
                type="text"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent transition-all"
                placeholder="Ingrese su usuario"
                value={formData.user}
                onChange={(e) => setFormData({ ...formData, user: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent transition-all"
                placeholder="Ingrese su contraseña"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-[#667eea] focus:ring-[#667eea] border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                Recordarme
              </label>
            </div>

            <div className="text-sm">
              <Link
                href="/auth/recuperar"
                className="font-medium text-[#667eea] hover:text-[#764ba2] transition-colors"
              >
                ¿Olvidó su contraseña?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-full text-white btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              ¿No tiene una cuenta?{" "}
              <Link href="/auth/registro" className="font-medium text-[#667eea] hover:text-[#764ba2] transition-colors">
                Regístrese aquí
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
