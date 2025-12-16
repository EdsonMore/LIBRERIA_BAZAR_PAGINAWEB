import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function POST(request: Request) {
  try {
    console.log("🔄 Asignando roles a usuarios...\n")

    // Limpiar asignaciones anteriores
    try {
      await query(`DELETE FROM usuario_roles`)
      console.log("✓ Limpiadas asignaciones anteriores")
    } catch (e) {
      console.log("(No había asignaciones previas)")
    }

    // Insertar las asignaciones de roles
    const asignaciones = [
      { usuario_id: 1, rol_id: 1, rol: "ROLE_SUPER_ADMIN" },
      { usuario_id: 2, rol_id: 2, rol: "ROLE_ADMIN" },
      { usuario_id: 3, rol_id: 3, rol: "ROLE_ENCARGADO_PRODUCTOS" },
      { usuario_id: 4, rol_id: 4, rol: "ROLE_ENCARGADO_VENTAS" },
      { usuario_id: 5, rol_id: 5, rol: "ROLE_CLIENTE" },
    ]

    for (const asignacion of asignaciones) {
      try {
        await query(
          `INSERT INTO usuario_roles (usuario_id, rol_id) VALUES ($1, $2)`,
          [asignacion.usuario_id, asignacion.rol_id]
        )
        console.log(`✓ Usuario ${asignacion.usuario_id} -> ${asignacion.rol}`)
      } catch (err: any) {
        console.error(`✗ Error al asignar usuario ${asignacion.usuario_id}:`, err.message)
      }
    }

    // Verificar asignaciones
    console.log("\n📊 Verificando asignaciones...")
    const usuarioRoles = await query(
      `SELECT ur.usuario_id, ur.rol_id, u.nombres, u.apellido_paterno, r.nombre as rol_nombre
       FROM usuario_roles ur
       LEFT JOIN usuarios u ON u.id = ur.usuario_id
       LEFT JOIN roles r ON r.id = ur.rol_id
       ORDER BY ur.usuario_id`
    )

    console.log("\n✅ Asignaciones actuales:")
    usuarioRoles?.forEach((ur: any) => {
      console.log(`  - Usuario ${ur.usuario_id}: ${ur.nombres} ${ur.apellido_paterno} -> ${ur.rol_nombre}`)
    })

    return NextResponse.json({
      success: true,
      message: "Roles asignados correctamente",
      count: usuarioRoles?.length || 0,
      asignaciones: usuarioRoles,
    })
  } catch (error: any) {
    console.error("❌ Error fatal:", error.message)
    console.error(error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    )
  }
}
