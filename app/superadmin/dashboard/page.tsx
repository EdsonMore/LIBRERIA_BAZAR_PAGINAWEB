'use dynamic'

import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { query } from "@/lib/db"

async function obtenerMetricas() {
  try {
    // Totales generales
    const totalProductos = await query("SELECT COUNT(*) as count FROM productos WHERE disponible = true")
    const totalUsuarios = await query("SELECT COUNT(*) as count FROM usuarios")
    
    // Ventas totales PAGADAS (coherencia con deudas)
    const totalVentas = await query(`
      SELECT 
        COUNT(*) as cantidad,
        COALESCE(SUM(total), 0) as monto
      FROM ventas
      WHERE estado_pago = 'PAGADO'
    `)
    
    // Ingresos últimos 30 días (solo pagadas)
    const ingresosUltimos30 = await query(`
      SELECT 
        COALESCE(SUM(total), 0) as total,
        COUNT(*) as cantidad
      FROM ventas
      WHERE estado_pago = 'PAGADO'
      AND fecha_hora >= NOW() - INTERVAL '30 days'
    `)
    
    // Ventas por día (últimos 7 días) - solo pagadas
    const ventasPorDia = await query(`
      SELECT 
        DATE(fecha_hora) as dia,
        COUNT(*) as cantidad,
        COALESCE(SUM(total), 0) as total
      FROM ventas
      WHERE estado_pago = 'PAGADO'
      AND fecha_hora >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(fecha_hora)
      ORDER BY dia ASC
    `)

    // Top 5 productos más vendidos (solo ventas pagadas)
    const topProductos = await query(`
      SELECT 
        p.nombre,
        COUNT(dv.id) as cantidad_vendida,
        COALESCE(SUM(dv.cantidad * dv.precio_unitario), 0) as ingresos
      FROM productos p
      JOIN detalles_venta dv ON p.id = dv.producto_id
      JOIN ventas v ON dv.venta_id = v.id
      WHERE v.estado_pago = 'PAGADO'
      GROUP BY p.id, p.nombre
      ORDER BY cantidad_vendida DESC
      LIMIT 5
    `)

    // Crecimiento mes actual vs mes anterior (solo pagadas)
    const mesActual = await query(`
      SELECT COALESCE(SUM(total), 0) as total
      FROM ventas
      WHERE estado_pago = 'PAGADO'
      AND EXTRACT(YEAR FROM fecha_hora) = EXTRACT(YEAR FROM NOW())
      AND EXTRACT(MONTH FROM fecha_hora) = EXTRACT(MONTH FROM NOW())
    `)

    const mesPasado = await query(`
      SELECT COALESCE(SUM(total), 0) as total
      FROM ventas
      WHERE estado_pago = 'PAGADO'
      AND EXTRACT(YEAR FROM fecha_hora) = EXTRACT(YEAR FROM NOW())
      AND EXTRACT(MONTH FROM fecha_hora) = EXTRACT(MONTH FROM NOW() - INTERVAL '1 month')
    `)

    // Ticket promedio (últimos 30 días) - solo pagadas
    const ticketPromedio = await query(`
      SELECT COALESCE(AVG(total), 0) as promedio
      FROM ventas
      WHERE estado_pago = 'PAGADO'
      AND fecha_hora >= NOW() - INTERVAL '30 days'
    `)

    // Productos sin stock
    const productosSinStock = await query("SELECT COUNT(*) as count FROM productos WHERE disponible = false")

    // Ingresos totales históricos (solo pagadas)
    const ingresosHistoricos = await query(`
      SELECT COALESCE(SUM(total), 0) as total
      FROM ventas
      WHERE estado_pago = 'PAGADO'
    `)

    const mesActualTotal = parseFloat(mesActual[0]?.total || 0)
    const mesPasadoTotal = parseFloat(mesPasado[0]?.total || 0)
    const crecimiento = mesPasadoTotal > 0 ? ((mesActualTotal - mesPasadoTotal) / mesPasadoTotal * 100).toFixed(1) : 0

    return {
      totalProductos: parseInt(totalProductos[0]?.count || 0),
      productosSinStock: parseInt(productosSinStock[0]?.count || 0),
      totalUsuarios: parseInt(totalUsuarios[0]?.count || 0),
      totalVentas: parseInt(totalVentas[0]?.cantidad || 0),
      totalIngresos: parseFloat(ingresosHistoricos[0]?.total || 0),
      ingresosUltimos30: parseFloat(ingresosUltimos30[0]?.total || 0),
      ventasUltimos30: parseInt(ingresosUltimos30[0]?.cantidad || 0),
      ticketPromedio: parseFloat(ticketPromedio[0]?.promedio || 0),
      ventasPorDia,
      topProductos,
      crecimiento: parseFloat(crecimiento),
      mesActual: mesActualTotal,
      mesPasado: mesPasadoTotal,
    }
  } catch (error) {
    console.error("Error al obtener métricas:", error)
    return {
      totalProductos: 0,
      productosSinStock: 0,
      totalUsuarios: 0,
      totalVentas: 0,
      totalIngresos: 0,
      ingresosUltimos30: 0,
      ventasUltimos30: 0,
      ticketPromedio: 0,
      ventasPorDia: [],
      topProductos: [],
      crecimiento: 0,
      mesActual: 0,
      mesPasado: 0,
    }
  }
}

