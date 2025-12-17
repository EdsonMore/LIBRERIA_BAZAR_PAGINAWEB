/**
 * Middleware de autorización para el módulo de Ventas
 * Verifica que el usuario tenga los permisos necesarios
 */

import { NextRequest, NextResponse } from "next/server"

/**
 * Middleware para verificar que el usuario sea Vendedor
 * Usado en: POST /api/ventas
 */
export async function verificarVendedor(session: any) {
  if (!session?.user) {
    return {
      error: "No autenticado",
      status: 401
    }
  }

  // Aquí iría la verificación de rol "Vendedor"
  // Por ahora asumimos que todo usuario autenticado puede vender
  return null
}

/**
 * Middleware para verificar que el usuario sea SuperAdmin
 * Usado en: GET /api/ventas/reportes
 */
export async function verificarSuperAdmin(session: any) {
  if (!session?.user) {
    return {
      error: "No autenticado",
      status: 401
    }
  }

  // Aquí iría la verificación de rol "SuperAdmin"
  // Por ahora asumimos que todo usuario autenticado puede ver reportes
  return null
}

/**
 * Verificar que el usuario sea el propietario de la venta o SuperAdmin
 */
export async function verificarAccesoVenta(ventaId: number, usuarioId: number, esSuperAdmin: boolean) {
  if (esSuperAdmin) {
    return true
  }

  // Verificar que el usuario sea el vendedor
  const { query } = require("@/lib/db")
  const result = await query(
    `SELECT vendedor_id FROM public.ventas WHERE id = ?`,
    [ventaId]
  )

  return result.length > 0 && result[0].vendedor_id === usuarioId
}
