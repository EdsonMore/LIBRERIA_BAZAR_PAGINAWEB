import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

/**
 * DELETE /api/cotizaciones/[id]/delete
 * Eliminar una cotización
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cotizacionId = params.id

    if (!cotizacionId) {
      return NextResponse.json(
        { error: "ID de cotización requerido" },
        { status: 400 }
      )
    }

    // Verificar que la cotización existe
    const cotizacion = await query(
      `SELECT id, usuario_id FROM cotizacion_listas WHERE id = ?`,
      [Number(cotizacionId)]
    )

    if (!cotizacion.length) {
      return NextResponse.json(
        { error: "Cotización no encontrada" },
        { status: 404 }
      )
    }

    // Eliminar la cotización
    const result = await query(
      `DELETE FROM cotizacion_listas WHERE id = ?`,
      [Number(cotizacionId)]
    )

    return NextResponse.json({
      success: true,
      message: "Cotización eliminada correctamente"
    })
  } catch (error: any) {
    console.error("Error eliminando cotización:", error)
    return NextResponse.json(
      { error: error.message || "Error al eliminar la cotización" },
      { status: 500 }
    )
  }
}
