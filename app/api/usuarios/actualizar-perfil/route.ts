import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUsuarioFromSession } from "@/lib/auth"

export async function PUT(request: Request) {
  try {
    const usuario = await getUsuarioFromSession(request as any)

    if (!usuario) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const { nombres, apellidoPaterno, apellidoMaterno, correo, numero, direccion1, direccion2, dni, genero, fechaNacimiento } = body

    // Validaciones
    if (!nombres || !apellidoPaterno || !correo) {
      return NextResponse.json({ error: "Campos obligatorios faltantes" }, { status: 400 })
    }

    // Verificar que el correo no esté en uso por otro usuario
    const existing = await query<any[]>("SELECT id FROM usuarios WHERE correo = ? AND id != ?", [correo, usuario.id])

    if (existing.length > 0) {
      return NextResponse.json({ error: "El correo ya está en uso" }, { status: 400 })
    }

    // Actualizar usuario con todos los campos
    await query(
      `UPDATE usuarios SET
       nombres = ?, apellido_paterno = ?, apellido_materno = ?,
       correo = ?, numero = ?, dni = ?, genero = ?, fecha_nacimiento = ?, direccion1 = ?, direccion2 = ?
       WHERE id = ?`,
      [nombres, apellidoPaterno, apellidoMaterno || null, correo, numero || null, dni || null, genero || null, fechaNacimiento || null, direccion1 || null, direccion2 || null, usuario.id],
    )

    // Obtener datos actualizados
    const result = await query<any[]>(
      `SELECT id, nombres, apellido_paterno, apellido_materno, correo, numero, dni, genero, fecha_nacimiento, direccion1, direccion2
       FROM usuarios WHERE id = ?`,
      [usuario.id],
    )

    if (result.length === 0) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    const usuarioActualizado = result[0] as any
    return NextResponse.json({
      success: true,
      message: "Perfil actualizado exitosamente",
      usuario: {
        id: usuarioActualizado.id,
        nombres: usuarioActualizado.nombres,
        apellidoPaterno: usuarioActualizado.apellido_paterno,
        apellidoMaterno: usuarioActualizado.apellido_materno,
        correo: usuarioActualizado.correo,
        numero: usuarioActualizado.numero,
        dni: usuarioActualizado.dni,
        genero: usuarioActualizado.genero,
        fechaNacimiento: usuarioActualizado.fecha_nacimiento,
        direccion1: usuarioActualizado.direccion1,
        direccion2: usuarioActualizado.direccion2,
      }
    })
  } catch (error) {
    console.error("Error al actualizar perfil:", error)
    return NextResponse.json({ error: "Error al actualizar perfil" }, { status: 500 })
  }
}


