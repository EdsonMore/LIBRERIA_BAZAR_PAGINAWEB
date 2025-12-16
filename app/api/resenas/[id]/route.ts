import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUsuarioFromSession } from "@/lib/auth"

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const usuario = await getUsuarioFromSession(request as any)

    if (!usuario) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { id } = await params

    // Verificar que la reseña pertenece al usuario
    const resenas = await query<any[]>("SELECT id FROM resenas WHERE id = ? AND usuario_id = ?", [id, usuario.id])

    if (resenas.length === 0) {
      return NextResponse.json({ error: "Reseña no encontrada" }, { status: 404 })
    }

    await query("DELETE FROM resenas WHERE id = ?", [id])

    return NextResponse.json({ success: true, message: "Reseña eliminada" })
  } catch (error) {
    console.error("Error al eliminar reseña:", error)
    return NextResponse.json({ error: "Error al eliminar reseña" }, { status: 500 })
  }
}
