import { NextResponse } from "next/server"
import { getUsuarioFromSession } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const usuario = await getUsuarioFromSession(request as any)

    if (!usuario) {
      // Devolver 200 con usuario null para evitar error 401 en consola
      return NextResponse.json({
        success: true,
        usuario: null,
      })
    }

    console.log("✅ /api/auth/me - Usuario autenticado:", usuario.user)

    // Remover contraseña de la respuesta
    const { password, ...usuarioSinPassword } = usuario as any

    return NextResponse.json({
      success: true,
      usuario: usuarioSinPassword,
    })
  } catch (error) {
    console.error("Error al obtener usuario:", error)
    return NextResponse.json({
      success: true,
      usuario: null,
    })
  }
}

