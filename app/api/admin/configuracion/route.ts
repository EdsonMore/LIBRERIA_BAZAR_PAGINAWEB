import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUserFromSession } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromSession(req)
    if (!user || !user.roles?.some((r: any) => ["ROLE_SUPER_ADMIN"].includes(r.nombre))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { aplicarIGV, porcentajeIGV, aplicarEnvio, costoEnvio } = await req.json()

    await query(
      `UPDATE configuracion_sistema 
       SET aplicar_igv = $1, porcentaje_igv = $2, aplicar_envio = $3, costo_envio = $4
       WHERE id = 1`,
      [aplicarIGV, porcentajeIGV, aplicarEnvio, costoEnvio],
    )

    return NextResponse.json({ success: true, message: "Configuración actualizada" })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}


