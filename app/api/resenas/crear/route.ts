import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUserFromSession } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromSession(req)
    if (!user) {
      return NextResponse.json({ error: "No autorizado. Debes estar logueado" }, { status: 401 })
    }

    const { productoId, compraId, calificacion, comentario } = await req.json()

    if (!productoId || !calificacion || !comentario) {
      return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 })
    }

    if (comentario.length < 10) {
      return NextResponse.json({ error: "El comentario debe tener al menos 10 caracteres" }, { status: 400 })
    }

    if (calificacion < 1 || calificacion > 5) {
      return NextResponse.json({ error: "La calificación debe ser entre 1 y 5" }, { status: 400 })
    }

    // 1. Verificar que la compra existe, pertenece al usuario y está ENTREGADA
    const compra = await query(
      `SELECT estado FROM compras 
       WHERE id = $1 AND usuario_id = $2`,
      [Number(compraId), user.id],
    )

    if (compra.length === 0) {
      return NextResponse.json({ error: "Compra no encontrada" }, { status: 404 })
    }

    if (compra[0].estado !== "ENTREGADA") {
      return NextResponse.json(
        { error: "Solo puedes reseñar productos que ya han sido entregados" },
        { status: 403 },
      )
    }

    // 2. Verificar que el producto está en esa compra
    const detalleCompra = await query(
      `SELECT id FROM detalles_compra 
       WHERE compra_id = $1 AND producto_id = $2`,
      [Number(compraId), Number(productoId)],
    )

    if (detalleCompra.length === 0) {
      return NextResponse.json({ error: "Este producto no está en esa compra" }, { status: 403 })
    }

    // 3. Verificar si ya tiene una reseña para este PRODUCTO (no compra)
    const reseniaExistente = await query(
      `SELECT id FROM resenas 
       WHERE usuario_id = $1 AND producto_id = $2`,
      [user.id, Number(productoId)],
    )

    if (reseniaExistente.length > 0) {
      return NextResponse.json(
        { error: "Ya has reseñado este producto. Solo se permite una reseña por producto" },
        { status: 400 },
      )
    }

    // 4. Crear reseña con estado PENDIENTE (requiere aprobación del SuperAdmin)
    await query(
      `INSERT INTO resenas (usuario_id, producto_id, calificacion, comentario, estado, fecha)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
      [user.id, Number(productoId), Number(calificacion), comentario, "PENDIENTE"],
    )

    return NextResponse.json({
      success: true,
      message: "Reseña enviada exitosamente. Pendiente de aprobación del administrador",
    })
  } catch (error) {
    console.error("Error al crear reseña:", error)
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}

