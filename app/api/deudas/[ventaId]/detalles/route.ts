import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

/**
 * GET /api/deudas/[ventaId]/detalles
 * Obtener detalles completos de una deuda incluyendo productos
 * Para mostrar en el modal de pago
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

    const ventaId = request.nextUrl.pathname.split('/')[3]
    
    if (!ventaId) {
      return NextResponse.json(
        { error: "ID de venta requerido" },
        { status: 400 }
      )
    }

    // Obtener información principal de la venta
    const ventaResult = await query(
      `SELECT 
        v.id as venta_id,
        v.fecha_hora,
        v.cliente_nombre,
        v.cliente_email,
        v.cliente_telefono,
        v.total,
        v.monto_pagado,
        v.saldo_pendiente,
        v.estado_pago,
        v.metodo_pago,
        v.propietario_id,
        COALESCE(u_prop.nombres, v.propietario_nombre) as propietario_nombre,
        v.vendedor_id,
        u_vend.nombres as vendedor_nombre
      FROM public.ventas v
      LEFT JOIN public.usuarios u_prop ON v.propietario_id = u_prop.id
      LEFT JOIN public.usuarios u_vend ON v.vendedor_id = u_vend.id
      WHERE v.id = ?`,
      [Number(ventaId)]
    )

    if (!ventaResult || ventaResult.length === 0) {
      return NextResponse.json(
        { error: "Deuda no encontrada" },
        { status: 404 }
      )
    }

    const venta = ventaResult[0]

    // Obtener detalles de productos de la venta
    const productosResult = await query(
      `SELECT 
        dv.id as detalle_id,
        dv.producto_id,
        p.nombre as producto_nombre,
        dv.cantidad,
        dv.precio_unitario,
        dv.subtotal,
        dv.es_producto_existente
      FROM public.detalles_venta dv
      LEFT JOIN public.productos p ON dv.producto_id = p.id
      WHERE dv.venta_id = ?
      ORDER BY dv.id ASC`,
      [Number(ventaId)]
    )

    // Obtener historial de pagos
    const pagosResult = await query(
      `SELECT 
        id as pago_id,
        monto,
        metodo_pago,
        fecha_hora,
        usuario_id
      FROM public.pagos
      WHERE venta_id = ?
      ORDER BY fecha_hora DESC`,
      [Number(ventaId)]
    )

    return NextResponse.json({
      venta: {
        ...venta,
        productos: productosResult,
        pagos_realizados: pagosResult
      }
    })
  } catch (error: any) {
    console.error("Error al obtener detalles de deuda:", error)
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    )
  }
}
