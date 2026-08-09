import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUsuarioFromSession } from "@/lib/auth"

/**
 * POST /api/ventas/producto-rapido
 * Crear un producto de forma rápida desde el escáner de código de barras
 * en el formulario de ventas (uso por parte de usuarios autenticados).
 *
 * Body esperado:
 * {
 *   nombre: string
 *   precio: number
 *   stock?: number (default 0)
 *   codigo_barras: string
 *   categoria_id?: number (si no se envía, se usa una categoría por defecto)
 *   descripcion?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const usuario = await getUsuarioFromSession(request)
    if (!usuario?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const nombre = (body.nombre || "").toString().trim()
    const precio = parseFloat(body.precio)
    const stock = parseInt(body.stock ?? "0", 10)
    const codigoBarras = (body.codigo_barras || "").toString().trim()
    const descripcion = (body.descripcion || "").toString().trim() || null

    if (!nombre) {
      return NextResponse.json({ error: "El nombre del producto es requerido" }, { status: 400 })
    }
    if (isNaN(precio) || precio <= 0) {
      return NextResponse.json({ error: "Precio inválido" }, { status: 400 })
    }
    if (!codigoBarras) {
      return NextResponse.json({ error: "El código de barras es requerido" }, { status: 400 })
    }

    // Verificar que el código no exista
    const existente = await query(`SELECT id FROM productos WHERE codigo_barras = $1 LIMIT 1`, [codigoBarras])
    if (existente.length > 0) {
      return NextResponse.json(
        { error: `El código de barras ${codigoBarras} ya está asignado a otro producto` },
        { status: 409 },
      )
    }

    // Resolver categoría: la proporcionada o una por defecto (la primera activa)
    let categoriaId = body.categoria_id ? parseInt(body.categoria_id, 10) : null
    if (!categoriaId || isNaN(categoriaId)) {
      const defaultCat = await query(`SELECT id FROM categorias WHERE activa = true ORDER BY id LIMIT 1`)
      categoriaId = defaultCat[0]?.id || 1
    }

    const result = await query(
      `INSERT INTO productos (nombre, descripcion, precio, stock, categoria_id, disponible, codigo_barras, created_at)
       VALUES ($1, $2, $3, $4, $5, true, $6, NOW())
       RETURNING id`,
      [nombre, descripcion, Math.round(precio * 100) / 100, isNaN(stock) ? 0 : stock, categoriaId, codigoBarras],
    )

    const nuevoId = (result as any)?.insertId ?? result[0]?.id
    return NextResponse.json({ id: nuevoId, message: "Producto creado exitosamente" }, { status: 201 })
  } catch (error) {
    console.error("Error creando producto rápido:", error)
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}