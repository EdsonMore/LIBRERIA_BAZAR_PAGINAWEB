import { NextResponse } from "next/server"
import { query, queryOne } from "@/lib/db"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    console.log("API: Buscando producto ID:", id)

    // Obtener producto básico
    const producto = await queryOne<any>(
      `SELECT p.id, p.nombre, p.descripcion, p.precio, p.stock, p.imagen, p.categoria_id
       FROM productos p
       WHERE p.id = ?`,
      [id],
    )

    if (!producto) {
      console.log("API: Producto no encontrado")
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    }

    console.log("API: Producto encontrado")

    // Obtener categoría
    const categoria = await queryOne<any>(
      "SELECT nombre FROM categorias WHERE id = ?",
      [producto.categoria_id],
    )

    // Obtener relacionados
    const relacionados = await query<any>(
      "SELECT id, nombre, precio, imagen FROM productos WHERE categoria_id = ? AND id != ? LIMIT 4",
      [producto.categoria_id, id],
    )

    // Obtener reseñas APROBADAS con datos del usuario
    const resenas = await query<any>(
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
       WHERE r.producto_id = ? AND r.estado = 'APROBADA'
       ORDER BY r.fecha DESC 
       LIMIT 10`,
      [id],
    )

    return NextResponse.json({
      id: producto.id,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: producto.precio,
      stock: producto.stock,
      imagen: producto.imagen,
      categoria_id: producto.categoria_id,
      categoria_nombre: categoria?.nombre || "Sin categoría",
      relacionados: relacionados || [],
      resenas: resenas || [],
    })
  } catch (error: any) {
    console.error("Error al obtener producto:", error.message)
    return NextResponse.json(
      { error: "Error al obtener producto" },
      { status: 500 },
    )
  }
}
