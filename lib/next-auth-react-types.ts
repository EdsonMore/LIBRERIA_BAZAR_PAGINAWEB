/**
 * Tipos y hooks mock para next-auth/react
 * Usado cuando next-auth no está disponible en el entorno TypeScript
 */

import { useEffect, useState } from 'react'

export interface Session {
  user?: {
    id: string | number
    email: string
    name: string
    image: string
    rol?: string
  }
  expires: string
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simular carga de sesión
    setLoading(false)
  }, [])

  return {
    data: session,
    status: loading ? 'loading' : session ? 'authenticated' : 'unauthenticated',
    loading,
  }
}

export function SessionProvider({ children }: { children: React.ReactNode }): React.ReactNode {
  return children
}
