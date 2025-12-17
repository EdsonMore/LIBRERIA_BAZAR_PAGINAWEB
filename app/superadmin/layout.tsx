"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { LayoutDashboard, Users, Box, ShoppingCart, FileText, Settings, BarChart3, Menu, X, TrendingUp, LogOut, Store, CreditCard } from "lucide-react"

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const menuItems = [
    { href: "/superadmin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/superadmin/usuarios", label: "Gestión de Usuarios", icon: Users },
    { href: "/superadmin/roles", label: "Gestión de Roles", icon: Settings },
    { href: "/superadmin/productos", label: "Gestión de Productos", icon: Box },
    { href: "/superadmin/categorias", label: "Gestión de Categorías", icon: BarChart3 },
    { href: "/superadmin/compras", label: "Gestión de Compras", icon: ShoppingCart },
    { href: "/superadmin/ventas-reportes", label: "Reportes de Ventas", icon: TrendingUp },
    { href: "/superadmin/deudas", label: "Gestión de Deudas", icon: CreditCard },
    { href: "/superadmin/mis-boletas", label: "Mis Boletas", icon: FileText },
    { href: "/superadmin/resenas", label: "Gestión de Reseñas", icon: Users },
    { href: "/superadmin/configuracion", label: "Configuración del Sistema", icon: Settings },
  ]

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/")
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    window.location.href = "/"
  }

  return (
    <>
      <div className="flex min-h-screen bg-gray-50">
        {/* Overlay para mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 md:hidden z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed md:static left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out z-40 md:z-auto
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          `}
        >
          <div className="p-4 md:p-6 h-full overflow-y-auto flex flex-col">
            {/* Header con botón cerrar en mobile */}
            <div className="md:hidden mb-6 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Menú</h3>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="space-y-1 flex-1">
              {menuItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium
                      ${
                        active
                          ? "bg-blue-50 text-blue-700 border-l-4 border-blue-700"
                          : "text-gray-700 hover:bg-gray-100"
                      }
                    `}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                )
              })}
            </nav>

            {/* Footer Actions */}
            <div className="border-t border-gray-200 pt-4 mt-4 space-y-2">
              {/* Productos */}
              <Link
                href="/productos"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                <Store className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">Productos</span>
              </Link>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Botón hamburger mobile */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden fixed top-20 right-6 z-50 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 active:scale-95 transition-all"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Main Content */}
        <main className="flex-1 w-full">
          {children}
        </main>
      </div>
    </>
  )
}
