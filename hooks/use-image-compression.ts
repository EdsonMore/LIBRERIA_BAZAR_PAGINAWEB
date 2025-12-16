/**
 * Hook para comprimir imágenes antes de subirlas
 * Reduce significativamente el tamaño sin perder calidad visual
 */

export function useImageCompression() {
  /**
   * Comprime una imagen (DataURL o Blob)
   * @param dataUrl - URL de datos de la imagen (canvas.toDataURL() o FileReader)
   * @param maxWidth - Ancho máximo (defecto: 1280px)
   * @param maxHeight - Alto máximo (defecto: 720px)
   * @param quality - Calidad JPEG 0-1 (defecto: 0.7 = 70%)
   * @returns Promise con la imagen comprimida en formato DataURL
   */
  const compressImage = async (
    dataUrl: string,
    maxWidth: number = 1280,
    maxHeight: number = 720,
    quality: number = 0.7
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image()

      img.onload = () => {
        try {
          // Calcular nuevas dimensiones manteniendo aspecto
          let width = img.width
          let height = img.height

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width)
              width = maxWidth
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height)
              height = maxHeight
            }
          }

          // Crear canvas y dibujar imagen redimensionada
          const canvas = document.createElement("canvas")
          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext("2d")
          if (!ctx) {
            reject(new Error("No se pudo obtener contexto del canvas"))
            return
          }

          // Usar técnica de suavizado para mejor calidad
          ctx.drawImage(img, 0, 0, width, height)

          // Convertir a JPEG comprimido
          const compressedDataUrl = canvas.toDataURL("image/jpeg", quality)

          // Calcular reducción de tamaño
          const originalSize = Math.round((dataUrl.length * 3) / 4 / 1024) // KB
          const compressedSize = Math.round((compressedDataUrl.length * 3) / 4 / 1024) // KB
          const reduction = Math.round(((originalSize - compressedSize) / originalSize) * 100)

          console.log(
            `📸 Compresión: ${originalSize}KB → ${compressedSize}KB (-${reduction}%)`
          )

          resolve(compressedDataUrl)
        } catch (error) {
          reject(error)
        }
      }

      img.onerror = () => {
        reject(new Error("Error al cargar la imagen"))
      }

      img.src = dataUrl
    })
  }

  /**
   * Comprime una imagen desde un File
   */
  const compressImageFile = async (
    file: File,
    maxWidth: number = 1280,
    maxHeight: number = 720,
    quality: number = 0.7
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = async (event) => {
        try {
          const dataUrl = event.target?.result as string
          const compressed = await compressImage(dataUrl, maxWidth, maxHeight, quality)
          resolve(compressed)
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = () => {
        reject(new Error("Error al leer el archivo"))
      }

      reader.readAsDataURL(file)
    })
  }

  return {
    compressImage,
    compressImageFile,
  }
}
