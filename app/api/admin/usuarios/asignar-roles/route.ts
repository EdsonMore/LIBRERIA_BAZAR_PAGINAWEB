import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUserFromSession } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromSession(req)
    if (!user || !user.roles?.some((r: any) => ["ROLE_SUPER_ADMIN"].includes(r.nombre))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { usuarioId, roleIds } = await req.json()

    // Eliminar roles actuales
    await query("DELETE FROM usuario_roles WHERE usuario_id = $1", [usuarioId])

    // Asignar nuevos roles
    for (const rolId of roleIds) {
      await query("INSERT INTO usuario_roles (usuario_id, rol_id) VALUES ($1, $2)", [usuarioId, rolId])
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}


