import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    const categorias = await query<any[]>(
      "SELECT id, nombre, descripcion, imagen FROM categorias WHERE activa = true ORDER BY nombre",
    )

    return NextResponse.json(categorias)
  } catch (error) {
    console.error("Error al obtener categorÃ­as:", error)
    return NextResponse.json({ error: "Error al obtener categorÃ­as" }, { status: 500 })
  }
}

