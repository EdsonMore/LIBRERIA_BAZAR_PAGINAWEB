import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    const usuarios = await query("SELECT id, \"user\", correo, activo FROM usuarios")
    return NextResponse.json({
      usuarios,
      total: usuarios.length,
    })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 })
  }
}
