import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUsuarioFromSession } from "@/lib/auth"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getUsuarioFromSession(req)
    if (!user || !user.roles?.some((r: any) => ["ROLE_ADMIN", "ROLE_SUPER_ADMIN"].includes(r.nombre))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { id } = await params
    const { estado } = await req.json()

    if (!["APROBADA", "RECHAZADA"].includes(estado)) {
      return NextResponse.json(
        { error: "Estado inválido. Debe ser APROBADA o RECHAZADA" },
        { status: 400 },
      )
    }

    // Verificar que la reseña existe
    const resena = await query(
      `SELECT id FROM resenas WHERE id = ?`,
      [id],
    )

    if (resena.length === 0) {
      return NextResponse.json({ error: "Reseña no encontrada" }, { status: 404 })
    }

    // Actualizar estado
    await query(
      `UPDATE resenas SET estado = ? WHERE id = ?`,
      [estado, id],
    )

    return NextResponse.json({
      success: true,
      message: `Reseña ${estado.toLowerCase()}`,
    })
  } catch (error) {
    console.error("Error al actualizar reseña:", error)
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getUsuarioFromSession(req)
    if (!user || !user.roles?.some((r: any) => ["ROLE_ADMIN", "ROLE_SUPER_ADMIN"].includes(r.nombre))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { id } = await params

    // Verificar que la reseña existe
    const resena = await query(
      `SELECT id FROM resenas WHERE id = ?`,
      [id],
    )

    if (resena.length === 0) {
      return NextResponse.json({ error: "Reseña no encontrada" }, { status: 404 })
    }

    // Eliminar
    await query(
      `DELETE FROM resenas WHERE id = ?`,
      [id],
    )

    return NextResponse.json({
      success: true,
      message: "Reseña eliminada",
    })
  } catch (error) {
    console.error("Error al eliminar reseña:", error)
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}
