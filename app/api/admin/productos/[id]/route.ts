import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUserFromSession } from "@/lib/auth"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    // Validar ID
    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ error: "ID de producto inválido" }, { status: 400 })
    }

    const user = await getUserFromSession(req)
    if (!user || !user.roles?.some((r: any) => ["ROLE_ADMIN", "ROLE_SUPER_ADMIN"].includes(r.nombre))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    let body
    try {
      body = await req.json()
    } catch (parseError) {
      return NextResponse.json({ error: "JSON inválido en la solicitud" }, { status: 400 })
    }

    const { nombre, descripcion, precio, stock, categoria_id, imagen, disponible } = body

    // Validar campos obligatorios
    if (!nombre?.trim() || !descripcion?.trim()) {
      return NextResponse.json({ error: "Nombre y descripción son obligatorios" }, { status: 400 })
    }

    // Validar precio
    const precioNum = parseFloat(precio)
    if (isNaN(precioNum) || precioNum < 0) {
      return NextResponse.json({ error: "Precio inválido" }, { status: 400 })
    }

    // Validar stock
    const stockNum = parseInt(stock)
    if (isNaN(stockNum) || stockNum < 0) {
      return NextResponse.json({ error: "Stock inválido" }, { status: 400 })
    }

    // Validar categoría
    const categoriaNum = parseInt(categoria_id)
    if (isNaN(categoriaNum)) {
      return NextResponse.json({ error: "Categoría inválida" }, { status: 400 })
    }

    // Validar que la imagen no sea demasiado larga (MAX 1500 caracteres)
    const imagenUrl = imagen?.trim() || null
    if (imagenUrl && imagenUrl.length > 1500) {
      return NextResponse.json(
        { error: `URL de imagen demasiado larga (${imagenUrl.length} caracteres). Máximo 1500 caracteres.` },
        { status: 400 },
      )
    }

    // Redondear precio a 2 decimales
    const precioDosDecimales = Math.round(precioNum * 100) / 100

    await query(
      `UPDATE productos 
       SET nombre = $1, descripcion = $2, precio = $3, stock = $4, categoria_id = $5, imagen = $6, disponible = $7
       WHERE id = $8`,
      [nombre.trim(), descripcion.trim(), precioDosDecimales, stockNum, categoriaNum, imagenUrl, disponible ? true : false, id],
    )

    return NextResponse.json({ message: "Producto actualizado exitosamente" })
  } catch (error) {
    console.error("Error en PUT /api/admin/productos/[id]:", error)
    return NextResponse.json({ error: "Error del servidor. Inténtalo de nuevo." }, { status: 500 })
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
