import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

/**
 * POST /api/productos-buscados
 * Registra cuando un cliente busca un producto que no existe
 * 
 * Body:
 * {
 *   nombre: string (nombre del producto buscado)
 *   usuarioId?: number (opcional, si es cliente registrado)
 *   clienteNombre?: string
 *   clienteEmail?: string
 *   clienteTelefono?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.nombre || !body.nombre.trim()) {
      return NextResponse.json(
        { error: "El nombre del producto es requerido" },
        { status: 400 }
      )
    }

    const nombreProducto = body.nombre.trim().toLowerCase()

    // Intentar UPSERT: si existe, incrementar; si no, crear
    const result = await query(
      `INSERT INTO public.productos_buscados (
        nombre, veces_buscado, usuario_id, cliente_nombre, cliente_email, cliente_telefono
      ) VALUES (?, 1, ?, ?, ?, ?)
      ON CONFLICT (nombre) DO UPDATE SET 
        veces_buscado = public.productos_buscados.veces_buscado + 1,
        ultima_busqueda = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, veces_buscado`,
      [
        nombreProducto,
        body.usuarioId || null,
        body.clienteNombre || null,
        body.clienteEmail || null,
        body.clienteTelefono || null,
      ]
    )

    return NextResponse.json(
      {
        mensaje: "Producto buscado registrado",
        id: result[0]?.id,
        veces_buscado: result[0]?.veces_buscado,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Error registrando producto buscado:", error)
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/productos-buscados
 * Obtener lista de productos buscados (lista de compra)
 * 
 * Query params:
 * - ordenar: 'veces' (default) | 'fecha'
 * - prioridad: 'URGENTE' | 'ALTA' | 'MEDIA' | 'BAJA' (opcional)
 * - limit: número (default 20)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const ordenar = searchParams.get("ordenar") || "veces"
    const prioridad = searchParams.get("prioridad")
    const limit = Math.min(Number(searchParams.get("limit") || "20"), 100)

    let sql = `
      SELECT 
        id,
        nombre,
        veces_buscado,
        ultima_busqueda,
        CASE 
          WHEN veces_buscado >= 10 THEN 'URGENTE'
          WHEN veces_buscado >= 5 THEN 'ALTA'
          WHEN veces_buscado >= 2 THEN 'MEDIA'
          ELSE 'BAJA'
        END as prioridad
      FROM public.productos_buscados
      WHERE 1=1
    `

    if (prioridad) {
      if (prioridad === "URGENTE") {
        sql += " AND veces_buscado >= 10"
      } else if (prioridad === "ALTA") {
        sql += " AND veces_buscado >= 5 AND veces_buscado < 10"
      } else if (prioridad === "MEDIA") {
        sql += " AND veces_buscado >= 2 AND veces_buscado < 5"
      } else if (prioridad === "BAJA") {
        sql += " AND veces_buscado < 2"
      }
    }

    if (ordenar === "fecha") {
      sql += " ORDER BY ultima_busqueda DESC"
    } else {
      sql += " ORDER BY veces_buscado DESC, ultima_busqueda DESC"
    }

    sql += ` LIMIT ?`

    const resultados = await query(sql, [limit])

    return NextResponse.json({
      productos: resultados,
      total: resultados.length,
      nota: "Estos son los productos que los clientes buscan pero no existen en la BD",
    })
  } catch (error: any) {
    console.error("Error obteniendo productos buscados:", error)
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    )
  }
}
