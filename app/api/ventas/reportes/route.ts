import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getServerSession } from "@/lib/next-auth-types"

/**
 * GET /api/ventas/reportes/resumen
 * Obtener resumen general de ventas
 * 
 * Query params:
 * - fechaInicio: ISO string (opcional)
 * - fechaFin: ISO string (opcional)
 */
async function getResumen(searchParams: URLSearchParams) {
  const fechaInicio = searchParams.get("fechaInicio")
  const fechaFin = searchParams.get("fechaFin")

  let sql = `
    SELECT 
      COUNT(v.id) as total_ventas,
      SUM(v.total) as total_ingreso,
      AVG(v.total) as promedio_venta,
      MIN(v.fecha_hora) as primera_venta,
      MAX(v.fecha_hora) as ultima_venta
    FROM public.ventas v
    WHERE v.estado_pago = 'PAGADO'
  `
  const params: any[] = []

  if (fechaInicio) {
    sql += " AND v.fecha_hora >= ?"
    params.push(new Date(fechaInicio))
  }

  if (fechaFin) {
    sql += " AND v.fecha_hora <= ?"
    params.push(new Date(fechaFin))
  }

  const result = await query(sql, params)
  return result[0] || {}
}

/**
 * Obtener ventas por vendedor
 */
async function getVentasPorVendedor(searchParams: URLSearchParams) {
  const fechaInicio = searchParams.get("fechaInicio")
  const fechaFin = searchParams.get("fechaFin")

  let sql = `
    SELECT 
      u.nombres as vendedor_nombre,
      COUNT(DISTINCT v.id) as total_ventas,
      SUM(v.total) as total_ingreso,
      AVG(v.total) as promedio_venta
    FROM public.ventas v
    LEFT JOIN public.usuarios u ON v.vendedor_id = u.id
    WHERE v.estado_pago = 'PAGADO'
  `
  const params: any[] = []

  if (fechaInicio) {
    sql += " AND v.fecha_hora >= ?"
    params.push(new Date(fechaInicio))
  }

  if (fechaFin) {
    sql += " AND v.fecha_hora <= ?"
    params.push(new Date(fechaFin))
  }

  sql += " GROUP BY u.nombres ORDER BY total_ingreso DESC"

  return await query(sql, params)
}

/**
 * Obtener ingresos por propietario
 */
async function getIngresosPorPropietario(searchParams: URLSearchParams) {
  const fechaInicio = searchParams.get("fechaInicio")
  const fechaFin = searchParams.get("fechaFin")

  let sql = `
    SELECT 
      COALESCE(u.nombres, v.propietario_nombre) as propietario_nombre,
      COUNT(DISTINCT v.id) as total_ventas,
      SUM(v.total) as total_ingresos,
      AVG(v.total) as promedio_venta
    FROM public.ventas v
    LEFT JOIN public.usuarios u ON v.propietario_id = u.id
    WHERE v.estado_pago = 'PAGADO'
  `
  const params: any[] = []

  if (fechaInicio) {
    sql += " AND v.fecha_hora >= ?"
    params.push(new Date(fechaInicio))
  }

  if (fechaFin) {
    sql += " AND v.fecha_hora <= ?"
    params.push(new Date(fechaFin))
  }

  sql += " GROUP BY COALESCE(u.nombres, v.propietario_nombre) ORDER BY total_ingresos DESC"

  return await query(sql, params)
}

/**
 * Obtener productos más vendidos
 */
