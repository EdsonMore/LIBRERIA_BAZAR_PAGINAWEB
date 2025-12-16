import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { hashPassword } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      user,
      password,
      correo,
      nombres,
      apellido_paterno,
      apellido_materno,
      dni,
      numero,
      genero,
      tipo_doc,
    } = body

    // Validaciones
    if (!user || !password || !correo || !nombres || !apellido_paterno || !dni) {
      return NextResponse.json({ error: "Todos los campos obligatorios deben ser completados" }, { status: 400 })
    }

    // Verificar si el usuario, correo o DNI ya existen
    const existingUser = await query<any[]>("SELECT id FROM usuarios WHERE \"user\" = ? OR correo = ? OR dni = ?", [
      user,
      correo,
      dni,
    ])

    if (existingUser.length > 0) {
      return NextResponse.json({ error: "El usuario, correo o DNI ya están registrados" }, { status: 400 })
    }

    // Hashear contraseña
    const hashedPassword = await hashPassword(password)

    // Insertar nuevo usuario y obtener el ID
    const result = await query<any>(
      `INSERT INTO usuarios ("user", password, correo, nombres, apellido_paterno, apellido_materno, 
       dni, numero, genero, tipo_doc, activo, fecha_registro)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true, NOW())
       RETURNING id`,
      [
        user,
        hashedPassword,
        correo,
        nombres,
        apellido_paterno || null,
        apellido_materno || null,
        dni,
        numero || null,
        genero || null,
        tipo_doc || "DNI",
      ],
    )

    // PostgreSQL devuelve un array con los resultados RETURNING
    let userId: number | null = null
    
    if (Array.isArray(result) && result.length > 0) {
      const firstResult = result[0] as any
      userId = firstResult?.id ? Number(firstResult.id) : null
    } else if (result && typeof result === 'object') {
      const resultObj = result as any
      userId = resultObj?.id ? Number(resultObj.id) : null
    }

    if (!userId || isNaN(userId)) {
      console.error("Error: No se pudo obtener el ID del usuario")
      return NextResponse.json({ error: "Error al registrar el usuario" }, { status: 500 })
    }

    // Obtener rol CLIENTE
    const rolesCliente = await query<any[]>("SELECT id FROM roles WHERE nombre = ?", ["ROLE_CLIENTE"])

    if (rolesCliente.length === 0) {
      console.error("❌ Error: Rol ROLE_CLIENTE no encontrado")
      return NextResponse.json({ error: "Error al asignar rol" }, { status: 500 })
    }

    // Asignar rol de CLIENTE por defecto
    try {
      const clienteRole = rolesCliente[0] as any
      const rolId = Number(clienteRole.id)
      await query("INSERT INTO usuario_roles (usuario_id, rol_id) VALUES (?, ?)", [userId, rolId])
      console.log("✅ Rol ROLE_CLIENTE asignado al usuario:", userId)
    } catch (roleError) {
      console.error("❌ Error al asignar rol:", roleError)
      // No fallar el registro si el rol no se asigna, pero loguear el error
    }

    return NextResponse.json({
      success: true,
      message: "Usuario registrado exitosamente",
      userId: userId,
    })
  } catch (error) {
    console.error("Error en registro:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}


