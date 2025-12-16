import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUsuarioFromSession, esAdmin, esSuperAdmin } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const usuario = await getUsuarioFromSession(request as any)

    if (!usuario || (!esAdmin(usuario) && !esSuperAdmin(usuario))) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    // Obtener estadísticas
    const [productos] = await query<any[]>("SELECT COUNT(*) as total FROM productos")
    const [compras] = await query<any[]>("SELECT COUNT(*) as total FROM compras")
    const [usuarios] = await query<any[]>("SELECT COUNT(*) as total FROM usuarios WHERE activo = true")
    const [resenas] = await query<any[]>("SELECT COUNT(*) as total FROM resenas")

    // Compras recientes
    const comprasRecientes = await query<any[]>(
      `SELECT c.*, u.nombres as usuario_nombre, u.correo as usuario_correo
       FROM compras c
       LEFT JOIN usuarios u ON c.usuario_id = u.id
       ORDER BY c.fecha_compra DESC
       LIMIT 10`,
    )

    return NextResponse.json({
      totalProductos: productos.total,
      totalCompras: compras.total,
      totalUsuarios: usuarios.total,
      totalResenas: resenas.total,
      comprasRecientes,
    })
  } catch (error) {
    console.error("Error al obtener estadísticas:", error)
    return NextResponse.json({ error: "Error al obtener estadísticas" }, { status: 500 })
  }
}


