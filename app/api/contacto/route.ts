import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const { nombre, correo, telefono, asunto, mensaje } = await req.json()

    // Validaciones
    if (!nombre?.trim() || !correo?.trim() || !mensaje?.trim()) {
      return NextResponse.json(
        { error: "Campos requeridos: nombre, correo y mensaje" },
        { status: 400 }
      )
    }

    if (mensaje.trim().length < 10) {
      return NextResponse.json(
        { error: "El mensaje debe tener al menos 10 caracteres" },
        { status: 400 }
      )
    }

    // Guardar en la base de datos
    await query(
      `INSERT INTO contactos (nombre, correo, telefono, asunto, mensaje, fecha_envio, estado)
       VALUES (?, ?, ?, ?, ?, NOW(), 'NUEVO')`,
      [nombre, correo, telefono || null, asunto || "Consulta General", mensaje]
    )

    return NextResponse.json({
      success: true,
      message: "Tu mensaje ha sido enviado exitosamente"
    })
  } catch (error) {
    console.error("Error al guardar contacto:", error)
    return NextResponse.json(
      { error: "Error al procesar tu mensaje" },
      { status: 500 }
    )
  }
}
