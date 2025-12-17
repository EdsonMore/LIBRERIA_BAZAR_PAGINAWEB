import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUserFromSession } from "@/lib/auth"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    // Validar ID
    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ error: "ID de producto inválido" }, { status: 400 })
    }

    const user = await getUserFromSession(req)
    if (!user || !user.roles?.some((r: any) => ["ROLE_ADMIN", "ROLE_SUPER_ADMIN"].includes(r.nombre))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    let body
    try {
      body = await req.json()
    } catch (parseError) {
      return NextResponse.json({ error: "JSON inválido en la solicitud" }, { status: 400 })
    }

    const { imagen } = body

    if (!imagen?.trim()) {
      return NextResponse.json({ error: "Imagen es requerida" }, { status: 400 })
    }

    const imagenUrl = imagen.trim()

    // Validar longitud: permitir base64 de hasta 1MB (data URLs pueden ser grandes)
    if (imagenUrl.length > 1000000) {
      return NextResponse.json(
        { error: "URL de imagen demasiado larga. Intenta con una imagen más pequeña." },
        { status: 400 },
      )
    }

    // Actualizar solo la imagen
    await query(
      `UPDATE productos SET imagen = $1 WHERE id = $2`,
      [imagenUrl, id],
    )

    return NextResponse.json({ message: "Imagen actualizada exitosamente" })
  } catch (error) {
    console.error("Error en PUT /api/admin/productos/[id]/imagen:", error)
    return NextResponse.json({ error: "Error del servidor. Inténtalo de nuevo." }, { status: 500 })
  }
}
