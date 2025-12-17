import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

/**
 * GET /api/productos/destacados-navidad
 * Obtener productos aleatorios de categorías navideñas
 * 
 * Query params:
 * - limit: number (default 6) - cantidad de productos a retornar
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "6")

    // Obtener productos de categorías navideñas de forma aleatoria
    const productos = await query(
      `SELECT 
        p.id,
        p.nombre,
        p.categoria_id,
        c.nombre as categoria_nombre,
        p.precio,
        p.stock,
        p.disponible,
        p.imagen,
        p.descripcion
      FROM public.productos p
      LEFT JOIN public.categorias c ON p.categoria_id = c.id
      WHERE p.disponible = true 
        AND p.stock > 0
        AND (c.nombre = 'Decoraciones Navideñas' OR c.nombre = 'Juguetes')
      ORDER BY RANDOM()
      LIMIT ?`,
      [limit]
    )

    return NextResponse.json({
      productos: productos || [],
      total: productos?.length || 0,
    })
  } catch (error: any) {
    console.error("Error al obtener productos destacados navidad:", error)
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    )
  }
}
