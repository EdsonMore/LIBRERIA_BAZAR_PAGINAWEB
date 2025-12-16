"use client"

import { Suspense } from "react"
import MisComprasResenaContent from "./content"

export default function MisComprasResenaPage() {
  return (
    <Suspense fallback={<div className="container mx-auto p-4">Cargando...</div>}>
      <MisComprasResenaContent />
    </Suspense>
  )
}
