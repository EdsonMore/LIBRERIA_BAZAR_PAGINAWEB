import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const categoriaId = searchParams.get("categoria")
    const busqueda = searchParams.get("q")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "12")
    const offset = (page - 1) * limit

    let sql = `
      SELECT p.*, c.nombre as categoria_nombre, c.id as categoria_id
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.disponible = true
    `
    const params: any[] = []

    if (categoriaId) {
      sql += " AND p.categoria_id = ?"
      params.push(categoriaId)
    }

    if (busqueda) {
      sql += " AND (LOWER(p.nombre) LIKE LOWER(?) OR LOWER(p.descripcion) LIKE LOWER(?))"
      params.push(`%${busqueda}%`, `%${busqueda}%`)
    }

    sql += " ORDER BY p.nombre LIMIT ? OFFSET ?"
    params.push(limit, offset)

    const productos = await query<any[]>(sql, params)

    // Obtener total para paginaciÃ³n
    let countSql = "SELECT COUNT(*) as total FROM productos p WHERE p.disponible = true"
    const countParams: any[] = []

    if (categoriaId) {
      countSql += " AND p.categoria_id = ?"
      countParams.push(categoriaId)
    }

    if (busqueda) {
      countSql += " AND (LOWER(p.nombre) LIKE LOWER(?) OR LOWER(p.descripcion) LIKE LOWER(?))"
      countParams.push(`%${busqueda}%`, `%${busqueda}%`)
    }

    const [countResult] = await query<any[]>(countSql, countParams)
    const total = countResult.total

    return NextResponse.json({
      productos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error al obtener productos:", error)
    return NextResponse.json({ error: "Error al obtener productos" }, { status: 500 })
  }
}

