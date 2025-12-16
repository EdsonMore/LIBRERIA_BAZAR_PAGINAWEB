import { NextRequest, NextResponse } from "next/server"
import { getUsuarioFromSession } from "@/lib/auth"
import { query } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const session = await getUsuarioFromSession(req)
    if (!session?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { productoId, calificacion, comentario } = await req.json()

    // Validaciones
    if (!productoId || !calificacion || !comentario) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      )
    }

    if (calificacion < 1 || calificacion > 5) {
      return NextResponse.json(
        { error: "Calificación debe estar entre 1 y 5" },
        { status: 400 }
      )
    }

    if (!comentario.trim() || comentario.trim().length < 10) {
      return NextResponse.json(
        { error: "El comentario debe tener al menos 10 caracteres" },
        { status: 400 }
      )
    }

    // Verificar que el producto existe
    const productoResult = await query(
      "SELECT id FROM productos WHERE id = ?",
      [productoId]
    )

    if (!productoResult || productoResult.length === 0) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      )
    }

    // Verificar si el usuario ya tiene una reseña para este producto
    const resenaExistente = await query(
      `SELECT id FROM resenas WHERE usuario_id = ? AND producto_id = ?`,
      [session.id, productoId]
    )

    if (resenaExistente && resenaExistente.length > 0) {
      return NextResponse.json(
        { error: "Ya has reseñado este producto. Solo se permite una reseña por producto." },
        { status: 400 }
      )
    }

    // Insertar la reseña
    const fecha = new Date().toISOString()
    const insertResult = await query(
      `INSERT INTO resenas (usuario_id, producto_id, calificacion, comentario, fecha, estado, created_at) 
       VALUES (?, ?, ?, ?, ?, 'PENDIENTE', ?)`,
      [session.id, productoId, calificacion, comentario.trim(), fecha, fecha]
    )

    // Obtener la reseña creada con datos del usuario
    const resenaCreada = await query(
      `SELECT 
        r.id,
        r.usuario_id,
        r.producto_id,
        r.calificacion,
        r.comentario,
        r.fecha,
        r.estado,
        u.nombres,
        u.apellido_paterno as "apellidoPaterno",
        u.apellido_materno as "apellidoMaterno"
       FROM resenas r
       JOIN usuarios u ON r.usuario_id = u.id
       WHERE r.id = (SELECT LAST_INSERT_ID())`,
      []
    )

    if (!resenaCreada || resenaCreada.length === 0) {
      return NextResponse.json(
        { resena: { id: insertResult.insertId, ...{ usuario_id: session.id, producto_id: productoId, calificacion, comentario, fecha, estado: 'PENDIENTE' } } },
        { status: 201 }
      )
    }

    return NextResponse.json(
      { resena: resenaCreada[0] },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error en POST /api/resenas:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const productIdParam = req.nextUrl.searchParams.get("productoId")

    let sql = `
      SELECT 
        r.id,
        r.usuario_id,
        r.producto_id,
        r.calificacion,
        r.comentario,
        r.fecha,
        r.estado,
        u.nombres,
        u.apellido_paterno as "apellidoPaterno",
        u.apellido_materno as "apellidoMaterno"
      FROM resenas r
      JOIN usuarios u ON r.usuario_id = u.id
    `
    const params: any[] = []

    if (productIdParam) {
      sql += " WHERE r.producto_id = ?"
      params.push(productIdParam)
    }

    sql += " ORDER BY r.fecha DESC"

    const resenas = await query(sql, params)

    return NextResponse.json({ resenas: resenas || [] })
  } catch (error) {
    console.error("Error en GET /api/resenas:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
