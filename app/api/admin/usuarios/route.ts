import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUserFromSession } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromSession(req)
    if (!user || !user.roles?.some((r: any) => ["ROLE_ADMIN", "ROLE_SUPER_ADMIN"].includes(r.nombre))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const usuarios = await query("SELECT * FROM usuarios ORDER BY fecha_registro DESC")

    // Obtener roles para cada usuario y transformar datos
    const usuariosFormateados = await Promise.all(usuarios.map(async (usuario: any) => {
      const roles = await query(
        `SELECT r.nombre FROM roles r
         INNER JOIN usuario_roles ur ON ur.rol_id = r.id
         WHERE ur.usuario_id = ?`,
        [usuario.id],
      )
      
      return {
        id: usuario.id,
        user: usuario.user,
        nombres: usuario.nombres,
        apellidoPaterno: usuario.apellido_paterno,
        apellidoMaterno: usuario.apellido_materno,
        correo: usuario.correo,
        numero: usuario.numero,
        dni: usuario.dni,
        genero: usuario.genero,
        fechaNacimiento: usuario.fecha_nacimiento,
        direccion1: usuario.direccion1,
        direccion2: usuario.direccion2,
        activo: usuario.activo,
        roles: roles.map((r: any) => r.nombre),
        ultima_conexion: usuario.ultima_conexion
      }
    }))

    return NextResponse.json(usuariosFormateados)
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}


