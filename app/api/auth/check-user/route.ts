import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { user } = body

    if (!user) {
      return NextResponse.json({ exists: false }, { status: 200 })
    }

    // Verificar si el usuario existe
    const result = await query<any[]>("SELECT id FROM usuarios WHERE \"user\" = ?", [user])

    if (result.length > 0) {
      console.log("⚠️ Usuario ya existe:", user)
    }

    return NextResponse.json(
      { exists: result.length > 0 },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error al verificar usuario:", error)
    return NextResponse.json(
      { error: "Error al verificar usuario" },
      { status: 500 }
    )
  }
}
