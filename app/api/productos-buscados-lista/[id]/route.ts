import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

/**
 * DELETE /api/productos-buscados-lista/[id]
 * Eliminar un producto de la lista de búsquedas
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productoId = params.id

    if (!productoId) {
      return NextResponse.json(
        { error: "ID de producto requerido" },
        { status: 400 }
      )
    }

    // Eliminar el producto de la lista de buscados
    const result = await query(
      `DELETE FROM public.productos_solicitados WHERE id = ?`,
      [Number(productoId)]
    )

    return NextResponse.json({
      success: true,
      message: "Producto eliminado de la lista de compra"
    })
  } catch (error: any) {
    console.error("Error eliminando producto buscado:", error)
    return NextResponse.json(
      { error: error.message || "Error al eliminar el producto" },
      { status: 500 }
    )
  }
}
