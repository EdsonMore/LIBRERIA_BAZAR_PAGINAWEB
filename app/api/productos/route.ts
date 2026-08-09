import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const categoriaId = searchParams.get("categoria")
    const busqueda = searchParams.get("q")
    const campos = searchParams.get("campos") // "basico" = solo id, nombre, precio, stock
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "12")
    const offset = (page - 1) * limit

    const columnas =
      campos === "basico"
        ? "p.id, p.nombre, p.precio, p.stock, p.disponible::boolean as disponible, p.codigo_barras as codigo_barras"
        : "p.id, p.nombre, p.descripcion, p.precio, p.stock, p.imagen, p.disponible::boolean as disponible, p.codigo_barras as codigo_barras"

    let sql = `
      SELECT ${columnas}, c.nombre as categoria_nombre, c.id as categoria_id
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
      sql += " AND (p.nombre ILIKE ? OR p.descripcion ILIKE ? OR p.codigo_barras ILIKE ?)"
      params.push(`%${busqueda}%`, `%${busqueda}%`, `%${busqueda}%`)
    }

    sql += " ORDER BY p.nombre LIMIT ? OFFSET ?"
    params.push(limit, offset)

    const productos = await query<any[]>(sql, params)

    // Obtener total para paginación
    let countSql = "SELECT COUNT(*) as total FROM productos p WHERE p.disponible = true"
    const countParams: any[] = []

    if (categoriaId) {
      countSql += " AND p.categoria_id = ?"
      countParams.push(categoriaId)
    }

    if (busqueda) {
      countSql += " AND (p.nombre ILIKE ? OR p.descripcion ILIKE ? OR p.codigo_barras ILIKE ?)"
      countParams.push(`%${busqueda}%`, `%${busqueda}%`, `%${busqueda}%`)
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
