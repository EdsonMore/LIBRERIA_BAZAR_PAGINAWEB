import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUsuarioFromSession } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const usuario = await getUsuarioFromSession(request as any)

    if (!usuario) {
      return NextResponse.json({ count: 0 })
    }

    const result = await query<any[]>("SELECT SUM(cantidad) as count FROM item_carrito WHERE usuario_id = $1", [
      usuario.id,
    ])

    return NextResponse.json({ count: (result[0] as any)?.count || 0 })
  } catch (error) {
    console.error("Error al contar items:", error)
    return NextResponse.json({ count: 0 })
  }
}

