'use dynamic'

import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { query } from "@/lib/db"

async function obtenerEstadisticas() {
  try {
    const totalProductos = await query("SELECT COUNT(*) as count FROM productos")
    const productosDisponibles = await query("SELECT COUNT(*) as count FROM productos WHERE disponible = true")
    const totalCategorias = await query("SELECT COUNT(*) as count FROM categorias")
    const totalCompras = await query("SELECT COUNT(*) as count FROM compras")
    const ventasTotales = await query("SELECT COALESCE(SUM(total), 0) as total FROM compras WHERE estado = 'ENTREGADA'")

    return {
      totalProductos: parseInt(totalProductos[0].count) || 0,
      productosDisponibles: parseInt(productosDisponibles[0].count) || 0,
      totalCategorias: parseInt(totalCategorias[0].count) || 0,
      totalCompras: parseInt(totalCompras[0].count) || 0,
      ventasTotales: parseFloat(ventasTotales[0].total) || 0,
    }
  } catch (error) {
    console.error("Error al obtener estadísticas:", error)
    return {
      totalProductos: 0,
      productosDisponibles: 0,
      totalCategorias: 0,
      totalCompras: 0,
      ventasTotales: 0,
    }
  }
}

export default async function SuperAdminDashboard() {
  const session = await getSession()
  if (!session || !session.roles?.includes("ROLE_SUPER_ADMIN")) {
    redirect("/acceso-denegado")
  }

  const stats = await obtenerEstadisticas()

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Panel SuperAdmin</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Total Productos</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.totalProductos}</p>
          <p className="text-sm text-gray-600 mt-2">{stats.productosDisponibles} disponibles</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Categorías</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.totalCategorias}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Total Compras</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.totalCompras}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Ventas Totales</h3>
          <p className="text-3xl font-bold text-green-600">S/ {stats.ventasTotales.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <a
          href="/superadmin/productos"
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white hover:shadow-xl transition-shadow"
        >
          <h3 className="text-xl font-bold mb-2">Gestionar Productos</h3>
          <p className="text-blue-100">Crear, editar y administrar productos</p>
        </a>

        <a
          href="/superadmin/categorias"
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white hover:shadow-xl transition-shadow"
        >
          <h3 className="text-xl font-bold mb-2">Gestionar Categorías</h3>
          <p className="text-purple-100">Administrar categorías de productos</p>
        </a>

        <a
          href="/superadmin/usuarios"
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white hover:shadow-xl transition-shadow"
        >
          <h3 className="text-xl font-bold mb-2">Gestionar Usuarios</h3>
          <p className="text-green-100">Ver y administrar usuarios del sistema</p>
        </a>

        <a
          href="/superadmin/compras"
          className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white hover:shadow-xl transition-shadow"
        >
          <h3 className="text-xl font-bold mb-2">Ver Compras</h3>
          <p className="text-orange-100">Revisar todas las compras realizadas</p>
        </a>

        <a
          href="/superadmin/configuracion"
          className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg p-6 text-white hover:shadow-xl transition-shadow"
        >
          <h3 className="text-xl font-bold mb-2">Configuración</h3>
          <p className="text-red-100">IGV, envío y otras configuraciones</p>
        </a>

        <a
          href="/superadmin/roles"
          className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow-lg p-6 text-white hover:shadow-xl transition-shadow"
        >
          <h3 className="text-xl font-bold mb-2">Roles y Permisos</h3>
          <p className="text-indigo-100">Gestionar roles del sistema</p>
        </a>
      </div>
    </div>
  )
}
