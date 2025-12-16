import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { verifyPassword, createSession } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { user, password } = body

    console.log("🔐 Login - usuario:", user)

    if (!user || !password) {
      return NextResponse.json({ error: "Usuario y contraseña son requeridos" }, { status: 400 })
    }

    // Buscar usuario por user (username)
    const usuarios = await query<any[]>(
      `SELECT u.*, STRING_AGG(DISTINCT r.id::text, ',') as roleIds, STRING_AGG(DISTINCT r.nombre, ',') as roleNombres
       FROM usuarios u
       LEFT JOIN usuario_roles ur ON u.id = ur.usuario_id
       LEFT JOIN roles r ON ur.rol_id = r.id
       WHERE u."user" = $1 AND u.activo = true
       GROUP BY u.id`,
      [user],
    )

    console.log("📊 Usuarios encontrados:", usuarios.length)
    if (usuarios.length > 0) {
      const firstUser = usuarios[0] as any
      console.log("👤 Usuario:", firstUser.user, "Hash:", firstUser.password.substring(0, 10) + "...")
    }

    if (usuarios.length === 0) {
      console.log("❌ Usuario no encontrado o inactivo")
      return NextResponse.json({ error: "Usuario o contraseña incorrecto" }, { status: 401 })
    }

    const usuario = usuarios[0] as any

    // Verificar contraseña
    const passwordMatch = await verifyPassword(password, usuario.password)

    console.log("🔑 Password match:", passwordMatch)

    if (!passwordMatch) {
      console.log("❌ Contraseña incorrecta")
      return NextResponse.json({ error: "Usuario o contraseña incorrecto" }, { status: 401 })
    }

    console.log("✅ Login exitoso para:", usuario.user)

    // Actualizar última conexión
    await query("UPDATE usuarios SET ultima_conexion = NOW() WHERE id = ?", [usuario.id])

    // Convertir roles concatenados en array
    let roles = []
    if (usuario.roleIds && usuario.roleNombres) {
      const ids = usuario.roleIds.split(",")
      const nombres = usuario.roleNombres.split(",")
      roles = ids.map((id: string, index: number) => ({
        id: Number.parseInt(id),
        nombre: nombres[index],
        activo: true,
      }))
    }

    // Crear sesión
    const sessionData = createSession(usuario.id)

    // Preparar respuesta sin contraseña
    const usuarioResponse = {
      id: usuario.id,
      user: usuario.user,
      correo: usuario.correo,
      nombres: usuario.nombres,
      apellidoPaterno: usuario.apellido_paterno,
      apellidoMaterno: usuario.apellido_materno,
      direccion1: usuario.direccion1,
      direccion2: usuario.direccion2,
      numero: usuario.numero,
      genero: usuario.genero,
      dni: usuario.dni,
      activo: usuario.activo,
      roles: roles,
    }

    const response = NextResponse.json({
      success: true,
      usuario: usuarioResponse,
      message: "Inicio de sesión exitoso",
    })

    // Establecer cookie de sesión
    response.cookies.set("session", sessionData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Error en login:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}


