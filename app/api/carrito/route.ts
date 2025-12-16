import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUsuarioFromSession } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const usuario = await getUsuarioFromSession(request as any)

    if (!usuario) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const items = await query<any>(
      `SELECT ic.*, p.nombre, p.precio, p.imagen, p.stock, c.nombre as categoria_nombre
       FROM item_carrito ic
       LEFT JOIN productos p ON ic.producto_id = p.id
       LEFT JOIN categorias c ON p.categoria_id = c.id
       WHERE ic.usuario_id = $1
       ORDER BY ic.fecha_agregado DESC`,
      [usuario.id],
    )

    // Formatear respuesta
    const formattedItems = items.map((item: any) => ({
      id: (item as any).id,
      cantidad: (item as any).cantidad,
      producto: {
        id: (item as any).producto_id,
        nombre: (item as any).nombre,
        precio: Number((item as any).precio) || 0,
        imagen: (item as any).imagen,
        stock: (item as any).stock,
        categoria_nombre: (item as any).categoria_nombre,
      },
    }))

    return NextResponse.json({ items: formattedItems })
  } catch (error) {
    console.error("Error al obtener carrito:", error)
    return NextResponse.json({ error: "Error al obtener carrito" }, { status: 500 })
  }
}

