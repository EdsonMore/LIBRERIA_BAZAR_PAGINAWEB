export function normalizarCodigoBarras(valor: string | null | undefined): string {
  return (valor || "").trim()
}

export function esCodigoBarrasValido(valor: string | null | undefined): boolean {
  const limpio = normalizarCodigoBarras(valor)
  if (!limpio) return true
  if (limpio.length > 60) return false
  return /^[A-Za-z0-9.\-]+$/.test(limpio)
}

export function errorCodigoBarras(valor: string | null | undefined): string | null {
  const limpio = normalizarCodigoBarras(valor)
  if (!limpio) return null
  if (limpio.length > 60) return "El código de barras no puede superar los 60 caracteres"
  if (!/^[A-Za-z0-9.\-]+$/.test(limpio)) {
    return "El código de barras solo puede contener letras, números, puntos y guiones"
  }
  return null
}
