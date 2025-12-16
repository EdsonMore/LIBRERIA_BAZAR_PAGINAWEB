import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUsuarioFromSession } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const user = await getUsuarioFromSession(req)
    if (!user || !user.roles?.some((r: any) => ["ROLE_ADMIN", "ROLE_SUPER_ADMIN"].includes(r.nombre))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const categorias = await query(
      `SELECT c.*, COUNT(p.id) as cantidadProductos
       FROM categorias c
       LEFT JOIN productos p ON p.categoria_id = c.id
       GROUP BY c.id
       ORDER BY c.nombre`,
    )

    return NextResponse.json(categorias)
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUsuarioFromSession(req)
    if (!user || !user.roles?.some((r: any) => ["ROLE_SUPER_ADMIN"].includes(r.nombre))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { nombre, descripcion } = await req.json()

    await query("INSERT INTO categorias (nombre, descripcion, activa) VALUES ($1, $2, true)", [nombre, descripcion || ""])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getUsuarioFromSession(req)
    if (!user || !user.roles?.some((r: any) => ["ROLE_SUPER_ADMIN"].includes(r.nombre))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { id, nombre, descripcion } = await req.json()

    await query("UPDATE categorias SET nombre = $1, descripcion = $2 WHERE id = $3", [nombre, descripcion || "", id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}


