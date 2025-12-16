import type { NextRequest } from "next/server"
import { query } from "./db"
import type { Usuario, Rol } from "./types"
import bcrypt from "bcryptjs"

// Función para obtener el usuario de la sesión
export async function getUsuarioFromSession(request: NextRequest): Promise<Usuario | null> {
  try {
    const sessionCookie = request.cookies.get("session")
    if (!sessionCookie) return null

    const sessionData = JSON.parse(sessionCookie.value)
    const userId = sessionData.userId

    if (!userId) return null

    // QUERY 1: Obtener usuario sin roles
    const usuariosResult = await query<any[]>(
      `SELECT id, "user", password, correo, nombres, apellido_paterno, apellido_materno,
              direccion1, direccion2, numero, genero, dni, fecha_nacimiento, 
              fecha_registro, tipo_doc, activo
       FROM usuarios
       WHERE id = $1 AND activo = true`,
      [userId],
    )

    if (usuariosResult.length === 0) return null

    const usuarioData = usuariosResult[0] as any

    // QUERY 2: Obtener roles del usuario
    const rolesResult = await query<Rol>(
      `SELECT r.id, r.nombre
       FROM roles r
       INNER JOIN usuario_roles ur ON ur.rol_id = r.id
       WHERE ur.usuario_id = $1`,
      [userId],
    )

    // Construir objeto usuario con roles
    const usuario: Usuario = {
      id: usuarioData.id,
      user: usuarioData.user,
      password: usuarioData.password,
      correo: usuarioData.correo,
      nombres: usuarioData.nombres,
      apellidoPaterno: usuarioData.apellido_paterno,
      apellidoMaterno: usuarioData.apellido_materno,
      direccion1: usuarioData.direccion1,
      direccion2: usuarioData.direccion2,
      numero: usuarioData.numero,
      genero: usuarioData.genero,
      dni: usuarioData.dni,
      fechaNacimiento: usuarioData.fecha_nacimiento,
      fechaRegistro: usuarioData.fecha_registro,
      tipoDoc: usuarioData.tipo_doc,
      activo: usuarioData.activo,
      roles: rolesResult as unknown as Rol[],
    }

    return usuario
  } catch (error) {
    console.error("Error al obtener usuario de sesión:", error)
    return null
  }
}

export const getUserFromSession = getUsuarioFromSession

export async function getSession(request?: NextRequest): Promise<{ userId: number; roles: string[] } | null> {
  try {
    if (!request) {
      // En Server Components sin request, intentar obtener de cookies
      const { cookies } = await import("next/headers")
      const sessionCookie = (await cookies()).get("session")
      if (!sessionCookie) return null

      const sessionData = JSON.parse(sessionCookie.value)
      const userId = sessionData.userId

      if (!userId) return null

      // Obtener roles del usuario
      const roles = await query<any[]>(
        `SELECT r.nombre FROM roles r
         INNER JOIN usuario_roles ur ON ur.rol_id = r.id
         WHERE ur.usuario_id = $1`,
        [userId],
      )

      return {
        userId,
        roles: roles.map((r: any) => r.nombre),
      }
    }

    // Con request (en API routes o middleware)
    const sessionCookie = request.cookies.get("session")
    if (!sessionCookie) return null

    const sessionData = JSON.parse(sessionCookie.value)
    const userId = sessionData.userId

    if (!userId) return null

    // Obtener roles del usuario
    const roles = await query<any[]>(
      `SELECT r.nombre FROM roles r
       INNER JOIN usuario_roles ur ON ur.rol_id = r.id
       WHERE ur.usuario_id = $1`,
      [userId],
    )

    return {
      userId,
      roles: roles.map((r: any) => r.nombre),
    }
  } catch (error) {
    console.error("Error al obtener sesión:", error)
    return null
  }
}

// Función para verificar si el usuario tiene un rol específico
export function tieneRol(usuario: Usuario, nombreRol: string): boolean {
  return usuario.roles.some((rol) => rol.nombre === nombreRol)
}

// Verificaciones de roles específicos
export function esSuperAdmin(usuario: Usuario): boolean {
  return tieneRol(usuario, "ROLE_SUPER_ADMIN")
}

export function esAdmin(usuario: Usuario): boolean {
  return tieneRol(usuario, "ROLE_ADMIN")
}

export function esEncargadoProductos(usuario: Usuario): boolean {
  return tieneRol(usuario, "ROLE_ENCARGADO_PRODUCTOS")
}

export function esEncargadoVentas(usuario: Usuario): boolean {
  return tieneRol(usuario, "ROLE_ENCARGADO_VENTAS")
}

export function esCliente(usuario: Usuario): boolean {
  return tieneRol(usuario, "ROLE_CLIENTE")
}

// Función para hashear contraseñas
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

// Función para verificar contraseñas
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// Función para crear sesión
export function createSession(userId: number): string {
  return JSON.stringify({ userId, timestamp: Date.now() })
}
