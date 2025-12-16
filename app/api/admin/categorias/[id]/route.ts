import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUserFromSession } from "@/lib/auth"

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getUserFromSession(req)
    if (!user || !user.roles?.some((r: any) => ["ROLE_ADMIN", "ROLE_SUPER_ADMIN"].includes(r.nombre))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    // Verificar si hay productos en esta categoría
    const productos = await query(`SELECT COUNT(*) as count FROM productos WHERE categoria_id = $1`, [id])

    if (productos[0].count > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar una categoría que tiene productos asociados" },
        { status: 400 },
      )
    }

    await query(`DELETE FROM categorias WHERE id = $1`, [id])

    return NextResponse.json({ message: "Categoría eliminada exitosamente" })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}
