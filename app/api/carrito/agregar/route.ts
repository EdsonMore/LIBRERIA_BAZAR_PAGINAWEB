import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUsuarioFromSession } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const usuario = await getUsuarioFromSession(request as any)

    if (!usuario) {
      return NextResponse.json({ error: "Debe iniciar sesiÃ³n para agregar al carrito" }, { status: 401 })
    }

    const body = await request.json()
    const { productoId, cantidad } = body

    if (!productoId || !cantidad || cantidad < 1) {
      return NextResponse.json({ error: "Datos invÃ¡lidos" }, { status: 400 })
    }

    // Verificar stock del producto
    const productos = await query<any[]>("SELECT stock FROM productos WHERE id = $1", [productoId])

    if (productos.length === 0) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    }

    if ((productos[0] as any).stock < cantidad) {
      return NextResponse.json({ error: "Stock insuficiente" }, { status: 400 })
    }

    // Verificar si ya existe en el carrito
    const existing = await query<any[]>(
      "SELECT id, cantidad FROM item_carrito WHERE usuario_id = $1 AND producto_id = $2",
      [usuario.id, productoId],
    )

    if (existing.length > 0) {
      // Actualizar cantidad
      const nuevaCantidad = (existing[0] as any).cantidad + cantidad
      if (nuevaCantidad > (productos[0] as any).stock) {
        return NextResponse.json({ error: "Stock insuficiente" }, { status: 400 })
      }

      await query("UPDATE item_carrito SET cantidad = $1 WHERE id = $2", [nuevaCantidad, (existing[0] as any).id])
    } else {
      // Insertar nuevo item
      await query("INSERT INTO item_carrito (usuario_id, producto_id, cantidad) VALUES ($1, $2, $3)", [
        usuario.id,
        productoId,
        cantidad,
      ])
    }

    return NextResponse.json({ success: true, message: "Producto agregado al carrito" })
  } catch (error) {
    console.error("Error al agregar al carrito:", error)
    return NextResponse.json({ error: "Error al agregar al carrito" }, { status: 500 })
  }
}

