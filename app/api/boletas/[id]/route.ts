import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUsuarioFromSession, esAdmin, esSuperAdmin } from "@/lib/auth"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const usuario = await getUsuarioFromSession(request as any)

    if (!usuario) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { id } = await params
    const boletaId = parseInt(id)

    // Obtener boleta con detalles completos
    const boletaResult = await query<any>(
      `SELECT b.*, c.fecha_compra, c.direccion_entrega, c.numero_seguimiento, c.metodo_pago,
              u.nombres, u.apellido_paterno, u.correo, u.numero
       FROM boletas b
       LEFT JOIN compras c ON b.compra_id = c.id
       LEFT JOIN usuarios u ON b.usuario_id = u.id
       WHERE b.id = $1`,
      [boletaId]
    )

    if (!boletaResult || boletaResult.length === 0) {
      return NextResponse.json({ error: "Boleta no encontrada" }, { status: 404 })
    }

    const boleta = boletaResult[0] as any
    const compraId = boleta.compra_id

    // Verificar permisos: el usuario solo puede ver su propia boleta o si es admin
    if (
      usuario.id !== boleta.usuario_id &&
      !esAdmin(usuario) &&
      !esSuperAdmin(usuario)
    ) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    // Obtener detalles de la compra
    const detallesResult = await query<any>(
      `SELECT cd.*, p.nombre, p.imagen
       FROM detalles_compra cd
       LEFT JOIN productos p ON cd.producto_id = p.id
       WHERE cd.compra_id = $1`,
      [compraId]
    )

    const boletaFormato = {
      id: boleta.id,
      numeroBoleta: boleta.numero_boleta,
      compraId: boleta.compra_id,
      tipoBoleta: boleta.tipo_boleta,
      fechaGeneracion: boleta.fecha_generacion,
      fechaCompra: boleta.fecha_compra,
      cliente: {
        nombres: boleta.nombres,
        apellidoPaterno: boleta.apellido_paterno,
        correo: boleta.correo,
        telefono: boleta.telefono,
      },
      entrega: {
        direccion: boleta.direccion_entrega,
        numeroSeguimiento: boleta.numero_seguimiento,
      },
      metodoPago: boleta.metodo_pago,
      detalles: (detallesResult || []).map((d: any) => ({
        productoId: d.producto_id,
        nombre: d.nombre,
        cantidad: d.cantidad,
        precioUnitario: Number(d.precio_unitario),
        subtotal: Number(d.subtotal),
        imagen: d.imagen,
      })),
      resumen: {
        subtotal: Number(boleta.subtotal),
        igv: Number(boleta.igv),
        igvActivo: boleta.igv_activo,
        costoEnvio: Number(boleta.costo_envio),
        envioActivo: boleta.envio_activo,
        total: Number(boleta.total),
      },
    }

    return NextResponse.json(boletaFormato)
  } catch (error) {
    console.error("Error al obtener boleta:", error)
    return NextResponse.json({ error: "Error al obtener boleta" }, { status: 500 })
  }
}
