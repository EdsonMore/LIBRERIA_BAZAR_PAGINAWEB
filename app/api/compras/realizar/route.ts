import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUsuarioFromSession } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const user = await getUsuarioFromSession(req)
    const body = await req.json()

    const { nombres, apellido, correo, telefono, dni, direccion, metodoPago, items } = body

    // Validaciones
    if (!nombres || !correo || !direccion || !items || items.length === 0) {
      return NextResponse.json({ success: false, message: "Faltan datos obligatorios" }, { status: 400 })
    }

    // Obtener configuración del sistema
    const configResult = await query("SELECT * FROM configuracion_sistema WHERE id = $1", [1])
    const config = configResult?.[0] || {
      aplicar_igv: true,
      porcentaje_igv: 18.0,
      aplicar_envio: true,
      costo_envio: 15.0,
    }

    // Convertir a números para asegurar cálculos correctos
    const porcentajeIGV = Number(config.porcentaje_igv) || 18.0
    const costoEnvio = Number(config.costo_envio) || 15.0

    // Obtener precios de productos y calcular totales
    let subtotal = 0
    const itemsConPrecio = []

    for (const item of items) {
      const prodResult = await query("SELECT precio FROM productos WHERE id = $1", [item.productoId || item.id])
      
      if (prodResult.length === 0) {
        return NextResponse.json({ success: false, message: `Producto ${item.productoId || item.id} no encontrado` }, { status: 400 })
      }

      const precio = Number(prodResult[0].precio)
      const itemSubtotal = precio * item.cantidad
      subtotal += itemSubtotal

      itemsConPrecio.push({
        productoId: item.productoId || item.id,
        cantidad: item.cantidad,
        precio_unitario: precio,
        subtotal: itemSubtotal,
      })
    }

    const igv = config.aplicar_igv ? subtotal * (porcentajeIGV / 100) : 0
    const costo_envio = config.aplicar_envio ? costoEnvio : 0
    const total = subtotal + igv + costo_envio

    // Crear la compra
    const numero_seguimiento = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`

    const insertCompra = await query<any>(
      `INSERT INTO compras 
       (usuario_id, fecha_compra, estado, metodo_pago, direccion_entrega, 
        subtotal, igv, costo_envio, total, numero_seguimiento, igv_activo, envio_activo)
       VALUES ($1, NOW(), $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id`,
      [
        user?.id || null,
        "PENDIENTE",
        metodoPago,
        direccion,
        subtotal,
        igv,
        costo_envio,
        total,
        numero_seguimiento,
        config.aplicar_igv ? true : false,
        config.aplicar_envio ? true : false,
      ],
    )

    const compraId = insertCompra && insertCompra.length > 0 ? insertCompra[0].id : null
    if (!compraId) {
      return NextResponse.json({ success: false, message: "Error al crear compra" }, { status: 500 })
    }

    // Insertar detalles
    for (const item of itemsConPrecio) {
      await query(
        `INSERT INTO detalles_compra (compra_id, producto_id, cantidad, precio_unitario, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [compraId, item.productoId, item.cantidad, item.precio_unitario, item.subtotal],
      )

      // Actualizar stock
      await query("UPDATE productos SET stock = stock - $1 WHERE id = $2", [item.cantidad, item.productoId])
    }

    // Limpiar carrito si el usuario está autenticado
    if (user) {
      await query("DELETE FROM item_carrito WHERE usuario_id = $1", [user.id])
    }

    return NextResponse.json({
      success: true,
      message: "Compra realizada exitosamente",
      compraId,
      numero_seguimiento,
    })
  } catch (error: any) {
    console.error("Error al realizar compra:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Error al procesar la compra" },
      { status: 500 },
    )
  }
}

