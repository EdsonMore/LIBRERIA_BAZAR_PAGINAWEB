import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUsuarioFromSession } from "@/lib/auth"

export async function DELETE(request: NextRequest) {
  try {
    // Obtener usuario autenticado
    const usuarioAutenticado = await getUsuarioFromSession(request)

    if (!usuarioAutenticado) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    // Verificar que sea SUPER_ADMIN
    const esSuperAdmin = usuarioAutenticado.roles?.some((r) => r.nombre === "ROLE_SUPER_ADMIN")

    if (!esSuperAdmin) {
      return NextResponse.json(
        { error: "No tienes permisos para eliminar usuarios" },
        { status: 403 }
      )
    }

    // Obtener ID del usuario a eliminar del body
    const body = await request.json()
    let { usuarioId } = body

    // Convertir a número si es string
    if (typeof usuarioId === "string") {
      usuarioId = Number(usuarioId)
    }

    if (!usuarioId || typeof usuarioId !== "number" || isNaN(usuarioId)) {
      console.error("❌ Error: usuarioId inválido:", usuarioId, "tipo:", typeof usuarioId)
      return NextResponse.json({ error: "ID de usuario inválido" }, { status: 400 })
    }

    // Validación: No puede eliminar a sí mismo
    if (usuarioAutenticado.id === usuarioId) {
      return NextResponse.json(
        { error: "No puedes eliminar tu propia cuenta" },
        { status: 400 }
      )
    }

    // Obtener información del usuario a eliminar
    const usuariosAEliminar = await query<any[]>(
      `SELECT u.id, u.user, u.nombres, u.apellido_paterno
       FROM usuarios u
       WHERE u.id = $1 AND u.activo = true`,
      [usuarioId]
    )

    if (usuariosAEliminar.length === 0) {
      return NextResponse.json({ error: "Usuario no encontrado o ya inactivo" }, { status: 404 })
    }

    const usuarioAEliminar = usuariosAEliminar[0] as any

    // Verificar que no sea SUPER_ADMIN
    const rolesDelUsuario = await query<any[]>(
      `SELECT r.nombre
       FROM roles r
       INNER JOIN usuario_roles ur ON ur.rol_id = r.id
       WHERE ur.usuario_id = $1`,
      [usuarioId]
    )

    const esOtroSuperAdmin = rolesDelUsuario.some((r: any) => r.nombre === "ROLE_SUPER_ADMIN")

    if (esOtroSuperAdmin) {
      return NextResponse.json(
        { error: "No puedes eliminar a otros administradores" },
        { status: 400 }
      )
    }

    // Realizar hard delete (eliminar completamente del sistema)
    // Primero eliminar relaciones en usuario_roles
    await query(
      `DELETE FROM usuario_roles WHERE usuario_id = $1`,
      [usuarioId]
    )

    // Luego eliminar el usuario
    await query(
      `DELETE FROM usuarios WHERE id = $1`,
      [usuarioId]
    )

    // Log de eliminación para auditoría
    console.log(
      `🗑️  [AUDIT] Usuario ELIMINADO (HARD DELETE): ID=${usuarioId}, Usuario=${usuarioAEliminar.user}, Nombre=${usuarioAEliminar.nombres} ${usuarioAEliminar.apellido_paterno}, Eliminado por: ${usuarioAutenticado.user} (ID=${usuarioAutenticado.id})`
    )

    return NextResponse.json({
      success: true,
      message: `Usuario ${usuarioAEliminar.nombres} ha sido eliminado completamente del sistema`,
      usuarioEliminado: {
        id: usuarioAEliminar.id,
        user: usuarioAEliminar.user,
        nombres: usuarioAEliminar.nombres,
      },
    })
  } catch (error) {
    console.error("❌ Error al eliminar usuario:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
