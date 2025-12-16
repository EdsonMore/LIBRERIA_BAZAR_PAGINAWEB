import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUsuarioFromSession } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const user = await getUsuarioFromSession(req)
    if (!user || !user.roles?.some((r: any) => ["ROLE_ADMIN", "ROLE_SUPER_ADMIN"].includes(r.nombre))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const productos = await query(
      `SELECT p.*, c.nombre as categoriaNombre 
       FROM productos p
       LEFT JOIN categorias c ON p.categoria_id = c.id
       ORDER BY p.id DESC`,
    )

    return NextResponse.json(productos)
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUsuarioFromSession(req)
    if (!user || !user.roles?.some((r: any) => ["ROLE_ADMIN", "ROLE_SUPER_ADMIN"].includes(r.nombre))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const body = await req.json()
    const { nombre, descripcion, precio, stock, categoria_id, imagen, disponible } = body

    if (!nombre || !descripcion || !precio || !stock || !categoria_id) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })
    }

    const result = await query(
      `INSERT INTO productos (nombre, descripcion, precio, stock, categoria_id, imagen, disponible, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [nombre, descripcion, precio, stock, categoria_id, imagen || null, disponible ? true : false],
    )

    return NextResponse.json({ id: result.insertId, message: "Producto creado exitosamente" })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}


