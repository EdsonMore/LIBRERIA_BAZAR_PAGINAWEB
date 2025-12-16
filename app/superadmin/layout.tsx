"use client"

import Navbar from "@/components/layout/navbar"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, Box, ShoppingCart, FileText, Settings, BarChart3 } from "lucide-react"

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const menuItems = [
    { href: "/superadmin/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
    { href: "/superadmin/usuarios", label: "Usuarios", icon: "Users" },
    { href: "/superadmin/productos", label: "Productos", icon: "Box" },
    { href: "/superadmin/categorias", label: "Categorías", icon: "BarChart3" },
    { href: "/superadmin/compras", label: "Compras", icon: "ShoppingCart" },
    { href: "/superadmin/cotizaciones", label: "Cotizaciones", icon: "FileText" },
    { href: "/superadmin/roles", label: "Roles", icon: "Settings" },
  ]

  return (
    <>
      <Navbar />
      <div className="flex pt-16">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-900 text-white min-h-screen">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-8">Panel Admin</h2>
            <nav className="space-y-2">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  {item.label === "Dashboard" && <LayoutDashboard className="w-5 h-5" />}
                  {item.label === "Usuarios" && <Users className="w-5 h-5" />}
                  {item.label === "Productos" && <Box className="w-5 h-5" />}
                  {item.label === "Categorías" && <BarChart3 className="w-5 h-5" />}
                  {item.label === "Compras" && <ShoppingCart className="w-5 h-5" />}
                  {item.label === "Cotizaciones" && <FileText className="w-5 h-5" />}
                  {item.label === "Roles" && <Settings className="w-5 h-5" />}
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 bg-gray-50">
          {children}
        </main>
      </div>
    </>
  )
}
