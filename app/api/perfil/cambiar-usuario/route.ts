import { NextResponse, type NextRequest } from "next/server"
import { query } from "@/lib/db"
import { getUsuarioFromSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const usuario = await getUsuarioFromSession(request)

    if (!usuario) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const { newUser } = body

    if (!newUser || newUser.trim() === "") {
      return NextResponse.json({ error: "El nuevo usuario es requerido" }, { status: 400 })
    }

    if (newUser === usuario.user) {
      return NextResponse.json({ error: "El nuevo usuario debe ser diferente al actual" }, { status: 400 })
    }

    // Verificar si el usuario existe
    const existingUser = await query<any[]>("SELECT id FROM usuarios WHERE \"user\" = ?", [newUser])

    if (existingUser.length > 0) {
      return NextResponse.json({ error: "Este usuario ya está registrado" }, { status: 400 })
    }

    // Verificar si ha pasado 30 días desde el último cambio
    const lastChangeResult = await query<any[]>(
      "SELECT ultima_fecha_cambio_user FROM usuarios WHERE id = ?",
      [usuario.id]
    )

    if (lastChangeResult && lastChangeResult.length > 0 && lastChangeResult[0]) {
      const lastChangeDate = (lastChangeResult[0] as any).ultima_fecha_cambio_user
      
      if (lastChangeDate) {
        const lastChange = new Date(lastChangeDate)
        const now = new Date()
        const daysSinceChange = Math.floor((now.getTime() - lastChange.getTime()) / (1000 * 60 * 60 * 24))

        if (daysSinceChange < 30) {
          const daysRemaining = 30 - daysSinceChange
          return NextResponse.json(
            {
              error: `Solo puedes cambiar tu usuario cada 30 días. Intenta en ${daysRemaining} día(s)`,
              daysRemaining,
            },
            { status: 400 }
          )
        }
      }
    }

    // Actualizar el usuario
    await query(
      "UPDATE usuarios SET \"user\" = ?, ultima_fecha_cambio_user = NOW() WHERE id = ?",
      [newUser, usuario.id]
    )

    console.log(`✅ Usuario ${usuario.user} cambió a ${newUser}`)

    return NextResponse.json(
      {
        success: true,
        message: "Usuario actualizado exitosamente",
        newUser: newUser,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error al cambiar usuario:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
