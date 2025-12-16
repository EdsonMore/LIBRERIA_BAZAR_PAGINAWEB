import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUserFromSession } from "@/lib/auth"

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromSession(req)
    if (!user || !user.roles?.some((r: any) => ["ROLE_ADMIN", "ROLE_SUPER_ADMIN"].includes(r.nombre))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    // Verificar si hay usuarios con este rol
    const usuarios = await query(
      `SELECT COUNT(*) as count FROM usuario_roles WHERE rol_id = $1`,
      [params.id],
    )

    if (usuarios[0].count > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar un rol que tiene usuarios asociados" },
        { status: 400 },
      )
    }

    await query(`DELETE FROM roles WHERE id = $1`, [params.id])

    return NextResponse.json({ message: "Rol eliminado exitosamente" })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}
