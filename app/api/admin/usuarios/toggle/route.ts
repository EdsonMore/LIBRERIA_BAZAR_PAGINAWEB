import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUserFromSession } from "@/lib/auth"

export async function PATCH(req: NextRequest) {
  try {
    const user = await getUserFromSession(req)
    if (!user || !user.roles?.some((r: any) => ["ROLE_SUPER_ADMIN"].includes(r.nombre))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { id, activo } = await req.json()

    await query("UPDATE usuarios SET activo = $1 WHERE id = $2", [activo ? 1 : 0, id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}


