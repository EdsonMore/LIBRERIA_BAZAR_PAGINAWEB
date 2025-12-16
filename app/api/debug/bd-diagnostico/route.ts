import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: Request) {
  try {
    console.log("\n🔍 DIAGNÓSTICO COMPLETO DE LA BASE DE DATOS\n")

    // 1. Verificar estructura de la tabla usuarios
    console.log("📋 TABLA: usuarios")
    const usuariosStructure = await query(
      `SELECT column_name, data_type, is_nullable
       FROM information_schema.columns
       WHERE table_name = 'usuarios'
       ORDER BY ordinal_position`
    )
    console.log("Columnas:")
    usuariosStructure?.forEach((col: any) => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
    })

    // 2. Verificar estructura de la tabla roles
    console.log("\n📋 TABLA: roles")
    const rolesStructure = await query(
      `SELECT column_name, data_type, is_nullable
       FROM information_schema.columns
       WHERE table_name = 'roles'
       ORDER BY ordinal_position`
    )
    console.log("Columnas:")
    rolesStructure?.forEach((col: any) => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
    })

    // 3. Verificar estructura de la tabla usuario_roles
    console.log("\n📋 TABLA: usuario_roles")
    const usuarioRolesStructure = await query(
      `SELECT column_name, data_type, is_nullable
       FROM information_schema.columns
       WHERE table_name = 'usuario_roles'
       ORDER BY ordinal_position`
    )
    console.log("Columnas:")
    usuarioRolesStructure?.forEach((col: any) => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
    })

    // 4. Verificar datos en tabla roles
    console.log("\n📊 DATOS: roles")
    const rolesData = await query(`SELECT * FROM roles`)
    console.log(`Total de roles: ${rolesData?.length || 0}`)
    rolesData?.forEach((rol: any) => {
      console.log(`  - ID: ${rol.id}, Nombre: ${rol.nombre}`)
    })

    // 5. Verificar datos en tabla usuarios
    console.log("\n📊 DATOS: usuarios")
    const usuariosData = await query(`SELECT id, nombres, apellido_paterno, correo FROM usuarios LIMIT 5`)
    console.log(`Total de usuarios (mostrando primeros 5):`)
    usuariosData?.forEach((u: any) => {
      console.log(`  - ID: ${u.id}, ${u.nombres} ${u.apellido_paterno}, ${u.correo}`)
    })

    // 6. Verificar datos en tabla usuario_roles
    console.log("\n📊 DATOS: usuario_roles")
    const usuarioRolesData = await query(
      `SELECT ur.usuario_id, ur.rol_id, r.nombre as rol_nombre
       FROM usuario_roles ur
       LEFT JOIN roles r ON r.id = ur.rol_id
       LIMIT 10`
    )
    console.log(`Total de asignaciones de roles (mostrando primeras 10):`)
    usuarioRolesData?.forEach((ur: any) => {
      console.log(`  - Usuario: ${ur.usuario_id}, Rol: ${ur.rol_id} (${ur.rol_nombre})`)
    })

    // 7. Hacer un test: obtener usuario completo con sus roles
    console.log("\n🧪 TEST: Obtener usuario con roles")
    const usuarioConRoles = await query(
      `SELECT 
        u.id, u.nombres, u.apellido_paterno, u.correo,
        ARRAY_AGG(r.nombre) as roles
       FROM usuarios u
       LEFT JOIN usuario_roles ur ON ur.usuario_id = u.id
       LEFT JOIN roles r ON r.id = ur.rol_id
       WHERE u.id = 1
       GROUP BY u.id, u.nombres, u.apellido_paterno, u.correo`
    )
    console.log("Resultado:")
    console.log(JSON.stringify(usuarioConRoles, null, 2))

    // 8. Contar registros en cada tabla
    console.log("\n📈 CONTEOS:")
    const usuariosCount = await query(`SELECT COUNT(*) as count FROM usuarios`)
    const rolesCount = await query(`SELECT COUNT(*) as count FROM roles`)
    const usuarioRolesCount = await query(`SELECT COUNT(*) as count FROM usuario_roles`)

    console.log(`  - Usuarios: ${usuariosCount?.[0]?.count || 0}`)
    console.log(`  - Roles: ${rolesCount?.[0]?.count || 0}`)
    console.log(`  - Asignaciones usuario_roles: ${usuarioRolesCount?.[0]?.count || 0}`)

    const diagnostico = {
      usuariosStructure,
      rolesStructure,
      usuarioRolesStructure,
      rolesData,
      usuariosData,
      usuarioRolesData,
      usuarioConRoles,
      counts: {
        usuarios: usuariosCount?.[0]?.count,
        roles: rolesCount?.[0]?.count,
        usuarioRoles: usuarioRolesCount?.[0]?.count,
      },
    }

    return NextResponse.json(diagnostico, { status: 200 })
  } catch (error: any) {
    console.error("❌ Error en diagnóstico:", error.message)
    return NextResponse.json(
      {
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    )
  }
}
