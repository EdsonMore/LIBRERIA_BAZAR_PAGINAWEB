import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUsuarioFromSession, esAdmin, esSuperAdmin } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const usuario = await getUsuarioFromSession(request as any)

    if (!usuario || (!esAdmin(usuario) && !esSuperAdmin(usuario))) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const estado = searchParams.get("estado")

    let sql = `
      SELECT c.*, u.nombres as usuario_nombre, u.apellido_paterno, u.correo as usuario_correo
      FROM compras c
      LEFT JOIN usuarios u ON c.usuario_id = u.id
    `
    const params: any[] = []

    if (estado) {
      sql += " WHERE c.estado = $1"
      params.push(estado)
    }

    sql += " ORDER BY c.fecha_compra DESC"

    const compras = await query<any[]>(sql, params)

    // Transformar los datos para que coincidan con lo que espera el cliente
    const comprasTransformadas = (compras || []).map((c: any) => ({
      id: c.id,
      usuarioId: c.usuario_id,
      fechaCompra: c.fecha_compra,
      subtotal: c.subtotal,
      igv: c.igv,
      igvActivo: c.igv_activo,
      costoEnvio: c.costo_envio,
      envioActivo: c.envio_activo,
      total: c.total,
      metodoPago: c.metodo_pago,
      estado: c.estado,
      direccionEntrega: c.direccion_entrega,
      numeroSeguimiento: c.numero_seguimiento,
      motivoRechazo: c.motivo_rechazo,
      createdAt: c.created_at,
      usuario: {
        nombres: c.nombres,
        apellidoPaterno: c.apellido_paterno,
        correo: c.usuario_correo,
      },
      fecha: c.fecha_compra,
      detalles: [],
    }))

    return NextResponse.json(comprasTransformadas)
  } catch (error) {
    console.error("Error al obtener compras:", error)
    return NextResponse.json({ error: "Error al obtener compras" }, { status: 500 })
  }
}


