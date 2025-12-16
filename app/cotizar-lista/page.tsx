"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Upload, FileText, Calendar, Check, Clock } from "lucide-react"
import Navbar from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"
import ModalAlerta from "@/components/modal-alerta"

interface Cotizacion {
  id: number
  titulo: string
  descripcion?: string
  estado: string
  fecha_creacion: string
  cantidad_items: number
  total_final?: number | string
  pdf_url?: string
}

export default function CotizarListaPage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState<any>(null)
  const [archivo, setArchivo] = useState<File | null>(null)
  const [titulo, setTitulo] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [loading, setLoading] = useState(false)
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([])
  const [tab, setTab] = useState<"crear" | "historial">("crear")
  const [modalAlerta, setModalAlerta] = useState({
    isOpen: false,
    type: "info" as "error" | "success" | "warning" | "info",
    title: "",
    message: "",
    buttons: [] as any[],
  })

  // Obtener usuario
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data?.usuario) {
          setUsuario(data.usuario)
          cargarCotizaciones(data.usuario.id)
        }
      })
      .catch(() => {
        router.push("/auth/login")
      })
  }, [])

  const cargarCotizaciones = async (userId: number) => {
    try {
      const res = await fetch(`/api/cotizaciones/listar?usuario_id=${userId}&rol=CLIENTE`)
      const data = await res.json()
      if (data.success) {
        setCotizaciones(data.cotizaciones)
      }
    } catch (error) {
      console.error("Error cargando cotizaciones:", error)
    }
  }

  const handleArchivoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const tiposPermitidos = ["application/pdf", "image/jpeg", "image/png", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
      if (!tiposPermitidos.includes(file.type)) {
        setModalAlerta({
          isOpen: true,
          type: "error",
          title: "Archivo no válido",
          message: "Solo se permiten archivos PDF, imágenes (JPG/PNG) o documentos Word.",
          buttons: [{ label: "OK", onClick: () => setModalAlerta({ ...modalAlerta, isOpen: false }) }],
        })
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        setModalAlerta({
          isOpen: true,
          type: "error",
          title: "Archivo muy grande",
          message: "El archivo no debe exceder 10 MB.",
          buttons: [{ label: "OK", onClick: () => setModalAlerta({ ...modalAlerta, isOpen: false }) }],
        })
        return
      }
      setArchivo(file)
    }
  }

  const handleEnviarLista = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!titulo.trim()) {
      setModalAlerta({
        isOpen: true,
        type: "error",
        title: "Validación",
        message: "Por favor ingresa un nombre para tu lista",
        buttons: [{ label: "OK", onClick: () => setModalAlerta({ ...modalAlerta, isOpen: false }) }],
      })
      return
    }

    if (!archivo) {
      setModalAlerta({
        isOpen: true,
        type: "error",
        title: "Archivo requerido",
        message: "Por favor selecciona un archivo (PDF, imagen o Word)",
        buttons: [{ label: "OK", onClick: () => setModalAlerta({ ...modalAlerta, isOpen: false }) }],
      })
      return
    }

    setLoading(true)

    try {
      // 1. Subir archivo
      const formData = new FormData()
      formData.append("file", archivo)
      
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
      
      const uploadData = await uploadRes.json()
      
      if (!uploadData.success) {
        throw new Error("Error al subir el archivo")
      }

      // 2. Crear cotización (sin texto extraído por ahora - se hará en backend)
      const cotizacionRes = await fetch("/api/cotizaciones/crear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuario_id: usuario.id,
          titulo,
          descripcion,
          archivo_url: uploadData.url,
          tipo_archivo: archivo.type.split("/")[1] || archivo.type,
          texto_extraido: "", // Se extraerá en el backend
        }),
      })

      const cotizacionData = await cotizacionRes.json()

      if (!cotizacionData.success) {
        throw new Error(cotizacionData.error)
      }

      setModalAlerta({
        isOpen: true,
        type: "success",
        title: "¡Éxito!",
        message: cotizacionData.message,
        buttons: [
          {
            label: "Ver mis cotizaciones",
            onClick: () => {
              setModalAlerta({ ...modalAlerta, isOpen: false })
              setTab("historial")
              cargarCotizaciones(usuario.id)
              setTitulo("")
              setDescripcion("")
              setArchivo(null)
            },
          },
        ],
      })
    } catch (error) {
      setModalAlerta({
        isOpen: true,
        type: "error",
        title: "Error",
        message: error instanceof Error ? error.message : "Error al enviar la lista",
        buttons: [{ label: "OK", onClick: () => setModalAlerta({ ...modalAlerta, isOpen: false }) }],
      })
    } finally {
      setLoading(false)
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "PENDIENTE":
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">⏳ Pendiente</span>
      case "EN_COTIZACION":
        return <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">⚙️ En cotización</span>
      case "COTIZADO":
        return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">✅ Cotizado</span>
      case "ENVIADO":
        return <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">📤 Enviado</span>
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">{estado}</span>
    }
  }

  if (!usuario) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Cargando...</p>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          {/* Tabs */}
          <div className="mb-8 flex gap-4 border-b">
            <button
              onClick={() => setTab("crear")}
              className={`pb-4 px-4 font-semibold transition-colors ${
                tab === "crear"
                  ? "border-b-2 border-[#667eea] text-[#667eea]"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              📋 Nueva Cotización
            </button>
            <button
              onClick={() => setTab("historial")}
              className={`pb-4 px-4 font-semibold transition-colors ${
                tab === "historial"
                  ? "border-b-2 border-[#667eea] text-[#667eea]"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              📂 Mis Cotizaciones ({cotizaciones.length})
            </button>
          </div>

          {/* TAB: CREAR COTIZACIÓN */}
          {tab === "crear" && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h1 className="text-3xl font-bold mb-2 text-gray-900">Cotiza tu Lista de Útiles</h1>
                <p className="text-gray-600 mb-8">
                  Sube tu lista de útiles (PDF, imagen o Word) y te enviaremos una cotización personalizada.
                </p>

                <form onSubmit={handleEnviarLista} className="space-y-6">
                  {/* Nombre de la lista */}
                  <div>
                    <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de la Lista *
                    </label>
                    <input
                      id="titulo"
                      type="text"
                      placeholder="Ej: Útiles 5° B, Grado 3°, etc."
                      value={titulo}
                      onChange={(e) => setTitulo(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667eea]"
                    />
                  </div>

                  {/* Descripción */}
                  <div>
                    <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción (opcional)
                    </label>
                    <textarea
                      id="descripcion"
                      placeholder="Ej: Lista para el colegio X, grado 5°"
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667eea]"
                    />
                  </div>

                  {/* Subida de archivo */}
                  <div>
                    <label htmlFor="archivo" className="block text-sm font-medium text-gray-700 mb-2">
                      Archivo *
                    </label>
                    <div className="mt-2 flex justify-center px-6 py-10 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600 mb-2">
                          <label htmlFor="archivo" className="font-semibold text-[#667eea] cursor-pointer hover:underline">
                            Selecciona un archivo
                          </label>
                          {" o arrastra y suelta"}
                        </p>
                        <p className="text-xs text-gray-500">PDF, JPG, PNG o Word (máx. 10 MB)</p>
                        <input
                          id="archivo"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.docx"
                          onChange={handleArchivoChange}
                          className="hidden"
                        />
                      </div>
                    </div>
                    {archivo && (
                      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                        <Check className="w-5 h-5 text-green-600" />
                        <span className="text-sm text-green-800">
                          <strong>{archivo.name}</strong> ({(archivo.size / 1024).toFixed(2)} KB)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Botones */}
                  <div className="flex gap-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-[#667eea] text-white font-semibold py-3 rounded-lg hover:bg-[#764ba2] disabled:opacity-50 transition-colors"
                    >
                      {loading ? "Enviando..." : "Enviar para Cotización"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTitulo("")
                        setDescripcion("")
                        setArchivo(null)
                      }}
                      className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB: HISTORIAL */}
          {tab === "historial" && (
            <div>
              {cotizaciones.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-4">Aún no has enviado ninguna lista para cotizar.</p>
                  <button
                    onClick={() => setTab("crear")}
                    className="inline-block bg-[#667eea] text-white font-semibold py-2 px-6 rounded-lg hover:bg-[#764ba2]"
                  >
                    Crear primera cotización
                  </button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {cotizaciones.map((cot) => (
                    <div key={cot.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-2">{cot.titulo}</h3>
                          {cot.descripcion && <p className="text-gray-600 text-sm mb-3">{cot.descripcion}</p>}
                          <div className="flex flex-wrap gap-4 text-sm">
                            <span className="flex items-center gap-1 text-gray-600">
                              <Calendar className="w-4 h-4" />
                              {new Date(cot.fecha_creacion).toLocaleDateString("es-PE")}
                            </span>
                            <span className="flex items-center gap-1 text-gray-600">
                              <FileText className="w-4 h-4" />
                              {cot.cantidad_items} productos
                            </span>
                            {cot.total_final && (
                              <span className="font-semibold text-[#667eea]">
                                Total: S/. {(Number(cot.total_final) || 0).toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          {getEstadoBadge(cot.estado)}
                          {cot.estado === "COTIZADO" && cot.pdf_url && (
                            <Link
                              href={cot.pdf_url}
                              target="_blank"
                              className="block mt-3 text-[#667eea] hover:underline text-sm font-semibold"
                            >
                              📥 Descargar PDF
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <ModalAlerta
        isOpen={modalAlerta.isOpen}
        type={modalAlerta.type}
        title={modalAlerta.title}
        message={modalAlerta.message}
        buttons={modalAlerta.buttons}
        onClose={() => setModalAlerta({ ...modalAlerta, isOpen: false })}
      />

      <Footer />
    </>
  )
}
