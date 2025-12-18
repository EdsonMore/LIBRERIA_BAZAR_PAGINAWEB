import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

/**
 * GET /api/ventas/reportes/metricas-diarias
 * Obtiene métricas diarias por propietario:
 * - Ventas por día
 * - Productos vendidos por día
 * - Ingresos por día
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const fechaInicio = searchParams.get("fechaInicio")
    const fechaFin = searchParams.get("fechaFin")
    const propietarioId = searchParams.get("propietarioId")

    // Métricas por propietario y día
    let sqlMetricasPorPropietario = `
      SELECT 
        DATE(v.fecha_hora) as fecha,
        INITCAP(TRIM(COALESCE(u.nombres, v.propietario_nombre))) as propietario_nombre,
        COUNT(DISTINCT v.id) as ventas_del_dia,
        SUM(v.total) as ingreso_del_dia,
        AVG(v.total) as promedio_venta_dia,
        SUM(dv.cantidad) as productos_vendidos_dia,
        COUNT(DISTINCT dv.producto_id) as cantidad_producto_diferentes
      FROM public.ventas v
      LEFT JOIN public.usuarios u ON v.propietario_id = u.id
      LEFT JOIN (
        SELECT venta_id, SUM(cantidad) as cantidad, COUNT(DISTINCT producto_id) as producto_id
        FROM public.detalles_venta
        GROUP BY venta_id
      ) dv ON v.id = dv.venta_id
      WHERE v.estado_pago = 'PAGADO'
    `
    const params: any[] = []

    if (fechaInicio) {
      sqlMetricasPorPropietario += " AND v.fecha_hora >= ?"
      params.push(new Date(fechaInicio))
    }

    if (fechaFin) {
      sqlMetricasPorPropietario += " AND v.fecha_hora <= ?"
      params.push(new Date(fechaFin))
    }

    if (propietarioId) {
      sqlMetricasPorPropietario += " AND v.propietario_id = ?"
      params.push(Number(propietarioId))
    }

    sqlMetricasPorPropietario += `
      GROUP BY DATE(v.fecha_hora), INITCAP(TRIM(COALESCE(u.nombres, v.propietario_nombre)))
      ORDER BY fecha DESC, propietario_nombre ASC
    `

    const metricasPorPropietario = await query(sqlMetricasPorPropietario, params)

    // Resumen consolidado por propietario
    let sqlResumenPropietario = `
      SELECT 
        INITCAP(TRIM(COALESCE(u.nombres, v.propietario_nombre))) as propietario_nombre,
        COUNT(DISTINCT DATE(v.fecha_hora)) as dias_con_ventas,
        COUNT(DISTINCT v.id) as total_ventas,
        SUM(v.total) as total_ingreso,
        AVG(v.total) as promedio_venta,
        COALESCE(SUM(dv.cantidad), 0) as total_productos_vendidos,
        MIN(DATE(v.fecha_hora)) as primer_dia_venta,
        MAX(DATE(v.fecha_hora)) as ultimo_dia_venta
      FROM public.ventas v
      LEFT JOIN public.usuarios u ON v.propietario_id = u.id
      LEFT JOIN (
        SELECT venta_id, SUM(cantidad) as cantidad 
        FROM public.detalles_venta 
        GROUP BY venta_id
      ) dv ON v.id = dv.venta_id
      WHERE v.estado_pago = 'PAGADO'
    `
    const paramsResumen: any[] = []

    if (fechaInicio) {
      sqlResumenPropietario += " AND v.fecha_hora >= ?"
      paramsResumen.push(new Date(fechaInicio))
    }

    if (fechaFin) {
      sqlResumenPropietario += " AND v.fecha_hora <= ?"
      paramsResumen.push(new Date(fechaFin))
    }

    if (propietarioId) {
      sqlResumenPropietario += " AND v.propietario_id = ?"
      paramsResumen.push(Number(propietarioId))
    }

    sqlResumenPropietario += `
      GROUP BY INITCAP(TRIM(COALESCE(u.nombres, v.propietario_nombre)))
      ORDER BY total_ingreso DESC
    `

    const resumenPropietario = await query(sqlResumenPropietario, paramsResumen)

    // Productos vendidos por propietario (desglose)
    let sqlProductosPorPropietario = `
      SELECT 
        INITCAP(TRIM(COALESCE(u.nombres, v.propietario_nombre))) as propietario_nombre,
        p.id as producto_id,
        p.nombre as producto_nombre,
        SUM(dv.cantidad) as cantidad_vendida,
        COUNT(DISTINCT dv.venta_id) as veces_vendido,
        SUM(dv.subtotal) as ingreso_producto,
        AVG(dv.precio_unitario) as precio_promedio
      FROM public.ventas v
      LEFT JOIN public.usuarios u ON v.propietario_id = u.id
      LEFT JOIN public.detalles_venta dv ON v.id = dv.venta_id
      LEFT JOIN public.productos p ON dv.producto_id = p.id
      WHERE v.estado_pago = 'PAGADO' AND dv.es_producto_existente = true AND dv.producto_id IS NOT NULL
    `
    const paramsProductos: any[] = []

    if (fechaInicio) {
      sqlProductosPorPropietario += " AND v.fecha_hora >= ?"
      paramsProductos.push(new Date(fechaInicio))
    }

    if (fechaFin) {
      sqlProductosPorPropietario += " AND v.fecha_hora <= ?"
      paramsProductos.push(new Date(fechaFin))
    }

    if (propietarioId) {
      sqlProductosPorPropietario += " AND v.propietario_id = ?"
      paramsProductos.push(Number(propietarioId))
    }

    sqlProductosPorPropietario += `
      GROUP BY INITCAP(TRIM(COALESCE(u.nombres, v.propietario_nombre))), p.id, p.nombre
      ORDER BY propietario_nombre ASC, cantidad_vendida DESC
    `

    const productosPorPropietario = await query(sqlProductosPorPropietario, paramsProductos)

    return NextResponse.json({
      success: true,
      metricasPorPropietario,
      resumenPropietario,
      productosPorPropietario,
    })
  } catch (error: any) {
    console.error("Error en GET /api/ventas/reportes/metricas-diarias:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Error al obtener métricas diarias" },
      { status: 500 }
    )
  }
}
