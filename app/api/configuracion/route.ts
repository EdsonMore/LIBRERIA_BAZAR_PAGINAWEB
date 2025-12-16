import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    let result = await query("SELECT * FROM configuracion_sistema WHERE id = 1")

    if (result.length === 0) {
      // Crear registro por defecto si no existe
      await query(
        `INSERT INTO configuracion_sistema (id, aplicar_igv, porcentaje_igv, aplicar_envio, costo_envio)
         VALUES (1, true, 18.0, true, 15.0)
         ON CONFLICT (id) DO NOTHING`
      )
      result = await query("SELECT * FROM configuracion_sistema WHERE id = 1")
    }

    const config = result[0]
    return NextResponse.json({
      aplicarIGV: config.aplicar_igv,
      porcentajeIGV: config.porcentaje_igv,
      aplicarEnvio: config.aplicar_envio,
      costoEnvio: config.costo_envio,
    })
  } catch (error) {
    console.error("Error al obtener configuraciÃ³n:", error)
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}

