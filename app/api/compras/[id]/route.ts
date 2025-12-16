import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUserFromSession } from "@/lib/auth"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromSession(req)
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const compraId = params.id

    // Obtener compra
    const compras = await query(
      `SELECT c.*, u.nombres, u.correo 
       FROM compras c
       LEFT JOIN usuarios u ON c.usuario_id = u.id
       WHERE c.id = ?`,
      [compraId],
    )

    if (compras.length === 0) {
      return NextResponse.json({ error: "Compra no encontrada" }, { status: 404 })
    }

    const compra = compras[0]

    // Verificar que la compra pertenece al usuario (o es admin)
    const esAdmin = user.roles?.some((r) => r.nombre === "ADMIN" || r.nombre === "SUPER_ADMIN")
    if (!esAdmin && compra.usuario_id !== user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    // Obtener detalles
    const detalles = await query(
      `SELECT dc.*, p.nombre as productoNombre, p.imagen as productoImagen
       FROM detalles_compra dc
       INNER JOIN productos p ON dc.producto_id = p.id
       WHERE dc.compra_id = ?`,
      [compraId],
    )

    return NextResponse.json({
      ...compra,
      detalles,
    })
  } catch (error) {
    console.error("Error al obtener compra:", error)
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}
