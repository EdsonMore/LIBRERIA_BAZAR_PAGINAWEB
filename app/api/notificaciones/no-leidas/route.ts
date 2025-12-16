import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUserFromSession } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromSession(req)
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const notificaciones = await query(
      `SELECT * FROM notificaciones 
       WHERE usuario_id = ? AND leida = false
       ORDER BY fecha_creacion DESC`,
      [user.id],
    )

    const countResult = await query(
      `SELECT COUNT(*) as cantidad FROM notificaciones 
       WHERE usuario_id = ? AND leida = false`,
      [user.id],
    )

    return NextResponse.json({
      notificaciones,
      cantidad: countResult[0]?.cantidad || 0,
    })
  } catch (error) {
    console.error("Error al obtener notificaciones:", error)
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}

