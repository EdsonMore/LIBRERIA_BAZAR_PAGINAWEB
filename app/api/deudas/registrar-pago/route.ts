import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

/**
 * POST /api/deudas/registrar-pago
 * Registrar un pago posterior en una venta con deuda
 * 
 * Body esperado:
 * {
 *   ventaId: number (requerido)
 *   monto: number (requerido)
 *   metodoPago: "EFECTIVO" | "YAPE" | "PLIN" | "TRANSFERENCIA" | "OTRO" (requerido)
 *   descripcionMetodoOtro?: string
 *   usuarioId: number (quien registra el pago)
 *   observaciones?: string
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
    if (!body.ventaId || !body.monto || !body.metodoPago || !body.usuarioId) {
      return NextResponse.json(
        { error: "Campos obligatorios: ventaId, monto, metodoPago, usuarioId" },
        { status: 400 }
      )
    }

    if (body.monto <= 0) {
      return NextResponse.json(
        { error: "El monto debe ser mayor a 0" },
        { status: 400 }
      )
    }

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

    // Validar que no se pague más del saldo pendiente
    if (body.monto > venta.saldo_pendiente) {
      return NextResponse.json(
        { error: `Monto (${body.monto}) excede saldo pendiente (${venta.saldo_pendiente})` },
        { status: 400 }
      )
    }

    // Calcular nuevos valores
    const nuevoMontoPagado = Number(venta.monto_pagado) + Number(body.monto)
    const nuevoSaldoPendiente = venta.total - nuevoMontoPagado
    const nuevoEstadoPago = 
      nuevoSaldoPendiente === 0 ? 'PAGADO' :
      nuevoMontoPagado > 0 ? 'PARCIAL' :
      'PENDIENTE'

    // Registrar pago en tabla pagos
    const pagoResult = await query(
      `INSERT INTO public.pagos (
        venta_id, monto, metodo_pago, usuario_id, es_pago_inicial, observaciones
      ) VALUES (?, ?, ?, ?, false, ?)
      RETURNING id, fecha_hora`,
      [
        body.ventaId,
        body.monto,
        body.metodoPago,
        body.usuarioId,
        body.observaciones || null,
      ]
    )

    if (!pagoResult.length) {
      return NextResponse.json(
        { error: "Error al registrar el pago" },
        { status: 500 }
      )
    }

    // Actualizar venta
    await query(
      `UPDATE public.ventas 
       SET monto_pagado = ?, saldo_pendiente = ?, estado_pago = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [nuevoMontoPagado, nuevoSaldoPendiente, nuevoEstadoPago, body.ventaId]
    )

    return NextResponse.json(
      {
        mensaje: "Pago registrado exitosamente",
        pagoId: pagoResult[0].id,
        venta: {
          ventaId: body.ventaId,
          totalVenta: venta.total,
          montoPagado: nuevoMontoPagado,
          saldoPendiente: nuevoSaldoPendiente,
          estadoPago: nuevoEstadoPago,
        },
        pago: {
          monto: body.monto,
          metodoPago: body.metodoPago,
          fecha: pagoResult[0].fecha_hora,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Error al registrar pago:", error)
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    )
  }
}
