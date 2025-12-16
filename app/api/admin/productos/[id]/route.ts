import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUserFromSession } from "@/lib/auth"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getUserFromSession(req)
    if (!user || !user.roles?.some((r: any) => ["ROLE_ADMIN", "ROLE_SUPER_ADMIN"].includes(r.nombre))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    // Validar el tamaño de la solicitud antes de procesar
    const contentLength = req.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "Payload demasiado grande. Máximo 50MB" }, { status: 413 })
    }

    const body = await req.json()
    const { nombre, descripcion, precio, stock, categoria_id, imagen, disponible } = body

    // Validar que la imagen no sea demasiado larga
    if (imagen && imagen.length > 2000) {
      return NextResponse.json(
        { error: "URL de imagen demasiado larga. Máximo 2000 caracteres" },
        { status: 400 },
      )
    }

    await query(
      `UPDATE productos 
       SET nombre = $1, descripcion = $2, precio = $3, stock = $4, categoria_id = $5, imagen = $6, disponible = $7
       WHERE id = $8`,
      [nombre, descripcion, precio, stock, categoria_id, imagen || null, disponible ? true : false, id],
    )

    return NextResponse.json({ message: "Producto actualizado exitosamente" })
  } catch (error) {
    console.error("Error:", error)
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "JSON inválido en la solicitud" }, { status: 400 })
    }
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getUserFromSession(req)
    if (!user || !user.roles?.some((r: any) => ["ROLE_ADMIN", "ROLE_SUPER_ADMIN"].includes(r.nombre))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    // Verificar si hay compras con este producto
    const compras = await query(`SELECT COUNT(*) as count FROM detalles_compra WHERE producto_id = $1`, [id])

    if (compras[0].count > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar un producto que tiene compras asociadas" },
        { status: 400 },
      )
    }

    await query(`DELETE FROM productos WHERE id = $1`, [id])

    return NextResponse.json({ message: "Producto eliminado exitosamente" })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}
