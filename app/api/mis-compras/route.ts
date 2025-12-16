import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUsuarioFromSession } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const usuario = await getUsuarioFromSession(request as any)

    if (!usuario) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    // Obtener compras del usuario
    const compras = await query<any[]>(`SELECT * FROM compras WHERE usuario_id = ? ORDER BY fecha_compra DESC`, [
      usuario.id,
    ])

    // Para cada compra, obtener sus detalles y convertir a camelCase
    for (const compra of compras) {
      const detalles = await query<any[]>(
        `SELECT dc.*, p.nombre, p.imagen, p.descripcion
         FROM detalles_compra dc
         LEFT JOIN productos p ON dc.producto_id = p.id
         WHERE dc.compra_id = ?`,
        [compra.id],
      )

      compra.detalles = detalles.map((d) => ({
        id: d.id,
        compraId: d.compra_id,
        productoId: d.producto_id,
        cantidad: d.cantidad,
        precioUnitario: d.precio_unitario,
        subtotal: d.subtotal,
        createdAt: d.created_at,
        producto: {
          id: d.producto_id,
          nombre: d.nombre,
          imagen: d.imagen,
          descripcion: d.descripcion,
        },
      }))

      // Convertir campos de compra a camelCase
      compra.fechaCompra = compra.fecha_compra
      compra.igvActivo = compra.igv_activo
      compra.costoEnvio = compra.costo_envio
      compra.envioActivo = compra.envio_activo
      compra.metodoPago = compra.metodo_pago
      compra.direccionEntrega = compra.direccion_entrega
      compra.numeroSeguimiento = compra.numero_seguimiento
      compra.motivoRechazo = compra.motivo_rechazo
      compra.createdAt = compra.created_at
      compra.usuarioId = compra.usuario_id

      // Eliminar campos snake_case
      delete compra.fecha_compra
      delete compra.igv_activo
      delete compra.costo_envio
      delete compra.envio_activo
      delete compra.metodo_pago
      delete compra.direccion_entrega
      delete compra.numero_seguimiento
      delete compra.motivo_rechazo
      delete compra.created_at
      delete compra.usuario_id
    }

    return NextResponse.json({ compras })
  } catch (error) {
    console.error("Error al obtener compras:", error)
    return NextResponse.json({ error: "Error al obtener compras" }, { status: 500 })
  }
}

