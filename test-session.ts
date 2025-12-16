import { query } from "./lib/db"

async function testSession() {
  try {
    // Simular obtener el usuario ID del cookie (superadmin es ID 1)
    const userId = 1

    // Obtener roles del usuario
    const roles = await query<any[]>(
      `SELECT r.nombre FROM roles r
       INNER JOIN usuario_roles ur ON ur.rol_id = r.id
       WHERE ur.usuario_id = $1`,
      [userId],
    )

    console.log("Roles obtenidos:", roles)
    console.log("Nombres de roles:", roles.map((r: any) => r.nombre))
    console.log("Incluye ROLE_SUPER_ADMIN:", roles.map((r: any) => r.nombre).includes("ROLE_SUPER_ADMIN"))
  } catch (error) {
    console.error("Error:", error)
  }
}

testSession()
