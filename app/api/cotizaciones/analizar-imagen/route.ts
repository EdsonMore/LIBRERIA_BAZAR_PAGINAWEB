// app/api/cotizaciones/analizar-imagen/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query as dbQuery } from '@/lib/db';
import { extraerProductosAvanzado, calcularSimilitudMejorada } from '@/lib/ocr-utils';

/**
 * Procesa la imagen con preprocessing para mejorar OCR
 */
async function mejorarImagenParaOCR(buffer: Buffer): Promise<Buffer> {
  try {
    const sharp = require('sharp');
    // Aumentar contraste y nitidez para mejor OCR
    return await sharp(buffer)
      .resize(2560, 2560, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .grayscale()
      .normalize()
      .sharpen()
      .toBuffer();
  } catch (error) {
    console.error('Error mejorando imagen:', error);
    return buffer;
  }
}

/**
 * NOTA: OCR se hace en el FRONTEND con tesseract.js
 * Este endpoint solo recibe el texto extraído y busca productos
 */

/**
 * Extrae productos de forma inteligente - reconoce patrones comunes en listas
 */
function extraerProductosInteligentemnte(texto: string): string[] {
  const productosExtraidos: Set<string> = new Set();
  
  // Normalizar espacios y saltos de línea
  const textolimpio = texto
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/\s+/g, ' ');

  const lineas = textolimpio.split('\n');

  for (let i = 0; i < lineas.length; i++) {
    let linea = lineas[i].trim();
    
    // Salta líneas vacías o muy cortas
    if (!linea || linea.length < 3) continue;

    // Salta títulos comunes
    if (/lista|útiles|útil|escolar|kinder|primaria|materiales|equipos|requerido|necesario|ingles|math|lengua|comunicación/i.test(linea)) {
      continue;
    }

    // Patrón 1: "número - nombre" (ej: "1 caja de lápices")
    let match = linea.match(/^\d+\s*[-.]?\s*(.+?)(?:\s*\(|$)/);
    if (match) {
      let producto = match[1].trim();
      if (esProductoValido(producto)) {
        productosExtraidos.add(producto);
        continue;
      }
    }

    // Patrón 2: "nombre (cantidad/especificación)"
    match = linea.match(/^([^()]+?)\s*\(/);
    if (match) {
      let producto = match[1].trim();
      if (esProductoValido(producto)) {
        productosExtraidos.add(producto);
        continue;
      }
    }

    // Patrón 3: Línea normal sin patrones especiales
    // Pero que no sea solo un número o puntuación
    if (!/^[\d\-\.\,\(\)]+$/.test(linea) && linea.length > 4) {
      // Elimina cantidad al inicio si existe
      let producto = linea
        .replace(/^\d+\s*[-]?\s*/, '')
        .replace(/\s*\d+\s*[-]?\s*unidad/i, '')
        .trim();

      // Elimina precios y símbolos de moneda
      producto = producto
        .replace(/S\.\s*\d+(\.\d{2})?/g, '')
        .replace(/\$\s*\d+(\.\d{2})?/g, '')
        .replace(/[\$€¥£]/g, '')
        .trim();

      // Elimina tamaños/cantidades al final comunes
      producto = producto
        .replace(/\s*\(\s*\d+\s*(?:piezas?|hojas?|unidad|cm|m|ml|gr|kg|l|color|colore?s)\s*\)/i, '')
        .trim();

      if (esProductoValido(producto)) {
        productosExtraidos.add(producto);
      }
    }
  }

  return Array.from(productosExtraidos).filter(p => p.length > 2);
}

/**
 * Valida si es un producto válido
 */
function esProductoValido(texto: string): boolean {
  // Mínimo 3 caracteres
  if (texto.length < 3) return false;

  // No es solo números/puntuación
  if (/^[\d\-\.\,\(\)]+$/.test(texto)) return false;

  // No es fecha, teléfono, etc.
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(texto)) return false;

  // No contiene solo símbolos de separación
  if (/^[-—\.\,]+$/.test(texto)) return false;

  return true;
}

/**
 * Búsqueda fuzzy mejorada - compara por palabras clave
 */
function calcularSimilitud(texto1: string, texto2: string): number {
  const norm1 = texto1.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const norm2 = texto2.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Si es una coincidencia exacta
  if (norm1 === norm2) return 1.0;

  // Si uno contiene al otro completamente
  if (norm1.includes(norm2) || norm2.includes(norm1)) return 0.9;

  const palabras1 = norm1.split(/\s+/).filter(p => p.length > 2);
  const palabras2 = norm2.split(/\s+/).filter(p => p.length > 2);

  if (palabras1.length === 0 || palabras2.length === 0) return 0;

  let coincidencias = 0;
  
  // Contar coincidencias de palabras
  for (const p1 of palabras1) {
    for (const p2 of palabras2) {
      // Coincidencia exacta de palabra
      if (p1 === p2) {
        coincidencias += 2;
        break;
      }
      // Coincidencia parcial (prefijo)
      if (p1.length > 3 && p2.startsWith(p1)) {
        coincidencias++;
        break;
      }
      if (p2.length > 3 && p1.startsWith(p2)) {
        coincidencias++;
        break;
      }
    }
  }

  // Normalizar entre 0 y 1
  const maxCoincidencias = Math.max(palabras1.length, palabras2.length) * 2;
  const similitud = coincidencias / maxCoincidencias;

  return Math.min(similitud, 1.0);
}

/**
 * Busca productos similares en la BD con algoritmo mejorado
 */
async function buscarProductosSimilares(
  nombresExtraidos: string[]
): Promise<any[]> {
  try {
    const sql = `
      SELECT id, nombre, precio, categoria_id, descripcion
      FROM productos
      WHERE disponible = true
      ORDER BY nombre ASC
    `;
    const productos = await dbQuery(sql, []);
    
    // Crea un map de producto -> nombre extraído con similitud
    const resultados: any[] = [];
    
    for (const nombreExtraido of nombresExtraidos) {
      let mejorCoincidencia = null;
      let mejorSimilitud = 0.45; // Umbral más bajo para capturar más
      
      for (const producto of productos) {
        const similitud = calcularSimilitudMejorada(nombreExtraido, producto.nombre);
        if (similitud > mejorSimilitud) {
          mejorSimilitud = similitud;
          mejorCoincidencia = {
            ...producto,
            similitud: similitud,
            nombreExtraido: nombreExtraido,
          };
        }
      }
      
      if (mejorCoincidencia && mejorSimilitud >= 0.5) {
        resultados.push({
          tipo: 'ENCONTRADO',
          producto: mejorCoincidencia,
          nombreExtraido,
          similitud: mejorSimilitud,
        });
      } else {
        resultados.push({
          tipo: 'NO_ENCONTRADO',
          nombreExtraido,
        });
      }
    }
    
    return resultados;
  } catch (error) {
    console.error('Error buscando productos:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const textoExtraido = formData.get('textoExtraido') as string;

    // El OCR se hace en el frontend con tesseract.js
    // Este endpoint solo recibe el texto y busca productos en BD
    if (!textoExtraido || textoExtraido.trim().length === 0) {
      console.error('Texto extraído vacío:', textoExtraido);
      return NextResponse.json(
        { 
          success: false,
          error: 'Se requiere texto extraído de la imagen' 
        },
        { status: 400 }
      );
    }

    console.log('Texto recibido:', textoExtraido.substring(0, 300));

    // Extrae nombres de productos del texto
    const nombresExtraidos = extraerProductosAvanzado(textoExtraido);
    
    console.log('Productos extraídos:', nombresExtraidos);

    if (nombresExtraidos.length === 0) {
      return NextResponse.json({
        success: true,
        productosEncontrados: [],
        productosNoEncontrados: [],
        totalExtraidos: 0,
        totalEncontrados: 0,
        textoExtraido,
        mensajeAdvertencia: 'No se pudieron extraer nombres de productos del texto',
      });
    }

    // Busca coincidencias en la BD
    const resultados = await buscarProductosSimilares(nombresExtraidos);

    // Separa encontrados de no encontrados
    const productosEncontrados = resultados.filter((r) => r.tipo === 'ENCONTRADO');
    const productosNoEncontrados = resultados.filter((r) => r.tipo === 'NO_ENCONTRADO');

    return NextResponse.json({
      success: true,
      productosEncontrados: productosEncontrados.map((p) => ({
        producto_id: p.producto.id,
        nombre_producto: p.producto.nombre,
        precio_unitario: p.producto.precio,
        nombreExtraido: p.nombreExtraido,
        similitud: (p.similitud * 100).toFixed(1),
      })),
      productosNoEncontrados: productosNoEncontrados.map((p) => ({
        nombre_producto: p.nombreExtraido,
        sugerencia: true,
      })),
      totalExtraidos: nombresExtraidos.length,
      totalEncontrados: productosEncontrados.length,
      textoExtraido,
    });
  } catch (error) {
    console.error('Error analizando texto:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al procesar el texto: ' + (error instanceof Error ? error.message : 'desconocido')
      },
      { status: 500 }
    );
  }
}
