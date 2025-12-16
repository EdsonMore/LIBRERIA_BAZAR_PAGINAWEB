import { NextResponse, type NextRequest } from "next/server"
import { query } from "@/lib/db"
import { getUsuarioFromSession } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const usuario = await getUsuarioFromSession(request)

    if (!usuario) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    // Debug: Query directa a la BD
    const debugRoles = await query<any[]>(
      `SELECT ur.usuario_id, ur.rol_id, r.nombre, r.id as role_id
       FROM usuario_roles ur
       INNER JOIN roles r ON ur.rol_id = r.id
       WHERE ur.usuario_id = $1`,
      [usuario.id]
    )

    console.log("🔧 DEBUG - Usuario:", usuario.user)
    console.log("🔧 DEBUG - Usuario ID:", usuario.id)
    console.log("🔧 DEBUG - Roles desde BD:", debugRoles)
    console.log("🔧 DEBUG - Roles en objeto usuario:", usuario.roles)

    return NextResponse.json({
      debug: {
        usuarioId: usuario.id,
        usuario: usuario.user,
        rolesDesdeObjeto: usuario.roles,
        rolesDirectoFromDB: debugRoles,
        match: JSON.stringify(usuario.roles) === JSON.stringify(debugRoles)
      }
    })
  } catch (error) {
    console.error("Error en debug:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
