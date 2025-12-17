import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getServerSession } from "@/lib/next-auth-types"

/**
 * GET /api/productos-solicitados
 * Obtener lista de productos solicitados (no existentes en BD)
 * 
 * Query params:
 * - limit: number (default 50)
 * - page: number (default 1)
 * - ordenar: "cantidad" | "fecha" (default: cantidad)
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación a través de cookies/sesión
    const cookieHeader = request.headers.get('cookie') || ''
    
    // Si no hay cookies de sesión en producción, rechazar
    if (!cookieHeader && process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const ordenar = searchParams.get("ordenar") || "cantidad"
    const offset = (page - 1) * limit

    let orderBy = "cantidad_veces_solicitado DESC"
    if (ordenar === "fecha") {
      orderBy = "ultima_fecha_solicitud DESC"
    }

    const productos = await query(
      `SELECT * FROM public.productos_solicitados
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [limit, offset]
    )

    const [countResult] = await query(
      `SELECT COUNT(*) as total FROM public.productos_solicitados`
    )

    return NextResponse.json({
      productos,
      total: countResult?.total || 0,
      page,
      limit,
    })
  } catch (error: any) {
    console.error("Error al obtener productos solicitados:", error)
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/productos-solicitados
 * Registrar manualmente un producto solicitado
 * (generalmente se hace automáticamente al registrar una venta)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      )
    }

    const body = await request.json()

    if (!body.nombre) {
      return NextResponse.json(
        { error: "El nombre del producto es requerido" },
        { status: 400 }
      )
    }

    // Verificar si ya existe
    const [existente] = await query(
      `SELECT * FROM public.productos_solicitados WHERE nombre = ?`,
      [body.nombre]
    )

    if (existente) {
      // Actualizar contador
      await query(
        `UPDATE public.productos_solicitados 
         SET cantidad_veces_solicitado = cantidad_veces_solicitado + 1,
             ultima_fecha_solicitud = CURRENT_TIMESTAMP
         WHERE nombre = ?`,
        [body.nombre]
      )

      return NextResponse.json({
        mensaje: "Producto actualizado",
        producto: existente,
      })
    }

    // Crear nuevo
    const result = await query(
      `INSERT INTO public.productos_solicitados (nombre, cantidad_veces_solicitado)
       VALUES (?, 1)
       RETURNING *`,
      [body.nombre]
    )

    return NextResponse.json(
      {
        mensaje: "Producto solicitado registrado",
        producto: result[0],
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Error al registrar producto solicitado:", error)
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    )
  }
}
