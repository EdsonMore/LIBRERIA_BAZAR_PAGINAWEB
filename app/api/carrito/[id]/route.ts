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

    // Verificar que el item pertenece al usuario
    const items = await query<any[]>("SELECT id FROM item_carrito WHERE id = ? AND usuario_id = ?", [id, usuario.id])

    if (items.length === 0) {
      return NextResponse.json({ error: "Item no encontrado" }, { status: 404 })
    }

    await query("DELETE FROM item_carrito WHERE id = ?", [id])

    return NextResponse.json({ success: true, message: "Item eliminado del carrito" })
  } catch (error) {
    console.error("Error al eliminar del carrito:", error)
    return NextResponse.json({ error: "Error al eliminar del carrito" }, { status: 500 })
  }
}
