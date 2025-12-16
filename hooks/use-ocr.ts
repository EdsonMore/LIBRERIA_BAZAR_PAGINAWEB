// hooks/use-ocr.ts
'use client'

import { useState } from 'react'

/**
 * Hook para hacer OCR con tesseract.js en el frontend
 */
export function useOCR() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Mejora una imagen usando Canvas para mejor OCR
   */
  const mejorarImageaConCanvas = async (archivo: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          // Crear canvas
          const canvas = document.createElement('canvas')
          const scale = 2 // Aumentar resolución
          canvas.width = img.width * scale
          canvas.height = img.height * scale
          
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('No se pudo obtener contexto de canvas'))
            return
          }

          // Dibujar imagen escalada
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

          // Obtener datos de píxeles
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const data = imageData.data

          // Convertir a blanco y negro con ajuste de contraste
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i]
            const g = data[i + 1]
            const b = data[i + 2]

            // Calcular luminancia
            let luminancia = 0.299 * r + 0.587 * g + 0.114 * b

            // Aumentar contraste (threshold adaptativo)
            luminancia = luminancia < 128 ? luminancia * 0.8 : 255 - (255 - luminancia) * 0.8

            // Aplicar
            data[i] = luminancia     // R
            data[i + 1] = luminancia // G
            data[i + 2] = luminancia // B
          }

          ctx.putImageData(imageData, 0, 0)

          // Convertir a blob
          canvas.toBlob((blob) => {
            if (blob) resolve(blob)
            else reject(new Error('Error al convertir canvas a blob'))
          }, 'image/png', 0.95)
        }
        img.onerror = () => reject(new Error('Error cargando imagen'))
        img.src = e.target?.result as string
      }
      reader.onerror = () => reject(new Error('Error leyendo archivo'))
      reader.readAsDataURL(archivo)
    })
  }

  /**
   * Extrae texto de una imagen usando tesseract.js con preprocessing
   */
  const extraerTexto = async (archivo: File): Promise<string | null> => {
    setLoading(true)
    setError(null)

    try {
      console.log('Mejorando imagen...')
      const imagenMejorada = await mejorarImageaConCanvas(archivo)

      // Importar dinámicamente para que no cargue en el servidor
      const Tesseract = (await import('tesseract.js')).default

      // Crear worker con configuración optimizada
      console.log('Creando worker de Tesseract...')
      const worker = await Tesseract.createWorker(['spa', 'eng'])

      // Reconocer texto
      console.log('Iniciando OCR en navegador...')
      const result = await worker.recognize(imagenMejorada)
      const texto = result.data.text || ''
      
      console.log('OCR completado. Texto extraído:', texto.length, 'caracteres')
      console.log('Primeros 300 caracteres:', texto.substring(0, 300))

      // Terminar worker
      await worker.terminate()

      if (!texto || texto.trim().length === 0) {
        setError('El OCR no pudo extraer texto de la imagen. Prueba con una imagen más clara.')
        return null
      }

      return texto
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error desconocido en OCR'
      setError(mensaje)
      console.error('Error en OCR:', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  /**
   * Envía texto al backend para análisis y búsqueda de productos
   */
  const analizarProductos = async (texto: string) => {
    try {
      const formData = new FormData()
      formData.append('textoExtraido', texto)

      const res = await fetch('/api/cotizaciones/analizar-imagen', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || 'Error al analizar')
      }

      return {
        productosEncontrados: data.productosEncontrados || [],
        productosNoEncontrados: data.productosNoEncontrados || [],
        totalExtraidos: data.totalExtraidos || 0,
        totalEncontrados: data.totalEncontrados || 0,
      }
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error desconocido'
      setError(mensaje)
      throw err
    }
  }

  /**
   * Pipeline completo: imagen -> texto -> productos
   */
  const procesarImagen = async (
    archivo: File
  ): Promise<{
    texto: string
    productos: {
      productosEncontrados: any[]
      productosNoEncontrados: any[]
      totalExtraidos: number
      totalEncontrados: number
    }
  } | null> => {
    try {
      // Paso 1: Extraer texto
      const texto = await extraerTexto(archivo)
      if (!texto) {
        throw new Error('No se pudo extraer texto de la imagen')
      }

      // Paso 2: Analizar productos
      const productos = await analizarProductos(texto)

      return { texto, productos }
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error desconocido'
      setError(mensaje)
      return null
    }
  }

  return {
    loading,
    error,
    extraerTexto,
    analizarProductos,
    procesarImagen,
    setError,
  }
}
