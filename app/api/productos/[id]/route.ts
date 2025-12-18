import { NextResponse } from "next/server"
import { query, queryOne } from "@/lib/db"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    console.log(`📦 API GET /api/productos/${id} - iniciando...`)

    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ error: "ID de producto inválido" }, { status: 400 })
    }

    // En Vercel, esperar un poco para asegurar que lecturas recientes obtienen datos frescos
    // después de actualizaciones
    await new Promise(resolve => setTimeout(resolve, 50))

    // Obtener producto básico
    console.log(`🔍 Buscando producto ID: ${id}`)
    const producto = await queryOne<any>(
      `SELECT p.id, p.nombre, p.descripcion, p.precio, p.stock, p.imagen, p.categoria_id, p.disponible::boolean as disponible
       FROM productos p
       WHERE p.id = ?`,
      [id],
    )

    if (!producto) {
      console.log(`❌ Producto ${id} no encontrado`)
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    }

    console.log(`✅ Producto ${id} encontrado: ${producto.nombre}`)

    // Obtener categoría
    let categoria = null
    try {
      categoria = await queryOne<any>(
        "SELECT nombre FROM categorias WHERE id = ?",
        [producto.categoria_id],
      )
    } catch (error) {
      console.warn(`⚠️ Error obteniendo categoría para producto ${id}:`, error)
    }

    // Obtener relacionados
    let relacionados = []
    try {
      relacionados = await query<any>(
        "SELECT id, nombre, precio, imagen FROM productos WHERE categoria_id = ? AND id != ? LIMIT 4",
        [producto.categoria_id, id],
      )
    } catch (error) {
      console.warn(`⚠️ Error obteniendo productos relacionados para ${id}:`, error)
    }

    // Obtener reseñas APROBADAS con datos del usuario
    let resenas = []
    try {
      resenas = await query<any>(
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
    } catch (error) {
      console.warn(`⚠️ Error obteniendo reseñas para producto ${id}:`, error)
    }

    console.log(`📊 Datos completos para producto ${id}: ${resenas.length} reseñas, ${relacionados.length} relacionados`)

    return NextResponse.json(
      {
        id: producto.id,
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        precio: producto.precio,
        stock: producto.stock,
        imagen: producto.imagen,
        categoria_id: producto.categoria_id,
        disponible: producto.disponible,
        categoria_nombre: categoria?.nombre || "Sin categoría",
        relacionados: relacionados || [],
        resenas: resenas || [],
      },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      }
    )
  } catch (error: any) {
    console.error(`❌ Error en GET /api/productos/[id]:`, {
      message: error.message,
      code: error.code,
      errno: error.errno,
      syscall: error.syscall,
      stack: error.stack?.split("\n").slice(0, 3),
    })
    return NextResponse.json(
      { error: "Error al obtener producto", details: error.message },
      { status: 500 },
    )
  }
}
