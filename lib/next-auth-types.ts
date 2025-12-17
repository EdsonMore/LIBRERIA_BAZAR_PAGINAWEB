/**
 * Tipos mock para next-auth
 * Usado cuando next-auth no está disponible en el entorno TypeScript
 */

export interface Session {
  user?: {
    id: string
    email: string
    name: string
    image: string
    rol?: string
  }
  expires: string
}

export async function getServerSession(): Promise<Session | null> {
  return null
}
