/**
 * Obtiene la URL base de la aplicación
 * En Vercel: usa VERCEL_URL automáticamente
 * En desarrollo: usa http://localhost:3000
 */
export function getBaseUrl(): string {
  // En Vercel, VERCEL_URL contiene el dominio (sin https://)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  
  // En desarrollo local
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }
  
  // Fallback a localhost en desarrollo
  return "http://localhost:3000"
}

/**
 * Construye una URL de API completa
 * @param path - Ruta de la API (ej: /api/productos/1)
 * @returns URL completa para fetch
 */
export function getApiUrl(path: string): string {
  const baseUrl = getBaseUrl()
  // Asegurar que el path comience con /
  const cleanPath = path.startsWith("/") ? path : `/${path}`
  return `${baseUrl}${cleanPath}`
}
