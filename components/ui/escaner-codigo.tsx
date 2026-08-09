"use client"

import { useEffect, useRef, useState } from "react"
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScanLine, X, Keyboard } from "lucide-react"

interface EscanerCodigoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCodigoLeido: (codigo: string) => void
  titulo?: string
}

const ELEMENT_ID = "lector-codigo-barras"

export function EscanerCodigo({
  open,
  onOpenChange,
  onCodigoLeido,
  titulo = "Escanear código de barras",
}: EscanerCodigoProps) {
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [manual, setManual] = useState(false)
  const [codigoManual, setCodigoManual] = useState("")
  const [buffer, setBuffer] = useState("")
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const bufferTimer = useRef<NodeJS.Timeout | null>(null)
  const lastScan = useRef(0)

  // Capturar lecturas de escáner físico USB (escriben dígitos como teclado rápido)
  useEffect(() => {
    if (!open || !manual) return
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        const codigo = buffer.trim()
        if (codigo) {
          limpiarBuffer()
          onCodigoLeido(codigo)
        }
        return
      }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setBuffer((prev) => prev + e.key)
        if (bufferTimer.current) clearTimeout(bufferTimer.current)
        bufferTimer.current = setTimeout(() => limpiarBuffer(), 100)
      }
    }
    window.addEventListener("keydown", handle)
    return () => {
      window.removeEventListener("keydown", handle)
      if (bufferTimer.current) clearTimeout(bufferTimer.current)
    }
  }, [open, manual, buffer])

  const limpiarBuffer = () => {
    setBuffer("")
    if (bufferTimer.current) clearTimeout(bufferTimer.current)
  }

  const iniciarCamara = async () => {
    setError(null)
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode(ELEMENT_ID, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODE_93,
          Html5QrcodeSupportedFormats.ITF,
        ],
      })
    }

    try {
      await scannerRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 260, height: 120 } },
        (text) => {
          // Evitar lecturas duplicadas espurias.
          const now = Date.now()
          if (now - lastScan.current < 1500) return
          lastScan.current = now
          setScanning(false)
          void detenerCamara()
          onCodigoLeido(text.trim())
        },
        () => {},
      )
      setScanning(true)
    } catch (err) {
      setError("No se pudo acceder a la cámara. Usa la entrada manual o un lector físico.")
      setScanning(false)
    }
  }

  const detenerCamara = async () => {
    try {
      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.stop()
        scannerRef.current.clear?.()
      }
    } catch (err) {
      // ignorar
    }
    setScanning(false)
  }

  const handleCerrar = () => {
    void detenerCamara()
    setManual(false)
    setCodigoManual("")
    setError(null)
    limpiarBuffer()
    onOpenChange(false)
  }

  const confirmarManual = () => {
    const codigo = codigoManual.trim()
    if (!codigo) {
      setError("Ingresa el código")
      return
    }
    setCodigoManual("")
    setManual(false)
    void detenerCamara()
    onCodigoLeido(codigo)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? handleCerrar() : onOpenChange(true))}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>Escanea el código de barras con la cámara o ingrésalo manualmente.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!manual ? (
            <>
              <div className="flex justify-between">
                <Button type="button" variant="outline" size="sm" onClick={() => { setManual(true); void detenerCamara() }}>
                  <Keyboard className="w-4 h-4 mr-1" /> Ingresar código
                </Button>
                <Button type="button" size="sm" onClick={iniciarCamara} disabled={scanning}>
                  <ScanLine className="w-4 h-4 mr-1" /> {scanning ? "Escaneando..." : "Escanear"}
                </Button>
              </div>

              <div
                id={ELEMENT_ID}
                className="w-full overflow-hidden rounded-lg border bg-black"
                style={{ minHeight: 200 }}
              />

              {error && <p className="text-sm text-red-500">{error}</p>}
            </>
          ) : (
            <div className="space-y-3">
              <Label htmlFor="codigo-manual">Código de barras</Label>
              <Input
                id="codigo-manual"
                placeholder="Ej: 7754001234567"
                value={codigoManual}
                onChange={(e) => setCodigoManual(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && confirmarManual()}
                autoFocus
              />
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setManual(false)}>
                  <ScanLine className="w-4 h-4 mr-1" /> Cámara
                </Button>
                <Button type="button" onClick={confirmarManual}>
                  Buscar
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={handleCerrar}>
            <X className="w-4 h-4 mr-1" /> Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}