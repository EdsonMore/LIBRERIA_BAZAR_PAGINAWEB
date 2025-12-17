"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Camera, Upload, X, Link, RotateCw } from "lucide-react"
import { useImageCompression } from "@/hooks/use-image-compression"

interface Categoria {
  id: number
  nombre: string
}

export default function CrearProductoPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const { compressImage, compressImageFile } = useImageCompression()
  
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [cameraFacing, setCameraFacing] = useState<"user" | "environment">("user") // "user" = frontal, "environment" = trasera
  const [imagenPreview, setImagenPreview] = useState<string>("")
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
    stock: "",
    categoria_id: "",
    imagen: "",
    disponible: true,
  })

  useEffect(() => {
    cargarCategorias()
  }, [])

  useEffect(() => {
    if (showCamera) {
      iniciarCamara()
    } else {
      detenerCamara()
    }
  }, [showCamera])

  // ← LIMPIAR CÁMARA AL DESMONTAR COMPONENTE
  useEffect(() => {
    return () => {
      detenerCamara()
    }
  }, [])

  const cargarCategorias = async () => {
    try {
      const res = await fetch("/api/categorias/activas")
      if (res.ok) {
        const data = await res.json()
        setCategorias(data)
      }
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const iniciarCamara = async () => {
    try {
      if (!navigator.mediaDevices) {
        alert("Tu navegador no soporta cámara. Intenta con Chrome, Firefox o Edge")
        setShowCamera(false)
        return
      }

      let stream: MediaStream
      
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: cameraFacing, // ← USAR CAMERAFACE STATE
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        })
      } catch (err) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: cameraFacing, // ← USAR CAMERAFACE STATE
          },
          audio: false,
        })
      }

      streamRef.current = stream;

      if (!videoRef.current) {
        stream.getTracks().forEach(track => track.stop())
        setShowCamera(false)
        return
      }

      videoRef.current.srcObject = stream
      
      await new Promise<void>((resolve) => {
        if (videoRef.current!.readyState >= 2) {
          resolve()
        } else {
          videoRef.current!.onloadedmetadata = () => {
            resolve()
          }
          
          setTimeout(() => {
            resolve()
          }, 5000)
        }
      })

      await videoRef.current.play()
      
    } catch (error: any) {
      let mensaje = ""
      
      if (error.name === "NotFoundError") {
        mensaje = "No se encontró una cámara en este dispositivo"
      } else if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        mensaje = "Por favor, permite el acceso a la cámara\n\nHaz clic en el icono de cámara en la barra de dirección y selecciona 'Permitir'"
      } else if (error.name === "NotReadableError") {
        mensaje = "La cámara está siendo usada por otra aplicación\n\nCierra: Zoom, Meet, WhatsApp, etc."
      } else if (error.name === "AbortError") {
        mensaje = "Se canceló el acceso a la cámara"
      } else {
        mensaje = `Error: ${error.message || "No se puede acceder a la cámara"}`
      }
      
      alert("❌ " + mensaje)
      setShowCamera(false)
    }
  }

  const detenerCamara = () => {
    try {
      if (streamRef.current) {
        const tracks = streamRef.current.getTracks();
        tracks.forEach((track) => {
          track.enabled = false;
          track.stop();
        });
        streamRef.current = null;
      }
      
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      }
    } catch (error) {
      console.error("Error deteniendo cámara:", error);
    }
  }

  const tomarFoto = async () => {
    if (videoRef.current && canvasRef.current) {
      try {
        const video = videoRef.current
        const canvas = canvasRef.current
        
        // Configurar el canvas con el tamaño del video
        canvas.width = video.videoWidth || 640
        canvas.height = video.videoHeight || 480
        
        const context = canvas.getContext("2d", { willReadFrequently: true })
        if (context) {
          // Dibujar la imagen del video en el canvas
          context.drawImage(video, 0, 0, canvas.width, canvas.height)
          
          // Convertir a blob (no base64) para subir
          canvas.toBlob(async (blob) => {
            if (!blob) return
            
            try {
              setLoading(true)
              
              // Crear FormData con el blob
              const formDataUpload = new FormData()
              formDataUpload.append('file', blob, 'camera-capture.jpg')

              // Subir al servidor
              const res = await fetch('/api/admin/productos/upload', {
                method: 'POST',
                body: formDataUpload,
              })

              if (res.ok) {
                const data = await res.json()
                setImagenPreview(data.url)
                setFormData({ ...formData, imagen: data.url })
                setShowCamera(false)
              } else {
                const error = await res.json()
                alert(error.error || 'Error al subir la foto')
              }
            } catch (error) {
              console.error("Error al subir foto:", error)
              alert("Error al subir la foto")
            } finally {
              setLoading(false)
            }
          }, 'image/jpeg', 0.85)
        }
      } catch (error) {
        console.error("Error al tomar foto:", error)
        alert("Error al tomar la foto. Intenta de nuevo")
      }
    }
  }

  const manejarSubidaArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        setLoading(true)
        
        // Crear FormData con el archivo
        const formDataUpload = new FormData()
        formDataUpload.append('file', file)

        // Subir al servidor
        const res = await fetch('/api/admin/productos/upload', {
          method: 'POST',
          body: formDataUpload,
        })

        if (res.ok) {
          const data = await res.json()
          setImagenPreview(data.url)
          setFormData({ ...formData, imagen: data.url })
        } else {
          const error = await res.json()
          alert(error.error || 'Error al subir la imagen')
        }
      } catch (error) {
        console.error("Error al procesar imagen:", error)
        alert("Error al procesar la imagen")
      } finally {
        setLoading(false)
      }
    }
  }

  const manejarURLImagen = (url: string) => {
    setFormData({ ...formData, imagen: url })
    setImagenPreview(url)
  }

  const limpiarImagen = () => {
    setImagenPreview("")
    setFormData({ ...formData, imagen: "" })
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    detenerCamara()
    setShowCamera(false)
    
    await new Promise(resolve => setTimeout(resolve, 50))

    try {
      const res = await fetch("/api/admin/productos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          precio: Number.parseFloat(formData.precio),
          stock: Number.parseInt(formData.stock),
          categoria_id: Number.parseInt(formData.categoria_id),
        }),
      })

      if (res.ok) {
        router.push("/superadmin/productos")
      } else {
        const error = await res.json()
        alert(error.error || "Error al crear producto")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al crear producto")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Crear Nuevo Producto</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Producto</label>
          <input
            type="text"
            required
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          <textarea
            required
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Precio (S/)</label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.precio}
              onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
            <input
              type="number"
              required
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
          <select
            required
            value={formData.categoria_id}
            onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecciona una categoría</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Imagen del Producto</label>

          {imagenPreview && (
            <div className="mb-4 relative">
              <img src={imagenPreview} alt="Preview" className="w-full max-h-64 object-cover rounded-md" />
              <button
                type="button"
                onClick={limpiarImagen}
                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 mb-4">
            <button
              type="button"
              onClick={() => {
                if (showCamera) {
                  detenerCamara()
                }
                setShowCamera(!showCamera)
              }}
              className="flex items-center justify-center gap-2 bg-green-600 text-white py-2 px-3 rounded-md hover:bg-green-700 text-sm"
            >
              <Camera className="w-4 h-4" />
              Cámara
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-3 rounded-md hover:bg-blue-700 text-sm"
            >
              <Upload className="w-4 h-4" />
              Subir
            </button>
            <button
              type="button"
              onClick={() => {
                if (showCamera) {
                  detenerCamara()
                  setShowCamera(false)
                }
                document.getElementById("urlImageInput")?.focus()
              }}
              className="flex items-center justify-center gap-2 bg-purple-600 text-white py-2 px-3 rounded-md hover:bg-purple-700 text-sm"
            >
              <Link className="w-4 h-4" />
              URL
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={manejarSubidaArchivo}
              className="hidden"
            />
          </div>

          {showCamera && (
            <div className="mb-4 border-2 border-gray-300 rounded-md overflow-hidden bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                controls={false}
                style={{ width: "100%", height: "100%", display: "block", maxHeight: "500px" }}
                className="aspect-video object-cover bg-black"
              />
              <div className="flex gap-2 bg-gray-900 p-2">
                <button
                  type="button"
                  onClick={tomarFoto}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 font-medium"
                >
                  📸 Capturar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Cambiar entre cámara frontal y trasera
                    setCameraFacing(cameraFacing === "user" ? "environment" : "user")
                    // Reiniciar cámara con nueva orientación
                    detenerCamara()
                    setTimeout(() => iniciarCamara(), 100)
                  }}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
                >
                  <RotateCw className="w-4 h-4" />
                  Voltear
                </button>
                <button
                  type="button"
                  onClick={() => {
                    detenerCamara()
                    setShowCamera(false)
                  }}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 font-medium"
                >
                  ✕ Cerrar
                </button>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="urlImageInput" className="block text-sm font-medium text-gray-700 mb-1">O pega la URL de la imagen</label>
            <input
              id="urlImageInput"
              type="url"
              value={formData.imagen}
              onChange={(e) => manejarURLImagen(e.target.value)}
              placeholder="https://ejemplo.com/imagen.jpg"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <canvas ref={canvasRef} width={640} height={480} className="hidden" />

        <div className="flex items-center">
          <input
            type="checkbox"
            id="disponible"
            checked={formData.disponible}
            onChange={(e) => setFormData({ ...formData, disponible: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="disponible" className="ml-2 block text-sm text-gray-700">
            Producto disponible
          </label>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creando..." : "Crear Producto"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
