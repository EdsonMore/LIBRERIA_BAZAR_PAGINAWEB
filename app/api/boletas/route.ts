import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUsuarioFromSession, esAdmin, esSuperAdmin } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const usuario = await getUsuarioFromSession(request as any)

    if (!usuario) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const compraId = searchParams.get("compraId")
    const usuarioId = searchParams.get("usuarioId")

    // Si es cliente normal, solo puede ver sus propias boletas
    let boletasResult: any[] = []

    if (compraId) {
      // Buscar boleta específica de una compra
      boletasResult = await query<any>(
        `SELECT b.*, c.usuario_id, u.nombres, u.apellido_paterno
         FROM boletas b
         LEFT JOIN compras c ON b.compra_id = c.id
         LEFT JOIN usuarios u ON b.usuario_id = u.id
         WHERE b.compra_id = $1`,
        [parseInt(compraId)]
      )

      // Verificar permisos
      if (boletasResult.length > 0) {
        const boleta = boletasResult[0] as any
        if (
          usuario.id !== boleta.usuario_id &&
          !esAdmin(usuario) &&
          !esSuperAdmin(usuario)
        ) {
          return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
        }
      }
    } else if (usuarioId && (esAdmin(usuario) || esSuperAdmin(usuario))) {
      // Solo admins pueden listar boletas de otros usuarios
      boletasResult = await query<any>(
        `SELECT b.*, u.nombres, u.apellido_paterno
         FROM boletas b
         LEFT JOIN usuarios u ON b.usuario_id = u.id
         WHERE b.usuario_id = $1
         ORDER BY b.fecha_generacion DESC`,
        [parseInt(usuarioId)]
      )
    } else {
      // Cliente: listar sus propias boletas
      boletasResult = await query<any>(
        `SELECT b.*, u.nombres, u.apellido_paterno
         FROM boletas b
         LEFT JOIN usuarios u ON b.usuario_id = u.id
         WHERE b.usuario_id = $1
         ORDER BY b.fecha_generacion DESC`,
        [usuario.id]
      )
    }

    const boletas = boletasResult.map((b: any) => ({
      id: b.id,
      numeroBoleta: b.numero_boleta,
      compraId: b.compra_id,
      tipoBoleta: b.tipo_boleta,
      usuario: {
        nombres: b.nombres,
        apellidoPaterno: b.apellido_paterno,
      },
      resumen: {
        subtotal: Number(b.subtotal),
        igv: Number(b.igv),
        costoEnvio: Number(b.costo_envio),
        total: Number(b.total),
      },
      fechaGeneracion: b.fecha_generacion,
    }))

    return NextResponse.json({ boletas })
  } catch (error) {
    console.error("Error al obtener boletas:", error)
    return NextResponse.json({ error: "Error al obtener boletas" }, { status: 500 })
  }
}
