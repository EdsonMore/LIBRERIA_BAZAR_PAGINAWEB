// lib/text-extraction.ts
// Servicio para extraer texto de PDF, imágenes y archivos Word

import * as pdfjs from 'pdfjs-dist';
import Tesseract from 'tesseract.js';
import * as mammoth from 'mammoth';
import * as fs from 'fs';

// Configurar worker para pdfjs
if (typeof window === 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}

/**
 * Extrae texto de un archivo PDF
 */
export async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const pdf = await pdfjs.getDocument(fileBuffer).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => (item.str ? item.str : ''))
        .join(' ');
      fullText += pageText + '\n';
    }

    return fullText.trim();
  } catch (error) {
    console.error('Error extrayendo texto de PDF:', error);
    throw new Error('No se pudo extraer texto del PDF');
  }
}

/**
 * Extrae texto de una imagen usando OCR (Tesseract)
 */
export async function extractTextFromImage(imagePath: string): Promise<string> {
  try {
    const { data } = await Tesseract.recognize(imagePath, 'spa+eng', {
      logger: (info: any) => console.log('OCR Progress:', info.progress),
    });
    return data.text.trim();
  } catch (error) {
    console.error('Error extrayendo texto de imagen:', error);
    throw new Error('No se pudo extraer texto de la imagen');
  }
}

/**
 * Extrae texto de un archivo Word (.docx)
 */
export async function extractTextFromWord(filePath: string): Promise<string> {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    return result.value.trim();
  } catch (error) {
    console.error('Error extrayendo texto de Word:', error);
    throw new Error('No se pudo extraer texto del documento Word');
  }
}

/**
 * Función principal que detecta el tipo de archivo y extrae texto
 */
export async function extractTextFromFile(
  filePath: string,
  mimeType: string
): Promise<string> {
  if (mimeType === 'application/pdf') {
    return await extractTextFromPDF(filePath);
  } else if (
    mimeType.startsWith('image/') ||
    mimeType === 'image/jpeg' ||
    mimeType === 'image/png' ||
    mimeType === 'image/webp'
  ) {
    return await extractTextFromImage(filePath);
  } else if (
    mimeType ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  ) {
    return await extractTextFromWord(filePath);
  } else {
    throw new Error(`Tipo de archivo no soportado: ${mimeType}`);
  }
}

/**
 * Procesa el texto extraído para obtener productos y cantidades
 * Intenta encontrar patrones como:
 * - "5 cuadernos"
 * - "cuaderno x 5"
 * - "10 - lapiceros"
 * etc.
 */
export function parseProductsFromText(text: string): Array<{ nombre: string; cantidad: number }> {
  const productos: Array<{ nombre: string; cantidad: number }> = [];

  // Patrones comunes en listas escolares
  const lineas = text.split('\n').filter((l) => l.trim().length > 0);

  for (const linea of lineas) {
    // Patrón: "5 cuadernos" o "Cuadernos - 5"
    const match = linea.match(/(\d+)\s*-?\s*([a-záéíóúñ\s]+)/i);

    if (match) {
      const cantidad = parseInt(match[1], 10);
      const nombre = match[2].trim().toLowerCase();

      if (cantidad > 0 && nombre.length > 2) {
        productos.push({
          nombre,
          cantidad,
        });
      }
    }
  }

  return productos;
}

/**
 * Normaliza nombres de productos para mejor matching con BD
 */
export function normalizarNombreProducto(nombre: string): string {
  return nombre
    .toLowerCase()
    .trim()
    .replace(/[áéíóú]/g, (char) => {
      const map: { [key: string]: string } = {
        á: 'a',
        é: 'e',
        í: 'i',
        ó: 'o',
        ú: 'u',
      };
      return map[char] || char;
    })
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '');
}
