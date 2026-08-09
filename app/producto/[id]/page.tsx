import { notFound } from "next/navigation"
import { queryOne, query } from "@/lib/db"
import Navbar from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"
import ProductoDetalle from "@/components/producto-detalle"

async function getProducto(id: string) {
  try {
    console.log(`📦 SSR: Obteniendo producto ${id} directamente de BD`)

    // Obtener producto básico
    const producto = await queryOne<any>(
      `SELECT p.id, p.nombre, p.descripcion, p.precio, p.stock, p.imagen, p.categoria_id,
              p.codigo_barras as "codigoBarras"
       FROM productos p
       WHERE p.id = $1`,
      [id],
    )

    if (!producto) {
      console.log(`❌ Producto ${id} no encontrado`)
      return null
    }

    console.log(`✅ Producto ${id} encontrado: ${producto.nombre}`)

    // Obtener categoría
    const categoria = await queryOne<any>(
      "SELECT nombre FROM categorias WHERE id = $1",
      [producto.categoria_id],
    )

    // Obtener relacionados
    const relacionados = await query<any>(
      "SELECT id, nombre, precio, imagen FROM productos WHERE categoria_id = $1 AND id != $2 LIMIT 4",
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
       WHERE r.producto_id = $1 AND r.estado = 'APROBADA'
       ORDER BY r.fecha DESC 
       LIMIT 10`,
      [id],
    )

    console.log(`📊 Datos completos para producto ${id}: ${resenas.length} reseñas, ${relacionados.length} relacionados`)

    return {
      id: producto.id,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: producto.precio,
      stock: producto.stock,
      imagen: producto.imagen,
      categoria_id: producto.categoria_id,
      codigoBarras: producto.codigoBarras || "",
      categoria_nombre: categoria?.nombre || "Sin categoría",
      relacionados: relacionados || [],
      resenas: resenas || [],
    }
  } catch (error: any) {
    console.error(`❌ Error obteniendo producto ${id}:`, {
      message: error.message,
      code: error.code,
    })
    return null
  }
}

export default async function ProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  console.log(`📄 SSR: Renderizando página de producto ${id}`)
  
  const data = await getProducto(id)

  if (!data || !data.id) {
    console.log(`⚠️ SSR: Producto ${id} no encontrado, mostrando 404`)
    notFound()
  }

  return (
    <>
      <Navbar />
      <ProductoDetalle producto={data} relacionados={data.relacionados} resenas={data.resenas} />
      <Footer />
    </>
  )
}
