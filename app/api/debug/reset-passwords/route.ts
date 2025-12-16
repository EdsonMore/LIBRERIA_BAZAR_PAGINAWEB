import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { hashPassword } from "@/lib/auth"

/**
 * ENDPOINT TEMPORAL PARA RESETEAR CONTRASEÑAS
 * Accede a: http://localhost:3000/api/debug/reset-passwords
 */
export async function GET() {
  try {
    // Generar hashes válidos
    const hashAdmin123 = await hashPassword("admin123")
    const hashCliente123 = await hashPassword("cliente123")

    console.log("Hashes generados:")
    console.log("admin123 ->", hashAdmin123)
    console.log("cliente123 ->", hashCliente123)

    // Actualizar todos los usuarios con admin123
    await query(
      `UPDATE usuarios SET password = $1 WHERE "user" IN ('superadmin', 'admin', 'productos', 'ventas')`,
      [hashAdmin123],
    )

    // Actualizar usuario cliente con cliente123
    await query(`UPDATE usuarios SET password = $1 WHERE "user" = 'cliente'`, [hashCliente123])

    return NextResponse.json({
      success: true,
      message: "Contraseñas actualizadas exitosamente",
      hashes: {
        admin123: hashAdmin123,
        cliente123: hashCliente123,
      },
    })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Error al resetear contraseñas" }, { status: 500 })
  }
}
