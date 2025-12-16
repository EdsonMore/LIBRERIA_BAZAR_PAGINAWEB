import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const resenas = await query(
      `SELECT r.*, u.nombres as usuarioNombre
       FROM resenas r
       INNER JOIN usuarios u ON r.usuario_id = u.id
       WHERE r.producto_id = ?
       ORDER BY r.fecha_resena DESC`,
      [params.id],
    )

    return NextResponse.json(resenas)
  } catch (error) {
    console.error("Error al obtener reseñas:", error)
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}
