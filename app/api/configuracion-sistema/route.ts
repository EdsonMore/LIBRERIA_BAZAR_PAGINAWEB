import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    const config = await query<any>("SELECT * FROM configuracion_sistema LIMIT 1")

    if (config.length === 0) {
      return NextResponse.json({
        aplicarIGV: true,
        porcentajeIGV: 18.0,
        aplicarEnvio: true,
        costoEnvio: 15.0,
      })
    }

    // Normalizar respuesta a camelCase para consistencia con frontend
    const dbConfig = config[0]
    return NextResponse.json({
      aplicarIGV: dbConfig.aplicar_igv ?? true,
      porcentajeIGV: dbConfig.porcentaje_igv ?? 18.0,
      aplicarEnvio: dbConfig.aplicar_envio ?? true,
      costoEnvio: dbConfig.costo_envio ?? 15.0,
    })
  } catch (error) {
    console.error("Error al obtener configuración:", error)
    return NextResponse.json(
      {
        aplicarIGV: true,
        porcentajeIGV: 18.0,
        aplicarEnvio: true,
        costoEnvio: 15.0,
      },
      { status: 200 },
    )
  }
}
