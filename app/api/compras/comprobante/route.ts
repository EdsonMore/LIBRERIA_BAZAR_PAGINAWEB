import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUserFromSession } from "@/lib/auth"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromSession(req)
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("comprobante") as File
    const compraId = formData.get("compraId") as string
    const metodoPago = formData.get("metodoPago") as string

    if (!file || !compraId) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 })
    }

    // Validar que la compra exista y pertenezca al usuario
    const compra = await query("SELECT * FROM compras WHERE id = $1 AND usuario_id = $2", [
      Number(compraId),
      user.id,
    ])

    if (compra.length === 0) {
      return NextResponse.json({ error: "Compra no encontrada" }, { status: 404 })
    }

    // Crear nombre de archivo único
    const timestamp = Date.now()
    const buffer = await file.arrayBuffer()
    const extension = file.name.split(".").pop() || "jpg"
    const fileName = `comprobante_${compraId}_${timestamp}.${extension}`

    // Guardar en directorio público
    const uploadsDir = join(process.cwd(), "public/uploads/comprobantes")
    await mkdir(uploadsDir, { recursive: true })
    const filePath = join(uploadsDir, fileName)
    await writeFile(filePath, Buffer.from(buffer))

    // Guardar en BD
    await query(
      `INSERT INTO comprobantes_pago (compra_id, usuario_id, archivo_url, metodo_pago)
       VALUES ($1, $2, $3, $4)`,
      [Number(compraId), user.id, `/uploads/comprobantes/${fileName}`, metodoPago],
    )

    return NextResponse.json({
      success: true,
      mensaje: "Comprobante guardado exitosamente",
      archivo_url: `/uploads/comprobantes/${fileName}`,
    })
  } catch (error) {
    console.error("Error al guardar comprobante:", error)
    return NextResponse.json({ error: "Error al guardar el comprobante" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromSession(req)
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const compraId = searchParams.get("compraId")

    if (!compraId) {
      return NextResponse.json({ error: "Falta compraId" }, { status: 400 })
    }

    const result = await query(
      `SELECT * FROM comprobantes_pago 
       WHERE compra_id = $1 AND (usuario_id = $2 OR $3 = ANY(
         SELECT nombre FROM roles r 
         JOIN usuario_roles ur ON r.id = ur.rol_id 
         WHERE ur.usuario_id = $2 AND r.nombre = 'ROLE_SUPER_ADMIN'
       ))`,
      [Number(compraId), user.id, "ROLE_SUPER_ADMIN"],
    )

    if (result.length === 0) {
      return NextResponse.json(null)
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error al obtener comprobante:", error)
    return NextResponse.json({ error: "Error al obtener el comprobante" }, { status: 500 })
  }
}
