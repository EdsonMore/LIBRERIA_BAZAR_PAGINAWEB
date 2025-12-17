import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getServerSession } from "@/lib/next-auth-types"

/**
 * GET /api/usuarios
 * Obtener lista de usuarios (para uso en formularios)
 * 
 * Query params:
 * - activos: boolean (default true) - mostrar solo usuarios activos
 * - limit: number (default 1000)
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
    const activos = searchParams.get("activos") !== "false"
    const limit = Number.parseInt(searchParams.get("limit") || "1000")

    let sql = `
      SELECT 
        u.id, u.nombres, u.correo, u.activo
      FROM public.usuarios u
      WHERE 1=1
    `
    const params: any[] = []

    if (activos) {
      sql += " AND u.activo = true"
    }

    sql += ` ORDER BY u.nombres ASC LIMIT ?`
    params.push(limit)

    const usuarios = await query(sql, params)

    return NextResponse.json({
      usuarios: usuarios.map((u: any) => ({
        id: u.id,
        nombres: u.nombres || u.user,
        correo: u.correo,
        activo: u.activo,
      })),
    })
  } catch (error: any) {
    console.error("Error al obtener usuarios:", error)
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    )
  }
}
