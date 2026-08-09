import { NextResponse } from "next/server"
import { queryOne } from "@/lib/db"
import { normalizarCodigoBarras } from "@/lib/codigo-barras"

export async function GET(request: Request, { params }: { params: Promise<{ codigo: string }> }) {
  try {
    const { codigo } = await params
    const codigoLimpio = normalizarCodigoBarras(codigo)

    if (!codigoLimpio) {
      return NextResponse.json({ error: "Código de barras requerido" }, { status: 400 })
    }

    // Búsqueda sin filtrar por "disponible": un producto desmarcado sigue siendo
    // identificable por su código (la tienda muestra "Agotado" y ventas lo agrega igual).
    // BTRIM tolera espacios residuales al guardar el código.
    const producto = await queryOne<any>(
      `SELECT p.id, p.nombre, p.descripcion, p.precio, p.stock, p.imagen,
              p.categoria_id, p.disponible::boolean as disponible,
              p.codigo_barras as "codigoBarras",
              c.nombre as categoria_nombre
       FROM productos p
       LEFT JOIN categorias c ON p.categoria_id = c.id
       WHERE BTRIM(COALESCE(p.codigo_barras, '')) = BTRIM($1)
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