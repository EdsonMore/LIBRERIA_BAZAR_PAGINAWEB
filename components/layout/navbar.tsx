"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ShoppingCart, User, Menu, X, Bell } from "lucide-react"

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [usuario, setUsuario] = useState<any>(null)
  const [carritoCount, setCarritoCount] = useState(0)
  const [notificacionesNoLeidas, setNotificacionesNoLeidas] = useState(0)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()

  useEffect(() => {
    const controller = new AbortController()
    
    fetch("/api/auth/me", { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (data?.usuario) {
          setUsuario(data.usuario)
          cargarNotificaciones()
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
    
    return () => controller.abort()
  }, [])

  useEffect(() => {
    // Obtener cantidad de items en carrito cuando cambia el usuario
    if (usuario) {
      fetch("/api/carrito/count")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.count !== undefined) {
            setCarritoCount(data.count)
          }
        })
        .catch(() => {})
    }
  }, [usuario?.id]) // Solo cambiar si el ID del usuario cambia

  // Escuchar evento de actualización del carrito
  useEffect(() => {
    const handleCarritoActualizado = () => {
      if (usuario) {
        fetch("/api/carrito/count")
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data?.count !== undefined) {
              setCarritoCount(data.count)
            }
          })
          .catch(() => {})
      }
    }

    window.addEventListener("carritoActualizado", handleCarritoActualizado)
    return () => window.removeEventListener("carritoActualizado", handleCarritoActualizado)
  }, [usuario])

  const cargarNotificaciones = async () => {
    if (!usuario) return
    try {
      const res = await fetch("/api/notificaciones/no-leidas")
      if (res.ok) {
        const data = await res.json()
        setNotificacionesNoLeidas(data.count || 0)
      }
    } catch (error) {
      console.error("Error al cargar notificaciones:", error)
    }
  }

  const isActive = (path: string) => {
    return pathname === path
  }

  const handleLogout = async () => {
    setIsUserMenuOpen(false)
    await fetch("/api/auth/logout", { method: "POST" })
    window.location.href = "/"
  }

  // Funciones auxiliares para verificar roles
  const hasRole = (roleName: string) => {
    if (!usuario?.roles || !Array.isArray(usuario.roles) || usuario.roles.length === 0) {
      return false
    }
    
    return usuario.roles.some((r: any) => {
      const nombre = typeof r === 'object' ? r.nombre : r
      return nombre === roleName
    })
  }

  const isSuperAdmin = () => hasRole("ROLE_SUPER_ADMIN")
  const isAdmin = () => hasRole("ROLE_ADMIN")
  const isCliente = () => hasRole("ROLE_CLIENTE")

  return (
    <nav className="navbar sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link href="/" className="navbar-brand flex items-center gap-3">
            <img 
              src="/images/logos/logo.jpg" 
              alt="Tienda Bazar Logo" 
              className="h-12 w-auto rounded-lg"
            />
            <span className="hidden sm:inline font-bold text-lg">Tienda Bazar</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/" className={`nav-link ${isActive("/") ? "active" : ""}`}>
              Inicio
            </Link>
            <Link href="/productos" className={`nav-link ${isActive("/productos") ? "active" : ""}`}>
              Productos
            </Link>

            {/* Mostrar Contacto y Libro de Reclamaciones solo si NO es SuperAdmin */}
            {!isSuperAdmin() && (
              <>
                <Link href="/sobre-nosotros" className={`nav-link ${isActive("/sobre-nosotros") ? "active" : ""}`}>
                  Sobre Nosotros
                </Link>
                {/* Cotizar Lista - Solo si está logueado */}
                {usuario && (
                  <Link href="/cotizar-lista" className={`nav-link ${isActive("/cotizar-lista") ? "active" : ""}`}>
                    📋 Cotizar Lista
                  </Link>
                )}
                <Link href="/contacto" className={`nav-link ${isActive("/contacto") ? "active" : ""}`}>
                  Contacto
                </Link>
                <Link
                  href="/libro-reclamaciones"
                  className={`nav-link ${isActive("/libro-reclamaciones") ? "active" : ""}`}
                >
                  Libro de Reclamaciones
                </Link>
              </>
            )}

            {/* Panel SuperAdmin (solo para SuperAdmin) */}
            {isSuperAdmin() && (
              <div className="relative group">
                <button className="nav-link flex items-center space-x-1">
                  <span>📊 SuperAdmin</span>
                </button>
                <div className="absolute left-0 mt-0 w-56 bg-white rounded-lg shadow-lg py-2 hidden group-hover:block z-50">
                  <Link
                    href="/superadmin"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/superadmin/usuarios"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Gestión de Usuarios
                  </Link>
                  <Link
                    href="/superadmin/roles"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Gestión de Roles
                  </Link>
                  <Link
                    href="/superadmin/productos"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Gestión de Productos
                  </Link>
                  <Link
                    href="/superadmin/categorias"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Gestión de Categorías
                  </Link>
                  <Link
                    href="/superadmin/compras"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Gestión de Compras
                  </Link>
                  <Link
                    href="/superadmin/mis-boletas"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Mis Boletas
                  </Link>
                  <Link
                    href="/superadmin/resenas"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Gestión de Reseñas
                  </Link>
                  <Link
                    href="/superadmin/configuracion"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Configuración del Sistema
                  </Link>
                </div>
              </div>
            )}

            {/* Panel Admin (solo para Admin) */}
            {isAdmin() && !isSuperAdmin() && (
              <div className="relative group">
                <button className="nav-link flex items-center space-x-1">
                  <span>⚙️ Admin</span>
                </button>
                <div className="absolute left-0 mt-0 w-56 bg-white rounded-lg shadow-lg py-2 hidden group-hover:block z-50">
                  <Link
                    href="/admin"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/admin/productos"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Gestión de Productos
                  </Link>
                  <Link
                    href="/admin/categorias"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Gestión de Categorías
                  </Link>
                  <Link
                    href="/admin/compras"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Gestión de Compras
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {/* Carrito (solo para clientes) */}
            {isCliente() && (
              <Link href="/carrito" className="relative hover:text-[#667eea] transition-colors" title="Ver carrito">
                <ShoppingCart className="w-6 h-6" />
                {carritoCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {carritoCount}
                  </span>
                )}
              </Link>
            )}

            {/* Notificaciones (para usuarios autenticados) */}
            {usuario && (
              <Link href="/notificaciones" className="relative hover:text-[#667eea] transition-colors" title="Notificaciones">
                <Bell className="w-6 h-6" />
                {notificacionesNoLeidas > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {notificacionesNoLeidas}
                  </span>
                )}
              </Link>
            )}

            {/* Usuario Autenticado */}
            {usuario ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 hover:text-[#667eea] transition-colors"
                >
                  <User className="w-6 h-6" />
                  <span className="hidden md:inline text-sm font-medium">
                    {usuario.user ? `@${usuario.user}` : usuario.nombres || "Usuario"}
                  </span>
                </button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl py-2 z-50 border border-gray-200">
                    {/* Mi Perfil (todos excepto SuperAdmin) */}
                    {!isSuperAdmin() && usuario && (
                      <>
                        <Link
                          href="/perfil"
                          className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          👤 Mi Perfil
                        </Link>
                        <hr className="my-1" />
                      </>
                    )}

                    {/* Opciones para Clientes */}
                    {isCliente() && usuario && (
                      <>
                        <Link
                          href="/mis-compras"
                          className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          🛍️ Mis Compras
                        </Link>
                        <Link
                          href="/mis-resenas"
                          className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          ⭐ Mis Reseñas
                        </Link>
                        <hr className="my-1" />
                      </>
                    )}

                    {/* Logout */}
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors font-medium"
                    >
                      🚪 Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/auth/login" className="btn-primary px-6 py-2">
                Iniciar Sesión
              </Link>
            )}

            {/* Mobile menu button */}
            <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden pb-4 space-y-2 border-t border-gray-200">
            <Link
              href="/"
              className="block py-2 hover:text-[#667eea] transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Inicio
            </Link>
            <Link
              href="/productos"
              className="block py-2 hover:text-[#667eea] transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Productos
            </Link>

            {/* Mostrar opciones generales solo si NO es SuperAdmin */}
            {!isSuperAdmin() && (
              <>
                <Link
                  href="/sobre-nosotros"
                  className="block py-2 hover:text-[#667eea] transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sobre Nosotros
                </Link>
                <Link
                  href="/contacto"
                  className="block py-2 hover:text-[#667eea] transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Contacto
                </Link>
                <Link
                  href="/libro-reclamaciones"
                  className="block py-2 hover:text-[#667eea] transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Libro de Reclamaciones
                </Link>
              </>
            )}

            {/* Panel SuperAdmin */}
            {isSuperAdmin() && (
              <>
                <hr className="my-2" />
                <div className="text-sm font-bold text-gray-600 px-0 py-1">📊 Panel SuperAdmin</div>
                <Link
                  href="/superadmin"
                  className="block py-2 pl-4 hover:text-[#667eea] transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/superadmin/usuarios"
                  className="block py-2 pl-4 hover:text-[#667eea] transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Gestión de Usuarios
                </Link>
                <Link
                  href="/superadmin/roles"
                  className="block py-2 pl-4 hover:text-[#667eea] transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Gestión de Roles
                </Link>
                <Link
                  href="/superadmin/productos"
                  className="block py-2 pl-4 hover:text-[#667eea] transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Gestión de Productos
                </Link>
                <Link
                  href="/superadmin/categorias"
                  className="block py-2 pl-4 hover:text-[#667eea] transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Gestión de Categorías
                </Link>
                <Link
                  href="/superadmin/compras"
                  className="block py-2 pl-4 hover:text-[#667eea] transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Gestión de Compras
                </Link>
                <Link
                  href="/superadmin/resenas"
                  className="block py-2 pl-4 hover:text-[#667eea] transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Gestión de Reseñas
                </Link>
                <Link
                  href="/superadmin/configuracion"
                  className="block py-2 pl-4 hover:text-[#667eea] transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Configuración
                </Link>
              </>
            )}

            {/* Panel Admin */}
            {isAdmin() && !isSuperAdmin() && (
              <>
                <hr className="my-2" />
                <div className="text-sm font-bold text-gray-600 px-0 py-1">⚙️ Panel Admin</div>
                <Link
                  href="/admin"
                  className="block py-2 pl-4 hover:text-[#667eea] transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/productos"
                  className="block py-2 pl-4 hover:text-[#667eea] transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Gestión de Productos
                </Link>
                <Link
                  href="/admin/categorias"
                  className="block py-2 pl-4 hover:text-[#667eea] transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Gestión de Categorías
                </Link>
                <Link
                  href="/admin/compras"
                  className="block py-2 pl-4 hover:text-[#667eea] transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Gestión de Compras
                </Link>
              </>
            )}

            {/* Usuario opciones */}
            {usuario && (
              <>
                <hr className="my-2" />
                {!isSuperAdmin() && (
                  <Link
                    href="/perfil"
                    className="block py-2 hover:text-[#667eea] transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    👤 Mi Perfil
                  </Link>
                )}
                {isCliente() && (
                  <>
                    <Link
                      href="/mis-compras"
                      className="block py-2 hover:text-[#667eea] transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      🛍️ Mis Compras
                    </Link>
                    <Link
                      href="/mis-resenas"
                      className="block py-2 hover:text-[#667eea] transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      ⭐ Mis Reseñas
                    </Link>
                  </>
                )}
                <button
                  onClick={() => {
                    setIsMenuOpen(false)
                    handleLogout()
                  }}
                  className="w-full text-left py-2 text-red-600 hover:text-red-700 transition-colors font-medium"
                >
                  🚪 Cerrar Sesión
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
