import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getServerSession } from "@/lib/next-auth-types"

/**
 * GET /api/ventas/[id]/detalles
 * Obtener detalles de una venta específica
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const ventaId = Number.parseInt(params.id)

    if (!ventaId) {
      return NextResponse.json(
        { error: "ID de venta inválido" },
        { status: 400 }
      )
    }

    // Obtener datos de la venta
    const [venta] = await query(
      `SELECT 
        v.*,
        ve.nombres as vendedor_nombre,
        pr.nombres as propietario_nombre,
        c.nombres as cliente_nombres
      FROM public.ventas v
      LEFT JOIN public.usuarios ve ON v.vendedor_id = ve.id
      LEFT JOIN public.usuarios pr ON v.propietario_id = pr.id
      LEFT JOIN public.usuarios c ON v.cliente_id = c.id
      WHERE v.id = ?`,
      [ventaId]
    )

    if (!venta) {
      return NextResponse.json(
        { error: "Venta no encontrada" },
        { status: 404 }
      )
    }

    // Obtener detalles de la venta
    const detalles = await query(
      `SELECT 
        dv.*,
        p.nombre as producto_nombre_bd,
        p.imagen as producto_imagen
      FROM public.detalles_venta dv
      LEFT JOIN public.productos p ON dv.producto_id = p.id
      WHERE dv.venta_id = ?
      ORDER BY dv.created_at ASC`,
      [ventaId]
    )

    return NextResponse.json({
      venta: {
        ...venta,
        detalles,
      },
    })
  } catch (error: any) {
    console.error("Error al obtener detalles de venta:", error)
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    )
  }
}
