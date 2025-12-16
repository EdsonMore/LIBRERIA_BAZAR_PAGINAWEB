import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUsuarioFromSession } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const user = await getUsuarioFromSession(req)
    if (!user || !user.roles?.some((r: any) => ["ROLE_ADMIN", "ROLE_SUPER_ADMIN"].includes(r.nombre))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    // Obtener todas las reseñas con información del usuario y producto
    const resenas = await query(
      `SELECT 
        r.id,
        r.usuario_id as "usuarioId",
        r.producto_id as "productoId",
        r.calificacion,
        r.comentario as "contenido",
        r.fecha,
        r.estado,
        u.nombres as "usuarioNombre",
        u.apellido_paterno as "apellidoPaterno",
        u.apellido_materno as "apellidoMaterno",
        p.nombre as "productNombre"
       FROM resenas r
       JOIN usuarios u ON r.usuario_id = u.id
       JOIN productos p ON r.producto_id = p.id
       ORDER BY r.fecha DESC`,
      [],
    )

    return NextResponse.json(resenas)
  } catch (error) {
    console.error("Error al obtener reseñas:", error)
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}
