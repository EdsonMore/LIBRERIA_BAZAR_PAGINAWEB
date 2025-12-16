import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUsuarioFromSession } from "@/lib/auth"

export async function PUT(request: Request) {
  try {
    const usuario = await getUsuarioFromSession(request as any)

    if (!usuario) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const { itemId, cantidad } = body

    if (!itemId || !cantidad || cantidad < 1) {
      return NextResponse.json({ error: "Datos invÃ¡lidos" }, { status: 400 })
    }

    // Verificar que el item pertenece al usuario
    const items = await query<any[]>("SELECT producto_id FROM item_carrito WHERE id = $1 AND usuario_id = $2", [
      itemId,
      usuario.id,
    ])

    if (items.length === 0) {
      return NextResponse.json({ error: "Item no encontrado" }, { status: 404 })
    }

    // Verificar stock
    const productos = await query<any[]>("SELECT stock FROM productos WHERE id = $1", [(items[0] as any).producto_id])

    if ((productos[0] as any).stock < cantidad) {
      return NextResponse.json({ error: "Stock insuficiente" }, { status: 400 })
    }

    await query("UPDATE item_carrito SET cantidad = $1 WHERE id = $2", [cantidad, itemId])

    return NextResponse.json({ success: true, message: "Cantidad actualizada" })
  } catch (error) {
    console.error("Error al actualizar carrito:", error)
    return NextResponse.json({ error: "Error al actualizar carrito" }, { status: 500 })
  }
}

