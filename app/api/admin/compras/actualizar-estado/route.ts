import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUsuarioFromSession, esAdmin, esSuperAdmin } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const usuario = await getUsuarioFromSession(request as any)

    if (!usuario || (!esAdmin(usuario) && !esSuperAdmin(usuario))) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    const body = await request.json()
    const { compraId, estado } = body

    if (!compraId || !estado) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }

    // Actualizar estado de la compra
    await query("UPDATE compras SET estado = $1 WHERE id = $2", [estado, compraId])

    // Si el estado es DESPACHADO, crear notificación
    if (estado === "DESPACHADO") {
      const [compra] = await query<any[]>("SELECT usuario_id FROM compras WHERE id = $1", [compraId])

      if (compra) {
        await query(
          `INSERT INTO notificaciones (usuario_id, compra_id, titulo, mensaje, tipo)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            compra.usuario_id,
            compraId,
            "Pedido Despachado",
            "Tu pedido ha sido despachado y está en camino.",
            "ESTADO_CAMBIO",
          ],
        )
      }
    }

    return NextResponse.json({ success: true, message: "Estado actualizado" })
  } catch (error) {
    console.error("Error al actualizar estado:", error)
    return NextResponse.json({ error: "Error al actualizar estado" }, { status: 500 })
  }
}


