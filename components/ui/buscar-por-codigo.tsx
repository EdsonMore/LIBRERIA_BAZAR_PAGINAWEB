"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ScanLine } from "lucide-react"
import { EscanerCodigo } from "@/components/ui/escaner-codigo"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface BuscarPorCodigoProps {
  /** Si es true, se muestra como botón (navbar/tienda). Si es false, solo el diálogo interno. */
  asButton?: boolean
  onOpen?: () => void
}

export function BuscarPorCodigo({ asButton = true }: BuscarPorCodigoProps) {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [buscando, setBuscando] = useState(false)
  const [noEncontrado, setNoEncontrado] = useState<string | null>(null)

  const manejarCodigo = async (codigo: string) => {
    const limpio = codigo.trim()
    if (!limpio) return

    setBuscando(true)
    setNoEncontrado(null)
    try {
      const res = await fetch(`/api/productos/codigo/${encodeURIComponent(limpio)}`, {
        headers: { "Cache-Control": "no-cache" },
      })
      const data = await res.json()

      if (data?.producto?.id) {
        // Cerrar y navegar al detalle del producto
        setAbierto(false)
        router.push(`/producto/${data.producto.id}`)
      } else {
        setNoEncontrado(limpio)
      }
    } catch (err) {
      setNoEncontrado(limpio)
    } finally {
      setBuscando(false)
    }
  }

  const cerrar = () => {
    setAbierto(false)
    setNoEncontrado(null)
  }

  return (
    <>
      {asButton && (
        <button
          onClick={() => {
            setNoEncontrado(null)
            setAbierto(true)
          }}
          title="Buscar por código de barras"
          aria-label="Buscar por código de barras"
          className="flex items-center gap-1.5 rounded-md border border-[#C8D800] px-2.5 py-1.5 text-[#2B2E4A] text-xs font-medium transition-colors hover:bg-[#C8D800] hover:text-white"
        >
          <ScanLine className="w-4 h-4" />
          <span className="hidden sm:inline">Buscar código</span>
        </button>
      )}

      <EscanerCodigo
        open={abierto}
        onOpenChange={(o) => (!o ? cerrar() : setAbierto(true))}
        onCodigoLeido={manejarCodigo}
        titulo="Buscar producto por código de barras"
      />

      {/* Diálogo de "no encontrado" */}
      <Dialog open={!!noEncontrado} onOpenChange={(o) => !o && setNoEncontrado(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Producto no encontrado</DialogTitle>
            <DialogDescription>
              No se encontró ningún producto con el código{" "}
              <span className="font-semibold">{noEncontrado || "---"}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            {buscando && <p className="text-sm text-gray-500">Buscando...</p>}
            <Button type="button" onClick={() => { setNoEncontrado(null); setAbierto(true) }}>
              <ScanLine className="w-4 h-4 mr-1" /> Escanear otro
            </Button>
            <Button type="button" variant="ghost" onClick={() => setNoEncontrado(null)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}