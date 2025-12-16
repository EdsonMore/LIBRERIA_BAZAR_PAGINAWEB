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
       WHERE usuario_id = ? 
       ORDER BY fecha_creacion DESC 
       LIMIT 50`,
      [user.id],
    )

    return NextResponse.json(notificaciones)
  } catch (error) {
    console.error("Error al obtener notificaciones:", error)
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}

