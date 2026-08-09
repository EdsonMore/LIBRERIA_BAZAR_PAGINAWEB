"use client"

import { useEffect, useId, useRef, useState } from "react"
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

const FORMATOS_1D = [
  "ean_13",
  "ean_8",
  "upc_a",
  "upc_e",
  "code_128",
  "code_39",
  "code_93",
  "itf",
] as const

const FORMATOS_HTML5QR = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.ITF,
]

function soportaBarcodeDetector(): boolean {
  if (typeof window === "undefined") return false
  return "BarcodeDetector" in window
}

export function EscanerCodigo({
  open,
  onOpenChange,
  onCodigoLeido,
  titulo = "Escanear código de barras",
}: EscanerCodigoProps) {
  const [scanning, setScanning] = useState(false)
  const [iniciando, setIniciando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [manual, setManual] = useState(false)
  const [codigoManual, setCodigoManual] = useState("")
  const [usandoNativo, setUsandoNativo] = useState(false)

  const elementId = useId().replace(/:/g, "")
  const elementIdFinal = `lector-codigo-${elementId}`

  const scannerRef = useRef<Html5Qrcode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const detectorRef = useRef<any>(null)
  const rafRef = useRef<number | null>(null)
  const lastScan = useRef(0)
  const detenerRef = useRef(false)

  // Buffer para lectores USB (escriben dígitos como teclado rápido)
  const buffer = useRef("")
  const bufferTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const limpiarBuffer = () => {
    buffer.current = ""
    if (bufferTimer.current) {
      clearTimeout(bufferTimer.current)
      bufferTimer.current = null
    }
  }

  // Capturar lecturas de escáner físico USB (funciona en modo cámara sin input enfocado).
  useEffect(() => {
    if (!open || manual) return
    const handle = (e: KeyboardEvent) => {
      const activo = document.activeElement as HTMLElement | null
      if (activo && (activo.tagName === "INPUT" || activo.tagName === "TEXTAREA" || activo.tagName === "SELECT")) {
        return
      }
      if (e.key === "Enter") {
        const codigo = buffer.current.trim()
        if (codigo) {
          limpiarBuffer()
          const now = Date.now()
          if (now - lastScan.current >= 800) {
            lastScan.current = now
            onCodigoLeido(codigo)
          }
        }
        return
      }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        buffer.current += e.key
        if (bufferTimer.current) clearTimeout(bufferTimer.current)
        bufferTimer.current = setTimeout(() => limpiarBuffer(), 150)
      }
    }
    window.addEventListener("keydown", handle)
    return () => {
      window.removeEventListener("keydown", handle)
      limpiarBuffer()
    }
  }, [open, manual, onCodigoLeido])

  const detenerCamara = async () => {
    detenerRef.current = true
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) await scannerRef.current.stop()
        scannerRef.current.clear?.()
      } catch (err) {
        // ignorar
      }
      scannerRef.current = null
    }
    setScanning(false)
    setIniciando(false)
  }

  // Detener cámara al desmontar el componente (evita cámara encendida en segundo plano)
  useEffect(() => {
    return () => {
      void detenerCamara()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const leerExitoso = (codigo: string) => {
    const ahora = Date.now()
    if (ahora - lastScan.current < 800) return
    lastScan.current = ahora
    void detenerCamara()
    onCodigoLeido(codigo.trim())
  }

  const iniciarNativo = async () => {
    setUsandoNativo(true)
    try {
      detectorRef.current = new (window as any).BarcodeDetector({
        formats: FORMATOS_1D,
      })

      const conseguirStream = async (facingMode: string) => {
        return navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        })
      }

      let stream: MediaStream
      try {
        stream = await conseguirStream("environment")
      } catch (err) {
        stream = await conseguirStream("user")
      }

      if (detenerRef.current) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }

      streamRef.current = stream
      if (!videoRef.current) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }

      videoRef.current.srcObject = stream
      await videoRef.current.play()

      if (detenerRef.current) return

      const loop = () => {
        if (detenerRef.current) return
        const video = videoRef.current
        const detector = detectorRef.current
        if (!video || !detector || video.readyState < 2) {
          rafRef.current = requestAnimationFrame(loop)
          return
        }
        detector
          .detect(video)
          .then((codes: any[]) => {
            if (codes && codes.length > 0 && codes[0]?.rawValue) {
              leerExitoso(String(codes[0].rawValue))
            } else {
              rafRef.current = requestAnimationFrame(loop)
            }
          })
          .catch(() => {
            rafRef.current = requestAnimationFrame(loop)
          })
      }

      rafRef.current = requestAnimationFrame(loop)
      setScanning(true)
      setError(null)
    } catch (err: any) {
      // Si el BarcodeDetector falla al arrancar, cae al método html5-qrcode
      setUsandoNativo(false)
      throw err
    }
  }

  const iniciarHtml5Qrcode = async () => {
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode(elementIdFinal, {
        verbose: false,
        formatsToSupport: FORMATOS_HTML5QR,
        experimentalFeatures: {
          // Usa la API nativa BarcodeDetector si el navegador la soporta (más rápido y preciso)
          useBarCodeDetectorIfSupported: true,
        },
      })
    }

    const intentarConFacing = async (facingMode: string) => {
      await scannerRef.current!.start(
        { facingMode },
        {
          fps: 30,
          qrbox: (viewportWidth: number, viewportHeight: number) => {
            const ancho = Math.min(320, Math.floor(viewportWidth * 0.9))
            const alto = Math.min(140, Math.floor(ancho * 0.45))
            return { width: ancho, height: alto }
          },
          disableFlip: false,
        },
        (text) => leerExitoso(text),
        () => {},
      )
    }

    try {
      await intentarConFacing("environment")
    } catch (err) {
      await intentarConFacing("user")
    }
    setScanning(true)
  }

  const iniciarCamara = async () => {
    setError(null)
    setIniciando(true)
    detenerRef.current = false
    try {
      if (soportaBarcodeDetector()) {
        try {
          await iniciarNativo()
          setIniciando(false)
          return
        } catch (err) {
          // continúa con html5-qrcode
        }
      }
      // Asegurar que el div de html5-qrcode esté montado antes de arrancar
      setUsandoNativo(false)
      await new Promise((resolve) => setTimeout(resolve, 0))
      await iniciarHtml5Qrcode()
      setIniciando(false)
    } catch (err) {
      setIniciando(false)
      setScanning(false)
      setError("No se pudo acceder a la cámara. Usa la entrada manual o un lector USB.")
    }
  }

  // Arrancar la cámara automáticamente al abrir el diálogo (evita la pantalla negra inicial)
  useEffect(() => {
    if (!open) {
      void detenerCamara()
      return
    }
    const timer = setTimeout(() => {
      if (!manual) void iniciarCamara()
    }, 250)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleCerrar = () => {
    detenerRef.current = true
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
              <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => { setManual(true); void detenerCamara() }}>
                  <Keyboard className="w-4 h-4 mr-1" /> Ingresar código
                </Button>
                <Button type="button" size="sm" onClick={iniciarCamara} disabled={scanning || iniciando}>
                  <ScanLine className="w-4 h-4 mr-1" />
                  {iniciando ? "Iniciando..." : scanning ? "Escaneando..." : "Escanear"}
                </Button>
              </div>

              {usandoNativo ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full overflow-hidden rounded-lg border bg-black aspect-video object-cover"
                  style={{ minHeight: 180 }}
                />
              ) : (
                <div
                  id={elementIdFinal}
                  className="w-full overflow-hidden rounded-lg border bg-black aspect-video"
                  style={{ minHeight: 180 }}
                />
              )}

              {error && <p className="text-sm text-red-500">{error}</p>}
              {!error && !scanning && !iniciando && (
                <p className="text-xs text-gray-500 text-center">
                  La cámara se inicia sola. También puedes usar un lector de código de barras USB.
                </p>
              )}
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
