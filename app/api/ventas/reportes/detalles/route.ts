import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

/**
 * GET /api/ventas/reportes/detalles
 * Obtener detalles de todas las ventas por vendedor para auditoría
 * 
 * Query params:
 * - vendedorId: number (opcional - filtrar por vendedor específico)
 * - fechaInicio: ISO string (opcional)
 * - fechaFin: ISO string (opcional)
 * - limit: number (opcional, default 1000)
 * 
 * Retorna:
 * - Lista de detalles de ventas con: producto, cliente, propietario, cantidad, precio, total, método de pago
 */
export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || ''
    
    if (!cookieHeader && process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const vendedorId = searchParams.get("vendedorId")
    const fechaInicio = searchParams.get("fechaInicio")
    const fechaFin = searchParams.get("fechaFin")
    const limit = Number.parseInt(searchParams.get("limit") || "1000")

    // SQL para obtener detalles de ventas con toda la información necesaria para auditoría
    let sql = `
      SELECT 
        v.id as venta_id,
        v.fecha_hora,
        v.metodo_pago,
        v.total as total_venta,
        v.estado_pago,
        
        -- Información del vendedor
        v.vendedor_id,
        u_vendedor.nombres as vendedor_nombre,
        
        -- Información del cliente
        v.cliente_nombre,
        v.cliente_email,
        v.cliente_telefono,
        
        -- Información del propietario
        v.propietario_id,
        COALESCE(u_propietario.nombres, v.propietario_nombre) as propietario_nombre,
        
        -- Detalles de cada producto en la venta
        dv.id as detalle_id,
        p.id as producto_id,
        p.nombre as producto_nombre,
        dv.cantidad,
        dv.precio_unitario,
        dv.subtotal,
        dv.es_producto_existente,
        
        -- Información adicional
        v.created_at,
        v.updated_at
      
      FROM public.ventas v
      LEFT JOIN public.usuarios u_vendedor ON v.vendedor_id = u_vendedor.id
      LEFT JOIN public.usuarios u_propietario ON v.propietario_id = u_propietario.id
      LEFT JOIN public.detalles_venta dv ON v.id = dv.venta_id
      LEFT JOIN public.productos p ON dv.producto_id = p.id
      
      WHERE v.estado_pago = 'PAGADO'
    `

    const params: any[] = []

    if (vendedorId) {
      sql += " AND v.vendedor_id = ?"
      params.push(Number.parseInt(vendedorId))
    }

    if (fechaInicio) {
      sql += " AND v.fecha_hora >= ?"
      params.push(new Date(fechaInicio))
    }

    if (fechaFin) {
      sql += " AND v.fecha_hora <= ?"
      params.push(new Date(fechaFin))
    }

    sql += `
      ORDER BY v.fecha_hora DESC, v.id DESC, dv.id ASC
      LIMIT ?
    `
    params.push(limit)

    const resultados = await query(sql, params)

    // Procesar resultados para agrupar detalles de venta
    const ventasAgrupadas: any = {}

    resultados.forEach((fila: any) => {
      const ventaId = fila.venta_id

      if (!ventasAgrupadas[ventaId]) {
        ventasAgrupadas[ventaId] = {
          venta_id: fila.venta_id,
          fecha_hora: fila.fecha_hora,
          metodo_pago: fila.metodo_pago,
          total_venta: fila.total_venta,
          estado_pago: fila.estado_pago,
          vendedor_id: fila.vendedor_id,
          vendedor_nombre: fila.vendedor_nombre,
          cliente_nombre: fila.cliente_nombre,
          cliente_email: fila.cliente_email,
          cliente_telefono: fila.cliente_telefono,
          propietario_id: fila.propietario_id,
          propietario_nombre: fila.propietario_nombre,
          detalles: [],
          created_at: fila.created_at,
          updated_at: fila.updated_at
        }
      }

      // Agregar detalle del producto
      if (fila.detalle_id) {
        ventasAgrupadas[ventaId].detalles.push({
          detalle_id: fila.detalle_id,
          producto_id: fila.producto_id,
          producto_nombre: fila.producto_nombre,
          cantidad: fila.cantidad,
          precio_unitario: fila.precio_unitario,
          subtotal: fila.subtotal,
          es_producto_existente: fila.es_producto_existente
        })
      }
    })

    // Convertir a array
    const ventas = Object.values(ventasAgrupadas)

    return NextResponse.json({
      total: ventas.length,
      ventas: ventas
    })
  } catch (error: any) {
    console.error("Error al obtener detalles de ventas:", error)
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    )
  }
}
