import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

/**
 * GET /api/deudas/historial
 * Obtener historial de deudas pagadas y canceladas
 * 
 * Query params:
 * - tipo: "PAGADO" | "CANCELADO" | "TODOS" (default: TODOS)
 * - clienteId: number (opcional)
 * - fechaInicio: ISO string (opcional)
 * - fechaFin: ISO string (opcional)
 * - busqueda: string - busca en nombre, email, teléfono (opcional)
 * - page: number (default 1)
 * - limit: number (default 20)
 */
export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || ''
    if (!cookieHeader && process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get("tipo") || "TODOS"
    const clienteId = searchParams.get("clienteId")
    const fechaInicio = searchParams.get("fechaInicio")
    const fechaFin = searchParams.get("fechaFin")
    const busqueda = searchParams.get("busqueda")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = (page - 1) * limit

    let sql = `
      SELECT 
        v.id as venta_id,
        v.fecha_hora,
        v.cliente_id,
        COALESCE(u.nombres, v.cliente_nombre) as cliente_nombre,
        COALESCE(u.correo, v.cliente_email) as cliente_email,
        v.cliente_telefono,
        v.total,
        v.monto_pagado,
        v.saldo_pendiente,
        v.estado_pago,
        v.metodo_pago,
        v.propietario_id,
        pr.nombres as propietario_nombre,
        cd.motivo as cancelacion_motivo,
        cd.saldo_perdonado,
        cd.fecha_hora as fecha_cancelacion,
        CASE 
          WHEN v.estado_pago = 'PAGADO' THEN 'Pagada'
          WHEN v.estado_pago = 'CANCELADO' THEN 'Cancelada'
          ELSE 'Otro'
        END as tipo_deuda
      FROM public.ventas v
      LEFT JOIN public.usuarios u ON v.cliente_id = u.id
      LEFT JOIN public.usuarios pr ON v.propietario_id = pr.id
      LEFT JOIN public.cancelaciones_deuda cd ON v.id = cd.venta_id
      WHERE (v.estado_pago = 'PAGADO' OR v.estado_pago = 'CANCELADO')
    `
    const params: any[] = []

    if (tipo !== "TODOS") {
      sql += " AND v.estado_pago = ?"
      params.push(tipo)
    }

    if (clienteId) {
      sql += " AND (v.cliente_id = ? OR v.cliente_id IS NULL)"
      params.push(clienteId)
    }

    if (fechaInicio) {
      sql += " AND v.fecha_hora >= ?"
      params.push(new Date(fechaInicio))
    }

    if (fechaFin) {
      sql += " AND v.fecha_hora <= ?"
      params.push(new Date(fechaFin))
    }

    if (busqueda) {
      sql += ` AND (
        LOWER(COALESCE(u.nombres, v.cliente_nombre)) LIKE LOWER(?)
        OR LOWER(COALESCE(u.correo, v.cliente_email)) LIKE LOWER(?)
        OR v.cliente_telefono LIKE ?
      )`
      params.push(`%${busqueda}%`, `%${busqueda}%`, `%${busqueda}%`)
    }

    sql += ` ORDER BY v.fecha_hora DESC LIMIT ? OFFSET ?`
    params.push(limit, offset)

    const deudas = await query(sql, params)

    // Obtener total
    let countSql = `
      SELECT COUNT(*) as total FROM public.ventas v
      LEFT JOIN public.usuarios u ON v.cliente_id = u.id
      WHERE (v.estado_pago = 'PAGADO' OR v.estado_pago = 'CANCELADO')
    `
    const countParams: any[] = []

    if (tipo !== "TODOS") {
      countSql += " AND v.estado_pago = ?"
      countParams.push(tipo)
    }
    if (clienteId) {
      countSql += " AND (v.cliente_id = ? OR v.cliente_id IS NULL)"
      countParams.push(clienteId)
    }
    if (fechaInicio) {
      countSql += " AND v.fecha_hora >= ?"
      countParams.push(new Date(fechaInicio))
    }
    if (fechaFin) {
      countSql += " AND v.fecha_hora <= ?"
      countParams.push(new Date(fechaFin))
    }
    if (busqueda) {
      countSql += ` AND (
        LOWER(COALESCE(u.nombres, v.cliente_nombre)) LIKE LOWER(?)
        OR LOWER(COALESCE(u.correo, v.cliente_email)) LIKE LOWER(?)
        OR v.cliente_telefono LIKE ?
      )`
      countParams.push(`%${busqueda}%`, `%${busqueda}%`, `%${busqueda}%`)
    }

    const [countResult] = await query(countSql, countParams)
    const totalIngreso = await query(
      `SELECT SUM(v.total) as total FROM public.ventas v
       WHERE v.estado_pago = 'PAGADO'`
    )

    return NextResponse.json({
      deudas,
      pagination: {
        page,
        limit,
        total: countResult?.total || 0,
        totalPages: Math.ceil((countResult?.total || 0) / limit),
      },
      resumen: {
        totalIngresosPagados: totalIngreso[0]?.total || 0,
      },
    })
  } catch (error: any) {
    console.error("Error al obtener historial de deudas:", error)
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    )
  }
}
