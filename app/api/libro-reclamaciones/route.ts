import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

function generarExpediente(): string {
  const fecha = new Date()
  const timestamp = fecha.getTime().toString().slice(-6)
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `EXP-${fecha.getFullYear()}-${random}${timestamp}`
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.json()

    // Validaciones
    if (!formData.nombre?.trim() || !formData.apellidos?.trim() || !formData.email?.trim() || !formData.numeroDocumento?.trim() || !formData.detalleSolicitud?.trim()) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      )
    }

    if (formData.detalleSolicitud.trim().length < 20) {
      return NextResponse.json(
        { error: "El detalle debe tener al menos 20 caracteres" },
        { status: 400 }
      )
    }

    if (!formData.terminos) {
      return NextResponse.json(
        { error: "Debes aceptar los términos y condiciones" },
        { status: 400 }
      )
    }

    const expediente = generarExpediente()

    // Guardar en la base de datos
    await query(
      `INSERT INTO libro_reclamaciones 
       (nombre, apellidos, email, telefono, tipo_documento, numero_documento, direccion, 
        tipo_solicitud, fecha_incidente, detalle, expediente, estado, fecha_registro)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'REGISTRADO', NOW())`,
      [
        formData.nombre,
        formData.apellidos,
        formData.email,
        formData.telefono || null,
        formData.tipoDocumento,
        formData.numeroDocumento,
        formData.direccion || null,
        formData.tipoSolicitud,
        formData.fechaIncidente || null,
        formData.detalleSolicitud,
        expediente
      ]
    )

    return NextResponse.json({
      success: true,
      message: "Tu reclamación ha sido registrada exitosamente",
      expediente: expediente
    })
  } catch (error) {
    console.error("Error al guardar reclamación:", error)
    return NextResponse.json(
      { error: "Error al procesar tu reclamación" },
      { status: 500 }
    )
  }
}
