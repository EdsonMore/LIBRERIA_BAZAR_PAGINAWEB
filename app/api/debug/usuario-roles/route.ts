import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUsuarioFromSession } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const usuario = await getUsuarioFromSession(request as any)

    if (!usuario) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    // Obtener datos crudos de la base de datos para debug
    const usuarios = await query<any[]>(
      `SELECT u.id, u.user, STRING_AGG(r.id::text, ',') as roleIds, STRING_AGG(r.nombre, ',') as roleNombres
       FROM usuarios u
       LEFT JOIN usuario_roles ur ON u.id = ur.usuario_id
       LEFT JOIN roles r ON ur.rol_id = r.id
       WHERE u.id = $1 AND u.activo = true
       GROUP BY u.id`,
      [usuario.id],
    )

    // También obtener los datos de usuario_roles directamente
    const usuarioRoles = await query<any[]>(
      `SELECT ur.usuario_id, ur.rol_id, r.nombre, r.id
       FROM usuario_roles ur
       LEFT JOIN roles r ON ur.rol_id = r.id
       WHERE ur.usuario_id = $1`,
      [usuario.id],
    )

    return NextResponse.json({
      usuario: usuario,
      debug: {
        usuarioFromSession: {
          id: usuario.id,
          user: usuario.user,
          roles: usuario.roles,
        },
        rawDatabaseQuery: usuarios[0] || null,
        usuarioRolesTable: usuarioRoles,
      },
    })
  } catch (error) {
    console.error("Error en debug:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
