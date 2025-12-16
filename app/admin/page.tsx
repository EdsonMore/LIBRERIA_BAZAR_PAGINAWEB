"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Navbar from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"
import { Package, ShoppingCart, Users, Star, TrendingUp, DollarSign } from "lucide-react"

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<any>({ totalProductos: 0, totalCompras: 0, totalUsuarios: 0, totalResenas: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarEstadisticas()
  }, [])

  const cargarEstadisticas = async () => {
    try {
      const res = await fetch("/api/admin/estadisticas")
      if (!res.ok) {
        if (res.status === 403 || res.status === 401) {
          router.push("/acceso-denegado")
        }
        return
      }
      const data = await res.json()
      setStats(data)
      setLoading(false)
    } catch (error) {
      console.error(error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#667eea] border-t-transparent"></div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Panel de Administración</h1>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Package className="w-8 h-8" />
              <span className="text-3xl font-bold">{stats.totalProductos}</span>
            </div>
            <h3 className="text-lg font-semibold">Total Productos</h3>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <ShoppingCart className="w-8 h-8" />
              <span className="text-3xl font-bold">{stats.totalCompras}</span>
            </div>
            <h3 className="text-lg font-semibold">Total Compras</h3>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8" />
              <span className="text-3xl font-bold">{stats.totalUsuarios}</span>
            </div>
            <h3 className="text-lg font-semibold">Total Usuarios</h3>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Star className="w-8 h-8" />
              <span className="text-3xl font-bold">{stats.totalResenas}</span>
            </div>
            <h3 className="text-lg font-semibold">Total Reseñas</h3>
          </div>
        </div>

        {/* Menú de gestión */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/admin/productos"
            className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-[#667eea]"
          >
            <Package className="w-12 h-12 text-[#667eea] mb-4" />
            <h3 className="text-xl font-bold mb-2">Gestión de Productos</h3>
            <p className="text-gray-600">Administrar productos, categorías y stock</p>
          </Link>

          <Link
            href="/admin/compras"
            className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-[#667eea]"
          >
            <ShoppingCart className="w-12 h-12 text-[#667eea] mb-4" />
            <h3 className="text-xl font-bold mb-2">Gestión de Compras</h3>
            <p className="text-gray-600">Ver y gestionar pedidos de clientes</p>
          </Link>

          <Link
            href="/admin/usuarios"
            className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-[#667eea]"
          >
            <Users className="w-12 h-12 text-[#667eea] mb-4" />
            <h3 className="text-xl font-bold mb-2">Gestión de Usuarios</h3>
            <p className="text-gray-600">Administrar usuarios y roles</p>
          </Link>

          <Link
            href="/admin/resenas"
            className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-[#667eea]"
          >
            <Star className="w-12 h-12 text-[#667eea] mb-4" />
            <h3 className="text-xl font-bold mb-2">Gestión de Reseñas</h3>
            <p className="text-gray-600">Aprobar o rechazar reseñas de productos</p>
          </Link>

          <Link
            href="/admin/reportes"
            className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-[#667eea]"
          >
            <TrendingUp className="w-12 h-12 text-[#667eea] mb-4" />
            <h3 className="text-xl font-bold mb-2">Reportes</h3>
            <p className="text-gray-600">Estadísticas y reportes de ventas</p>
          </Link>

          <Link
            href="/admin/configuracion"
            className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-[#667eea]"
          >
            <DollarSign className="w-12 h-12 text-[#667eea] mb-4" />
            <h3 className="text-xl font-bold mb-2">Configuración</h3>
            <p className="text-gray-600">IGV, envío y ajustes del sistema</p>
          </Link>
        </div>

        {/* Compras recientes */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Compras Recientes</h2>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.comprasRecientes?.map((compra: any) => (
                  <tr key={compra.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{compra.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{compra.usuario_nombre}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                      S/ {compra.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="badge bg-primary text-xs">{compra.estado}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(compra.fechaCompra).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Footer />
    </>
  )
}
