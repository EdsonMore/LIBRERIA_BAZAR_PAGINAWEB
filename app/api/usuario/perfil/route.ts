import { type NextRequest, NextResponse } from "next/server"
import { getUsuarioFromSession } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const usuario = await getUsuarioFromSession(req)

    if (!usuario) {
      return NextResponse.json({
        id: null,
        nombres: "",
        apellidoPaterno: "",
        apellidoMaterno: "",
        correo: "",
        numero: "",
        dni: "",
        genero: "",
        fechaNacimiento: "",
        direccion1: "",
        direccion2: "",
      })
    }

    return NextResponse.json({
      id: usuario.id,
      nombres: usuario.nombres || "",
      apellidoPaterno: usuario.apellidoPaterno || "",
      apellidoMaterno: usuario.apellidoMaterno || "",
      correo: usuario.correo || "",
      numero: usuario.numero || "",
      dni: usuario.dni || "",
      genero: usuario.genero || "",
      fechaNacimiento: usuario.fechaNacimiento || "",
      direccion1: usuario.direccion1 || "",
      direccion2: usuario.direccion2 || "",
    })
  } catch (error: any) {
    console.error("Error:", error)
    return NextResponse.json({
      id: null,
      nombres: "",
      apellidoPaterno: "",
      apellidoMaterno: "",
      correo: "",
      numero: "",
      dni: "",
      genero: "",
      fechaNacimiento: "",
      direccion1: "",
      direccion2: "",
    })
  }
}
