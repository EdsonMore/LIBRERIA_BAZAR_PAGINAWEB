import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { nombres, apellidoPaterno, apellidoMaterno, correo, numero, dni, genero, fechaNacimiento, direccion1, direccion2 } = await request.json()

    // Validar que los campos requeridos estén presentes
    if (!nombres || !apellidoPaterno || !correo) {
      return NextResponse.json(
        { error: "Nombres, apellido paterno y correo son requeridos" },
        { status: 400 },
      )
    }

    // Verificar que el correo no esté usado por otro usuario
    const existingEmail = await query<any[]>(
      `SELECT id FROM usuarios WHERE correo = ? AND id != ?`,
      [correo, id],
    )

    if (existingEmail.length > 0) {
      return NextResponse.json({ error: "El correo ya está siendo usado" }, { status: 400 })
    }

    // Actualizar usuario con todos los campos
    await query(
      `UPDATE usuarios 
       SET nombres = ?, 
           apellido_paterno = ?, 
           apellido_materno = ?, 
           correo = ?, 
           numero = ?,
           dni = ?,
           genero = ?,
           fecha_nacimiento = ?,
           direccion1 = ?,
           direccion2 = ?
       WHERE id = ?`,
      [nombres, apellidoPaterno, apellidoMaterno || null, correo, numero || null, dni || null, genero || null, fechaNacimiento || null, direccion1 || null, direccion2 || null, id],
    )

    // Obtener el usuario actualizado
    const result = await query<any[]>(
      `SELECT id, nombres, apellido_paterno, apellido_materno, correo, numero, dni, genero, fecha_nacimiento, direccion1, direccion2
       FROM usuarios WHERE id = ?`,
      [id],
    )

    if (result.length === 0) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    const usuario = result[0] as any
    return NextResponse.json({
      mensaje: "Usuario actualizado exitosamente",
      usuario: {
        id: usuario.id,
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
      }
    })
  } catch (error) {
    console.error("Error al actualizar usuario:", error)
    return NextResponse.json({ error: "Error al actualizar usuario" }, { status: 500 })
  }
}