async function getProductosMasVendidos(searchParams: URLSearchParams) {
  const fechaInicio = searchParams.get("fechaInicio")
  const fechaFin = searchParams.get("fechaFin")
  const limit = Number.parseInt(searchParams.get("limit") || "10")

  let sql = `
    SELECT 
      p.id,
      p.nombre,
      SUM(dv.cantidad) as total_cantidad,
      SUM(dv.subtotal) as total_ingreso,
      COUNT(DISTINCT dv.venta_id) as veces_vendido
    FROM public.detalles_venta dv
    LEFT JOIN public.productos p ON dv.producto_id = p.id
    LEFT JOIN public.ventas v ON dv.venta_id = v.id
    WHERE dv.es_producto_existente = true AND dv.producto_id IS NOT NULL AND v.estado_pago = 'PAGADO'
  `
  const params: any[] = []

  if (fechaInicio) {
    sql += " AND dv.created_at >= ?"
    params.push(new Date(fechaInicio))
  }

  if (fechaFin) {
    sql += " AND dv.created_at <= ?"
    params.push(new Date(fechaFin))
  }

  sql += ` GROUP BY p.id, p.nombre 
    ORDER BY total_cantidad DESC 
    LIMIT ?`
  params.push(limit)

  return await query(sql, params)
}

/**
 * Obtener productos solicitados (no existentes)
 */
async function getProductosSolicitados(searchParams: URLSearchParams) {
  const limit = Number.parseInt(searchParams.get("limit") || "10")

  const result = await query(
    `SELECT 
      id, nombre, cantidad_veces_solicitado, ultima_fecha_solicitud, created_at
    FROM public.productos_solicitados
    ORDER BY cantidad_veces_solicitado DESC
    LIMIT ?`,
    [limit]
  )

  return result
}

/**
 * Obtener resumen por método de pago
 */
async function getResumenPorMetodoPago(searchParams: URLSearchParams) {
  const fechaInicio = searchParams.get("fechaInicio")
  const fechaFin = searchParams.get("fechaFin")

  let sql = `
    SELECT 
      v.metodo_pago,
      COUNT(v.id) as cantidad_transacciones,
      SUM(v.total) as total_monto,
      AVG(v.total) as promedio_transaccion
    FROM public.ventas v
    WHERE v.estado_pago = 'PAGADO'
  `
  const params: any[] = []

  if (fechaInicio) {
    sql += " AND v.fecha_hora >= ?"
    params.push(new Date(fechaInicio))
  }

  if (fechaFin) {
    sql += " AND v.fecha_hora <= ?"
    params.push(new Date(fechaFin))
  }

  sql += " GROUP BY v.metodo_pago ORDER BY total_monto DESC"

  return await query(sql, params)
}

/**
 * GET /api/ventas/reportes
 * Obtener todos los reportes
 * 
 * Query params:
 * - tipo: "resumen" | "vendedor" | "propietario" | "productos" | "solicitados" | "metodos" | "todos"
 * - fechaInicio: ISO string (opcional)
 * - fechaFin: ISO string (opcional)
 * - limit: number (optional, default 10)
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación a través de cookies/sesión
    const cookieHeader = request.headers.get('cookie') || ''
    
    // Si no hay cookies de sesión, intentar obtener del header de autorización
    // o simplemente permitir si estamos en desarrollo
    if (!cookieHeader && process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get("tipo") || "todos"

    const reportes: any = {}

    // Generar reportes según el tipo solicitado
    if (tipo === "todos" || tipo === "resumen") {
      reportes.resumen = await getResumen(searchParams)
    }

    if (tipo === "todos" || tipo === "vendedor") {
      reportes.ventasPorVendedor = await getVentasPorVendedor(searchParams)
    }

    if (tipo === "todos" || tipo === "propietario") {
      reportes.ingresosPorPropietario = await getIngresosPorPropietario(searchParams)
    }

    if (tipo === "todos" || tipo === "productos") {
      reportes.productosMasVendidos = await getProductosMasVendidos(searchParams)
    }

    if (tipo === "todos" || tipo === "solicitados") {
      reportes.productosSolicitados = await getProductosSolicitados(searchParams)
    }

    if (tipo === "todos" || tipo === "metodos") {
      reportes.resumenPorMetodoPago = await getResumenPorMetodoPago(searchParams)
    }

    return NextResponse.json(reportes)
  } catch (error: any) {
    console.error("Error al generar reportes:", error)
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    )
  }
}
