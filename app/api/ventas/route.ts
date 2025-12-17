import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getServerSession } from "@/lib/next-auth-types"

/**
 * POST /api/ventas
 * Registrar una nueva venta
 * 
 * Body esperado:
 * {
 *   vendedorId: number
 *   propietarioId: number
 *   metodoPago: "EFECTIVO" | "YAPE" | "PLIN" | "TRANSFERENCIA" | "OTRO"
 *   descripcionMetodoOtro?: string
 *   clienteId?: number
 *   clienteNombre?: string
 *   clienteEmail?: string
 *   clienteTelefono?: string
 *   subtotal: number
 *   descuento: number
 *   montoPagado?: number (default 0 - para pagos iniciales)
 *   detalles: [
 *     {
 *       productoId?: number
 *       nombreProducto: string
 *       cantidad: number
 *       precioUnitario: number
 *     }
 *   ]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación a través de cookies/sesión
    const cookieHeader = request.headers.get('cookie') || ''
    
    // Si no hay cookies de sesión en producción, rechazar
    if (!cookieHeader && process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validaciones básicas
    const tienePropietarioExistente = !!body.propietarioId
    const tienePropietarioManual = !!body.propietarioNombre?.trim()

    if (!body.vendedorId || (!tienePropietarioExistente && !tienePropietarioManual) || !body.metodoPago || !body.detalles?.length) {
      return NextResponse.json(
        { error: "Campos obligatorios: vendedorId, (propietarioId o propietarioNombre), metodoPago, detalles" },
        { status: 400 }
      )
    }

    // Validar método de pago
    const metodoPagosValidos = ["EFECTIVO", "YAPE", "PLIN", "TRANSFERENCIA", "OTRO"]
    if (!metodoPagosValidos.includes(body.metodoPago)) {
      return NextResponse.json(
        { error: `Método de pago inválido. Válidos: ${metodoPagosValidos.join(", ")}` },
        { status: 400 }
      )
    }

    if (body.metodoPago === "OTRO" && !body.descripcionMetodoOtro) {
      return NextResponse.json(
        { error: "descripcionMetodoOtro es requerido cuando metodoPago es OTRO" },
        { status: 400 }
      )
    }

    // Calcular total de la venta
    const totalDetalles = body.detalles.reduce(
      (sum: number, d: any) => sum + (d.cantidad * d.precioUnitario),
      0
    )

    const descuento = body.descuento || 0
    const total = totalDetalles - descuento

    if (total < 0) {
      return NextResponse.json(
        { error: "El total no puede ser negativo" },
        { status: 400 }
      )
    }

    // Procesar pago inicial
    const montoPagado = Math.max(0, body.montoPagado || 0)
    if (montoPagado > total) {
      return NextResponse.json(
        { error: `Monto pagado (${montoPagado}) no puede exceder el total (${total})` },
        { status: 400 }
      )
    }

    const saldoPendiente = total - montoPagado
    const estadoPago = 
      saldoPendiente === 0 ? 'PAGADO' :
      montoPagado > 0 ? 'PARCIAL' :
      'PENDIENTE'

    // Insertar venta
    const ventaResult = await query(
      `INSERT INTO public.ventas (
        vendedor_id, propietario_id, propietario_nombre, metodo_pago, descripcion_metodo_otro,
        cliente_id, cliente_nombre, cliente_email, cliente_telefono,
        subtotal, descuento, total, monto_pagado, saldo_pendiente, estado_pago
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING id, fecha_hora, created_at`,
      [
        body.vendedorId,
        body.propietarioId || null,
        body.propietarioNombre || null,
        body.metodoPago,
        body.descripcionMetodoOtro || null,
        body.clienteId || null,
        body.clienteNombre || null,
        body.clienteEmail || null,
        body.clienteTelefono || null,
        body.subtotal,
        descuento,
        total,
        montoPagado,
        saldoPendiente,
        estadoPago,
      ]
    )

    if (!ventaResult.length) {
      return NextResponse.json(
        { error: "Error al registrar la venta" },
        { status: 500 }
      )
    }

    const ventaId = ventaResult[0].id

    // Insertar detalles de venta
    for (const detalle of body.detalles) {
      const subtotal = detalle.cantidad * detalle.precioUnitario
      const esProductoExistente = !!detalle.productoId

      await query(
        `INSERT INTO public.detalles_venta (
          venta_id, producto_id, nombre_producto, cantidad, 
          precio_unitario, subtotal, es_producto_existente
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          ventaId,
          detalle.productoId || null,
          detalle.nombreProducto,
          detalle.cantidad,
          detalle.precioUnitario,
          subtotal,
          esProductoExistente,
        ]
      )

      // Si es producto no existente, agregarlo a productos_solicitados
      if (!esProductoExistente) {
        await query(
          `INSERT INTO public.productos_solicitados (nombre, cantidad_veces_solicitado)
           VALUES (?, 1)
           ON CONFLICT (nombre) DO UPDATE SET 
             cantidad_veces_solicitado = public.productos_solicitados.cantidad_veces_solicitado + 1,
             ultima_fecha_solicitud = CURRENT_TIMESTAMP`,
          [detalle.nombreProducto]
        )
      }
    }

    // Si hay pago inicial, registrarlo en tabla pagos
    if (montoPagado > 0) {
      await query(
        `INSERT INTO public.pagos (
          venta_id, monto, metodo_pago, usuario_id, es_pago_inicial
        ) VALUES (?, ?, ?, ?, true)`,
        [
          ventaId,
          montoPagado,
          body.metodoPago,
          body.vendedorId, // El vendedor registra el pago
        ]
      )
    }

    return NextResponse.json(
      {
        mensaje: "Venta registrada exitosamente",
        ventaId,
        total,
        montoPagado,
        saldoPendiente,
        estadoPago,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Error al registrar venta:", error)
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/ventas
 * Obtener listado de ventas con filtros opcionales
 * 
 * Query params:
 * - vendedorId: number (opcional)
 * - propietarioId: number (opcional)
 * - metodoPago: string (opcional)
 * - fechaInicio: ISO string (opcional)
 * - fechaFin: ISO string (opcional)
 * - page: number (default 1)
 * - limit: number (default 50)
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación a través de cookies/sesión
    const cookieHeader = request.headers.get('cookie') || ''
    
    // Si no hay cookies de sesión en producción, rechazar
    if (!cookieHeader && process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const vendedorId = searchParams.get("vendedorId")
    const propietarioId = searchParams.get("propietarioId")
    const metodoPago = searchParams.get("metodoPago")
    const fechaInicio = searchParams.get("fechaInicio")
    const fechaFin = searchParams.get("fechaFin")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = (page - 1) * limit

    let sql = `
      SELECT 
        v.*,
        ve.nombres as vendedor_nombre,
        pr.nombres as propietario_nombre
      FROM public.ventas v
      LEFT JOIN public.usuarios ve ON v.vendedor_id = ve.id
      LEFT JOIN public.usuarios pr ON v.propietario_id = pr.id
      WHERE 1=1
    `
    const params: any[] = []

    if (vendedorId) {
      sql += " AND v.vendedor_id = ?"
      params.push(vendedorId)
    }

    if (propietarioId) {
      sql += " AND v.propietario_id = ?"
      params.push(propietarioId)
    }

    if (metodoPago) {
      sql += " AND v.metodo_pago = ?"
      params.push(metodoPago)
    }

    if (fechaInicio) {
      sql += " AND v.fecha_hora >= ?"
      params.push(new Date(fechaInicio))
    }

    if (fechaFin) {
      sql += " AND v.fecha_hora <= ?"
      params.push(new Date(fechaFin))
    }

    sql += " ORDER BY v.fecha_hora DESC LIMIT ? OFFSET ?"
    params.push(limit, offset)

    const ventas = await query(sql, params)

    // Obtener total
    let countSql = `SELECT COUNT(*) as total FROM public.ventas v WHERE 1=1`
    const countParams: any[] = []

    if (vendedorId) {
      countSql += " AND v.vendedor_id = ?"
      countParams.push(vendedorId)
    }
    if (propietarioId) {
      countSql += " AND v.propietario_id = ?"
      countParams.push(propietarioId)
    }
    if (metodoPago) {
      countSql += " AND v.metodo_pago = ?"
      countParams.push(metodoPago)
    }
    if (fechaInicio) {
      countSql += " AND v.fecha_hora >= ?"
      countParams.push(new Date(fechaInicio))
    }
    if (fechaFin) {
      countSql += " AND v.fecha_hora <= ?"
      countParams.push(new Date(fechaFin))
    }

    const [countResult] = await query(countSql, countParams)

    return NextResponse.json({
      ventas,
      total: countResult?.total || 0,
      page,
      limit,
    })
  } catch (error: any) {
    console.error("Error al obtener ventas:", error)
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    )
  }
}
