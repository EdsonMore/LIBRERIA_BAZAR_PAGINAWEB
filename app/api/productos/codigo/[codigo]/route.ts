import { NextResponse } from "next/server"
import { queryOne } from "@/lib/db"

export async function GET(request: Request, { params }: { params: Promise<{ codigo: string }> }) {
  try {
    const { codigo } = await params
    const codigoLimpio = (codigo || "").trim()

    if (!codigoLimpio) {
      return NextResponse.json({ error: "Código de barras requerido" }, { status: 400 })
    }

    const producto = await queryOne<any>(
      `SELECT p.id, p.nombre, p.descripcion, p.precio, p.stock, p.imagen,
              p.categoria_id, p.disponible::boolean as disponible,
              p.codigo_barras as "codigoBarras",
              c.nombre as categoria_nombre
       FROM productos p
       LEFT JOIN categorias c ON p.categoria_id = c.id
       WHERE p.codigo_barras = $1 AND p.disponible = true
       LIMIT 1`,
      [codigoLimpio],
    )

    if (!producto) {
      return NextResponse.json({ producto: null }, { status: 200 })
    }

    return NextResponse.json(
      {
        producto: {
          id: producto.id,
          nombre: producto.nombre,
          descripcion: producto.descripcion,
          precio: producto.precio,
          stock: producto.stock,
          imagen: producto.imagen,
          categoria_id: producto.categoria_id,
          categoria_nombre: producto.categoria_nombre || "Sin categoría",
          disponible: producto.disponible,
          codigoBarras: producto.codigoBarras,
        },
      },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      },
    )
  } catch (error) {
    console.error("Error buscando producto por código de barras:", error)
    return NextResponse.json({ error: "Error al buscar producto" }, { status: 500 })
  }
}