export default async function SuperAdminDashboard() {
  const session = await getSession()
  if (!session || !session.roles?.includes("ROLE_SUPER_ADMIN")) {
    redirect("/acceso-denegado")
  }

  const metricas = await obtenerMetricas()

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">📊 Dashboard</h1>
        <p className="text-gray-600 text-sm md:text-base mt-2">Métricas y análisis en tiempo real de tu negocio</p>
      </div>

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Ingresos Últimos 30 Días */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 text-sm font-medium mb-1">Ingresos (30d)</h3>
              <p className="text-3xl font-bold text-gray-900">S/ {metricas.ingresosUltimos30.toFixed(2)}</p>
              <p className="text-xs text-green-600 mt-2">📈 {metricas.ventasUltimos30} ventas</p>
            </div>
            <div className="text-4xl">💰</div>
          </div>
        </div>

        {/* Ventas Totales */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 text-sm font-medium mb-1">Total Ventas</h3>
              <p className="text-3xl font-bold text-gray-900">{metricas.totalVentas}</p>
              <p className="text-xs text-gray-600 mt-2">📦 Transacciones registradas</p>
            </div>
            <div className="text-4xl">🛒</div>
          </div>
        </div>

        {/* Ticket Promedio */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 text-sm font-medium mb-1">Ticket Promedio</h3>
              <p className="text-3xl font-bold text-gray-900">S/ {metricas.ticketPromedio.toFixed(2)}</p>
              <p className="text-xs text-gray-600 mt-2">💵 Gasto promedio/venta</p>
            </div>
            <div className="text-4xl">📊</div>
          </div>
        </div>

        {/* Crecimiento MoM */}
        <div className={`bg-white rounded-lg shadow p-6 border-l-4 ${metricas.crecimiento >= 0 ? 'border-green-500' : 'border-red-500'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 text-sm font-medium mb-1">Crecimiento MoM</h3>
              <p className={`text-3xl font-bold ${metricas.crecimiento >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {metricas.crecimiento > 0 ? '+' : ''}{metricas.crecimiento}%
              </p>
              <p className="text-xs text-gray-600 mt-2">📈 vs mes anterior</p>
            </div>
            <div className="text-4xl">{metricas.crecimiento >= 0 ? '📈' : '📉'}</div>
          </div>
        </div>
      </div>

      {/* Productos y Usuarios */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
          <h3 className="text-gray-500 text-sm font-medium mb-3">Catálogo</h3>
          <p className="text-3xl font-bold text-gray-900">{metricas.totalProductos}</p>
          <p className="text-xs text-orange-600 mt-2">✓ Productos disponibles</p>
          {metricas.productosSinStock > 0 && (
            <p className="text-xs text-red-600 mt-1">⚠️ {metricas.productosSinStock} sin stock</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-indigo-500">
          <h3 className="text-gray-500 text-sm font-medium mb-3">Usuarios</h3>
          <p className="text-3xl font-bold text-gray-900">{metricas.totalUsuarios}</p>
          <p className="text-xs text-indigo-600 mt-2">👥 Registrados en el sistema</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-cyan-500">
          <h3 className="text-gray-500 text-sm font-medium mb-3">Ingresos Totales</h3>
          <p className="text-3xl font-bold text-gray-900">S/ {metricas.totalIngresos.toFixed(2)}</p>
          <p className="text-xs text-cyan-600 mt-2">💎 Histórico</p>
        </div>
      </div>

      {/* Top Productos */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">🏆 Productos Más Vendidos</h2>
        {metricas.topProductos.length === 0 ? (
          <p className="text-gray-600 text-center py-8">Sin datos disponibles</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Producto</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">Cantidad</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Ingresos</th>
                </tr>
              </thead>
              <tbody>
                {metricas.topProductos.map((producto, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{producto.nombre}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                        {producto.cantidad_vendida}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-green-600">
                      S/ {parseFloat(producto.ingresos).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ventas por Día */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">📈 Ventas Últimos 7 Días</h2>
        {metricas.ventasPorDia.length === 0 ? (
          <p className="text-gray-600 text-center py-8">Sin datos disponibles</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="space-y-3">
              {metricas.ventasPorDia.map((dia, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="w-20 text-sm font-medium text-gray-600">
                    {new Date(dia.dia).toLocaleDateString('es-PE', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-8 flex items-center relative overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-400 to-blue-600 h-full rounded-full transition-all"
                      style={{
                        width: `${(parseFloat(dia.total) / Math.max(...metricas.ventasPorDia.map(d => parseFloat(d.total)))) * 100}%`,
                      }}
                    />
                    <span className="absolute left-3 text-xs font-bold text-white">
                      S/ {parseFloat(dia.total).toFixed(2)}
                    </span>
                  </div>
                  <div className="w-20 text-right">
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      {dia.cantidad} venta{dia.cantidad !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Resumen Comparativo */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">📅 Comparativa Mensual</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-gray-600 text-sm mb-2">Este Mes</p>
            <p className="text-2xl font-bold text-gray-900">S/ {metricas.mesActual.toFixed(2)}</p>
          </div>
          <div className="flex items-center justify-center">
            <p className="text-4xl font-bold text-gray-300">→</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm mb-2">Mes Pasado</p>
            <p className="text-2xl font-bold text-gray-900">S/ {metricas.mesPasado.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
