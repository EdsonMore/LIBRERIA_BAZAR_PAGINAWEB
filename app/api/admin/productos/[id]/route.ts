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
    console.log("👤 Usuario autenticado:", (user as any)?.email, "Roles:", user?.roles?.map((r: any) => r.nombre))
    if (!user || !user.roles?.some((r: any) => ["ROLE_ADMIN", "ROLE_SUPER_ADMIN"].includes(r.nombre))) {
      console.error("❌ Usuario NO AUTORIZADO o sin roles")
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }
    console.log("✅ Usuario autorizado para editar")

    let body
    try {
      body = await req.json()
    } catch (parseError) {
      return NextResponse.json({ error: "JSON inválido en la solicitud" }, { status: 400 })
    }

    const { nombre, descripcion, precio, stock, categoria_id, disponible } = body

    console.log("📝 Datos recibidos:", { nombre, descripcion, precio, stock, categoria_id, disponible })

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

    // Redondear precio a 2 decimales
    const precioDosDecimales = Math.round(precioNum * 100) / 100

    // Convertir disponible a booleano explícitamente para PostgreSQL
    const disponibleBool = disponible === true || disponible === 1 || disponible === "true" || disponible === "1"
    const productoId = Number(id)

    // NOTA: La imagen se actualiza solo a través de /api/admin/productos/[id]/imagen
    
    const result = await query(
      `UPDATE productos 
       SET nombre = $1, descripcion = $2, precio = $3, stock = $4, categoria_id = $5, disponible = $6::boolean
       WHERE id = $7`,
      [nombre.trim(), descripcion.trim(), precioDosDecimales, stockNum, categoriaNum, disponibleBool, productoId],
    )

    if (!result || (result.rowCount !== undefined && result.rowCount === 0)) {
      return NextResponse.json({ error: "Producto no encontrado o error en actualización", debug: { id: productoId, rowCount: result?.rowCount } }, { status: 400 })
    }

    // Esperar 200ms para garantizar que la transacción se haya persistido completamente en la BD
    // Especialmente importante en Vercel donde las conexiones pueden reciclarse rápidamente
    await new Promise(resolve => setTimeout(resolve, 200))

    return NextResponse.json({ message: "Producto actualizado exitosamente", id })
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
