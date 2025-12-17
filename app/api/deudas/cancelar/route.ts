import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

/**
 * POST /api/deudas/cancelar
 * Cancelar/anular una deuda existente
 * 
 * Body esperado:
 * {
 *   ventaId: number (requerido)
 *   motivo: string (requerido) - razón de la cancelación
 *   saldoPerdonado?: number - monto que se perdona (default: saldo_pendiente completo)
 *   usuarioId: number (requerido) - quien cancela
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || ''
    if (!cookieHeader && process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validaciones
    if (!body.ventaId || !body.motivo || !body.usuarioId) {
      return NextResponse.json(
        { error: "Campos obligatorios: ventaId, motivo, usuarioId" },
        { status: 400 }
      )
    }

    if (!body.motivo.trim()) {
      return NextResponse.json(
        { error: "El motivo no puede estar vacío" },
        { status: 400 }
      )
    }

    // Obtener venta actual
    const ventaResult = await query(
      `SELECT id, total, monto_pagado, saldo_pendiente, estado_pago 
       FROM public.ventas WHERE id = ?`,
      [body.ventaId]
    )

    if (!ventaResult.length) {
      return NextResponse.json(
        { error: "Venta no encontrada" },
        { status: 404 }
      )
    }

    const venta = ventaResult[0]

    // Validar que no esté ya cancelada
    if (venta.estado_pago === 'CANCELADO') {
      return NextResponse.json(
        { error: "Esta deuda ya está cancelada" },
        { status: 400 }
      )
    }

    // Saldo a perdonar (por defecto el saldo pendiente completo)
    const saldoPerdonado = body.saldoPerdonado || venta.saldo_pendiente

    if (saldoPerdonado < 0 || saldoPerdonado > venta.saldo_pendiente) {
      return NextResponse.json(
        { error: `Saldo a perdonar debe estar entre 0 y ${venta.saldo_pendiente}` },
        { status: 400 }
      )
    }

    // Registrar cancelación
    const cancelacionResult = await query(
      `INSERT INTO public.cancelaciones_deuda (
        venta_id, motivo, saldo_perdonado, usuario_id
      ) VALUES (?, ?, ?, ?)
      RETURNING id, fecha_hora`,
      [
        body.ventaId,
        body.motivo,
        saldoPerdonado,
        body.usuarioId,
      ]
    )

    if (!cancelacionResult.length) {
      return NextResponse.json(
        { error: "Error al registrar la cancelación" },
        { status: 500 }
      )
    }

    // Actualizar venta a estado CANCELADO
    await query(
      `UPDATE public.ventas 
       SET estado_pago = 'CANCELADO', updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [body.ventaId]
    )

    return NextResponse.json(
      {
        mensaje: "Deuda cancelada exitosamente",
        cancelacionId: cancelacionResult[0].id,
        venta: {
          ventaId: body.ventaId,
          totalVenta: venta.total,
          montoPagado: venta.monto_pagado,
          saldoPerdonado: saldoPerdonado,
          estadoPago: 'CANCELADO',
        },
        cancelacion: {
          motivo: body.motivo,
          saldoPerdonado: saldoPerdonado,
          fecha: cancelacionResult[0].fecha_hora,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Error al cancelar deuda:", error)
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    )
  }
}
