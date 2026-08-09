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
    const { nombre, descripcion, precio, stock, categoria_id, imagen, disponible, codigo_barras } = body

    if (!nombre || !descripcion || !precio || !stock || !categoria_id) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })
    }

    const codigoLimpio = (codigo_barras || "").toString().trim() || null

    if (codigoLimpio) {
      const existe = await query(`SELECT id FROM productos WHERE codigo_barras = $1 LIMIT 1`, [codigoLimpio])
      if (existe.length > 0) {
        return NextResponse.json({ error: `El código de barras ${codigoLimpio} ya está asignado a otro producto` }, { status: 409 })
      }
    }

    const result = await query(
      `INSERT INTO productos (nombre, descripcion, precio, stock, categoria_id, imagen, disponible, codigo_barras, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [nombre, descripcion, precio, stock, categoria_id, imagen || null, disponible ? true : false, codigoLimpio],
    )

    return NextResponse.json({ id: result.insertId, message: "Producto creado exitosamente" })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}


