import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUsuarioFromSession, esAdmin, esSuperAdmin } from "@/lib/auth"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const usuario = await getUsuarioFromSession(request as any)

    if (!usuario || (!esAdmin(usuario) && !esSuperAdmin(usuario))) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    // Next.js 15: params is now a Promise
    const { id } = await params

    const compraResult = await query<any>(
      `SELECT c.*, u.nombres, u.apellido_paterno, u.correo
       FROM compras c
       LEFT JOIN usuarios u ON c.usuario_id = u.id
       WHERE c.id = $1`,
      [parseInt(id)]
    )

    if (!compraResult || compraResult.length === 0) {
      return NextResponse.json({ error: "Compra no encontrada" }, { status: 404 })
    }

    const detallesResult = await query<any>(
      `SELECT cd.*, p.nombre FROM detalles_compra cd
       LEFT JOIN productos p ON cd.producto_id = p.id
       WHERE cd.compra_id = $1`,
      [parseInt(id)]
    )

    const compraData = compraResult[0] as any
    const compra = {
      id: compraData.id,
      usuarioId: compraData.usuario_id,
      fechaCompra: compraData.fecha_compra,
      subtotal: compraData.subtotal,
      igv: compraData.igv,
      igvActivo: compraData.igv_activo,
      costoEnvio: compraData.costo_envio,
      envioActivo: compraData.envio_activo,
      total: compraData.total,
      metodoPago: compraData.metodo_pago,
      estado: compraData.estado,
      direccionEntrega: compraData.direccion_entrega,
      numeroSeguimiento: compraData.numero_seguimiento,
      motivoRechazo: compraData.motivo_rechazo,
      createdAt: compraData.created_at,
      usuario: {
        nombres: compraData.nombres,
        apellidoPaterno: compraData.apellido_paterno,
        correo: compraData.correo,
      },
      fecha: compraData.fecha_compra,
      detalles: (detallesResult || []).map((d: any) => ({
        id: d.id,
        compraId: d.compra_id,
        productoId: d.producto_id,
        cantidad: d.cantidad,
        precioUnitario: d.precio_unitario,
        subtotal: d.subtotal,
        nombre: d.nombre,
      })),
    }

    return NextResponse.json(compra)
  } catch (error) {
    console.error("Error al obtener compra:", error)
    return NextResponse.json({ error: "Error al obtener compra" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const usuario = await getUsuarioFromSession(request as any)

    if (!usuario || (!esAdmin(usuario) && !esSuperAdmin(usuario))) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    // Next.js 15: params is now a Promise
    const { id } = await params

    const { estado, motivoRechazo } = await request.json()

    // Estados válidos según la ENUM de PostgreSQL
    const estadosValidos = ["PENDIENTE", "CONFIRMADA", "PREPARANDO", "DESPACHADO", "ENVIADA", "ENTREGADA", "CANCELADA"]
    if (!estado || !estadosValidos.includes(estado)) {
      return NextResponse.json(
        { error: "Estado inválido. Valores válidos: " + estadosValidos.join(", ") },
        { status: 400 }
      )
    }

    // Obtener compra actual para validar transiciones
    const compraActualResult = await query<any>(
      `SELECT estado FROM compras WHERE id = $1`,
      [parseInt(id)]
    )

    if (!compraActualResult || compraActualResult.length === 0) {
      return NextResponse.json({ error: "Compra no encontrada" }, { status: 404 })
    }

    const estadoActual = (compraActualResult[0] as any).estado

    // Definir transiciones permitidas
    const transicionesPermitidas: { [key: string]: string[] } = {
      PENDIENTE: ["CONFIRMADA", "CANCELADA"],
      CONFIRMADA: ["PREPARANDO", "CANCELADA"],
      PREPARANDO: ["DESPACHADO", "CANCELADA"],
      DESPACHADO: ["ENVIADA"],
      ENVIADA: ["ENTREGADA"],
      ENTREGADA: [],
      CANCELADA: [],
    }

    // Validar que la transición sea permitida
    if (!transicionesPermitidas[estadoActual]?.includes(estado)) {
      return NextResponse.json(
        {
          error: `Transición no permitida: ${estadoActual} → ${estado}`,
          transicionesPermitidas: transicionesPermitidas[estadoActual] || [],
        },
        { status: 400 }
      )
    }

    // Validar motivo de cancelación si se cancela
    if (estado === "CANCELADA" && !motivoRechazo?.trim()) {
      return NextResponse.json(
        { error: "El motivo de cancelación es obligatorio" },
        { status: 400 }
      )
    }

    // Actualizar estado y motivo de rechazo
    const result = await query(
      `UPDATE compras SET estado = $1, motivo_rechazo = $2 WHERE id = $3 RETURNING *`,
      [estado, motivoRechazo || null, parseInt(id)]
    )

    if (!result || result.length === 0) {
      return NextResponse.json({ error: "Compra no encontrada" }, { status: 404 })
    }

    // Si la compra se entrega, generar boleta automática para CLIENTE y SUPERADMIN
    if (estado === "ENTREGADA") {
      try {
        const compraData = result[0] as any
        
        // Obtener configuración del sistema para los valores exactos
        const configResult = await query(
          `SELECT aplicar_igv, porcentaje_igv, aplicar_envio, costo_envio FROM configuracion_sistema WHERE id = $1`,
          [1]
        )
        
        const config = configResult?.[0] || {
          aplicar_igv: true,
          porcentaje_igv: 18.0,
          aplicar_envio: true,
          costo_envio: 15.0,
        }
        
        // Usar los valores almacenados en la compra (son los correctos del momento de la compra)
        const subtotal = Number(compraData.subtotal) || 0
        const igv = Number(compraData.igv) || 0
        const costoEnvio = Number(compraData.costo_envio) || 0
        const total = Number(compraData.total) || 0
        const clienteId = compraData.usuario_id
        const adminId = usuario.id
        
        console.log(`[BOLETA] Generando boletas para compra ${id}:`, {
          clienteId,
          adminId,
          subtotal,
          igv,
          costoEnvio,
          total,
        })
        
        // Generar boleta para el CLIENTE
        const boletaClienteResult = await query(
          `INSERT INTO boletas (compra_id, usuario_id, tipo_boleta, subtotal, igv, igv_activo, costo_envio, envio_activo, total, fecha_generacion) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
           ON CONFLICT (compra_id, usuario_id, tipo_boleta) DO UPDATE SET fecha_generacion = NOW()
           RETURNING id`,
          [
            parseInt(id),
            clienteId,
            "CLIENTE",
            subtotal,
            igv,
            compraData.igv_activo,
            costoEnvio,
            compraData.envio_activo,
            total,
          ]
        )
        
        console.log(`[BOLETA] Boleta CLIENTE creada:`, boletaClienteResult?.[0])
        
        // Generar boleta para el SUPERADMIN (usuario que está haciendo la actualización)
        const boletaSuperAdminResult = await query(
          `INSERT INTO boletas (compra_id, usuario_id, tipo_boleta, subtotal, igv, igv_activo, costo_envio, envio_activo, total, fecha_generacion) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
           ON CONFLICT (compra_id, usuario_id, tipo_boleta) DO UPDATE SET fecha_generacion = NOW()
           RETURNING id`,
          [
            parseInt(id),
            adminId,
            "SUPERADMIN",
            subtotal,
            igv,
            compraData.igv_activo,
            costoEnvio,
            compraData.envio_activo,
            total,
          ]
        )
        
        console.log(`[BOLETA] Boleta SUPERADMIN creada:`, boletaSuperAdminResult?.[0])
      } catch (e) {
        console.error("Error al generar boleta:", e)
        // No interrumpir el flujo si falla la boleta
      }
    }

    return NextResponse.json({ 
      message: "Estado actualizado exitosamente", 
      compra: {
        id: result[0].id,
        estado: result[0].estado,
        motivoRechazo: result[0].motivo_rechazo,
      }
    })
  } catch (error) {
    console.error("Error al actualizar compra:", error)
    return NextResponse.json({ error: "Error al actualizar compra" }, { status: 500 })
  }
}
