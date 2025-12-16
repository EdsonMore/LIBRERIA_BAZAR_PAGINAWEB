import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUsuarioFromSession } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const usuario = await getUsuarioFromSession(request as any)

    if (!usuario) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const resenas = await query<any[]>(
      `SELECT r.*, p.nombre as producto_nombre, p.imagen as producto_imagen
       FROM resenas r
       LEFT JOIN productos p ON r.producto_id = p.id
       WHERE r.usuario_id = ?
       ORDER BY r.fecha DESC`,
      [usuario.id],
    )

    const formattedResenas = resenas.map((r) => ({
      ...r,
      producto: {
        id: r.producto_id,
        nombre: r.producto_nombre,
        imagen: r.producto_imagen,
      },
    }))

    return NextResponse.json({ resenas: formattedResenas })
  } catch (error) {
    console.error("Error al obtener reseÃ±as:", error)
    return NextResponse.json({ error: "Error al obtener reseÃ±as" }, { status: 500 })
  }
}

