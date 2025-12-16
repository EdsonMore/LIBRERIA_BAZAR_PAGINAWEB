// lib/ocr-utils.ts
/**
 * Utilidades avanzadas para OCR y extracción de productos de imágenes
 * Enfocado en listas de útiles escolares
 */

/**
 * Patrones comunes en listas de útiles escolares
 */
const PATRONES_UTILES = {
  cuadernos: ['cuaderno', 'libreta', 'bloc'],
  lapices: ['lápiz', 'lapiz', 'pencil', 'grafito'],
  colores: ['color', 'colore', 'crayon', 'crayola', 'marcador'],
  boligrafos: ['bolígrafo', 'boligrafo', 'pen', 'esfero'],
  regla: ['regla', 'ruler'],
  borrador: ['borrador', 'goma', 'eraser'],
  tajador: ['tajador', 'sacapunta', 'sharpener'],
  pega: ['pega', 'pegamento', 'goma', 'adhesivo', 'glue'],
  tijeras: ['tijera', 'tijeras', 'scissors'],
  mochila: ['mochila', 'backpack', 'bolsa'],
  uniforme: ['uniforme', 'buzo', 'polo', 'short'],
};

/**
 * Palabras que NO son productos (filtros)
 */
const PALABRAS_FILTRO = [
  'lista', 'útiles', 'útil', 'escolar', 'kinder', 'primaria', 
  'secundaria', 'materiales', 'equipos', 'requerido', 'necesario',
  'ingles', 'math', 'lengua', 'comunicación', 'historia', 'geografía',
  'ciencia', 'tecnología', 'educación', 'física', 'artística',
  'nota', 'observación', 'importante', 'obligatorio', 'opcional',
  'cantidad', 'cantidad total', 'cantidad', 'ingles', 'math', 'note',
  'extra', 'adicional', 'según', 'marca', 'de', 'del', 'la', 'el',
];

/**
 * Extrae productos con mejor reconocimiento de patrones
 */
export function extraerProductosAvanzado(texto: string): string[] {
  const productos = new Set<string>();

  console.log('=== INICIO extraerProductosAvanzado ===');
  console.log('Texto recibido (primeros 500 chars):', texto.substring(0, 500));
  console.log('Longitud total del texto:', texto.length);

  // Normalizar el texto
  let normalizado = texto
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/\s+/g, ' ');

  // EL PROBLEMA: El OCR manda TODO EN UNA LÍNEA
  // Dividir por el patrón "- número" que marca items
  // Ej: "KINDER 2010 - 1 caja de lápices - 1 caja de colores"
  
  let items: string[] = [];
  
  // Primero intenta dividir por líneas reales (si las hay)
  const lineasReales = normalizado.split('\n').map(l => l.trim()).filter(l => l);
  
  console.log('Líneas reales encontradas:', lineasReales.length);

  // Si hay solo UNA línea muy larga, dividir por patrón "- número"
  if (lineasReales.length === 1 && lineasReales[0].length > 200) {
    console.log('⚠️ Detectado: TODO EN UNA LÍNEA. Dividiendo por patrón "- número"');
    
    // Dividir por " - " y números
    items = normalizado
      .split(/\s*-\s+/)  // Split por " - "
      .map(item => item.trim())
      .filter(item => item && item.length > 0);
    
    console.log('Items divididos por guión:', items.length);
  } else {
    // Si hay múltiples líneas, usarlas directamente
    items = lineasReales;
  }

  console.log('Total de items a procesar:', items.length);

  for (let idx = 0; idx < items.length; idx++) {
    let procesada = items[idx].toLowerCase().trim();

    console.log(`\nItem ${idx}: "${procesada.substring(0, 80)}..."`);

    // Salta líneas vacías
    if (!procesada || procesada.length < 3) {
      console.log(`  → Saltado (muy corto)`);
      continue;
    }

    // Salta si es solo puntuación o números
    if (/^[\d\-\.\,\(\)]+$/.test(procesada)) {
      console.log(`  → Saltado (solo números/puntuación)`);
      continue;
    }

    // Salta encabezados muy largos
    if (procesada.length > 100) {
      console.log(`  → Saltado (muy largo - ${procesada.length} chars)`);
      continue;
    }

    // Salta palabras filtro
    if (/colegio|escolar|lista|útiles|útil|nivel|kinder|primaria|secundaria|materiales|equipos/.test(procesada)) {
      console.log(`  → Saltado (palabra filtro)`);
      continue;
    }

    // PATRÓN 1: "número producto..." (ej: "1 caja de lápices")
    let match = procesada.match(/^\d+\s+(.+?)(?:\s*\(|$)/);
    if (match) {
      let producto = match[1].trim();
      producto = limpiarProducto(producto);
      console.log(`  ✓ Patrón 1: "${producto}"`);
      if (validarProducto(producto)) {
        productos.add(producto);
        continue;
      } else {
        console.log(`    ✗ No validado`);
      }
    }

    // PATRÓN 2: Tiene parentesis - extraer lo de antes
    if (procesada.includes('(')) {
      match = procesada.match(/^([^()]+?)\s*\(/);
      if (match) {
        let producto = match[1].trim();
        // Quita número al inicio
        producto = producto.replace(/^\d+\s+/, '');
        producto = limpiarProducto(producto);
        console.log(`  ✓ Patrón 2 (con parentesis): "${producto}"`);
        if (validarProducto(producto)) {
          productos.add(producto);
          continue;
        }
      }
    }

    // PATRÓN 3: Fallback - si tiene letras y no fue rechazado
    if (/[a-záéíóú]/i.test(procesada) && procesada.length >= 3) {
      let producto = procesada
        .replace(/^\d+\s+/, '') // quita número al inicio
        .replace(/\s*\(\s*[^)]*\s*\)\s*$/g, '') // quita parentesis al final
        .trim();

      if (validarProducto(producto)) {
        console.log(`  ✓ Patrón 3 (fallback): "${producto}"`);
        productos.add(producto);
      } else {
        console.log(`  ✗ Fallback: no validado`);
      }
    }
  }

  const resultado = Array.from(productos).filter(p => p.length >= 2);
  console.log('\n=== FIN extraerProductosAvanzado ===');
  console.log('TOTAL PRODUCTOS EXTRAÍDOS:', resultado.length);
  console.log('Productos:', resultado);
  return resultado;
}

/**
 * Limpia un texto de producto
 */
function limpiarProducto(texto: string): string {
  return texto
    // Elimina cantidad al inicio
    .replace(/^\d+\s*[-]?\s*/, '')
    // Elimina precios
    .replace(/s\.\s*\d+(\.\d{2})?/g, '')
    .replace(/\$\s*\d+(\.\d{2})?/g, '')
    .replace(/[\$€¥£]/g, '')
    // Elimina especificaciones entre paréntesis al final
    .replace(/\s*\(\s*[^)]*\s*\)\s*$/g, '')
    // Elimina cantidades específicas
    .replace(/\s*\d+\s*(?:piezas?|hojas?|unidades?|cm|m|ml|gr|kg|l|colores?)\s*$/i, '')
    // Elimina espacios extras
    .trim();
}

/**
 * Valida si es un producto válido
 * MÁS PERMISIVO para captar errores OCR
 */
function validarProducto(texto: string): boolean {
  // Mínimo 2 caracteres (muy corto)
  if (texto.length < 2) return false;

  // Máximo 150 caracteres
  if (texto.length > 150) return false;

  // No es solo números o puntuación
  if (/^[\d\-\.\,\(\)]+$/.test(texto)) return false;

  // No es una fecha, teléfono, etc.
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(texto)) return false;

  // Debe tener al menos una palabra (letras)
  if (!/[a-záéíóú]/i.test(texto)) return false;

  return true;
}

/**
 * Verifica si es una línea separadora
 */
function esLineaseparadora(texto: string): boolean {
  return /^[-=_]{3,}$/.test(texto) || 
         /^\s*$/.test(texto) ||
         /^[\d\.\s]{5,}$/.test(texto);
}

/**
 * Calcula similitud mejorada entre dos textos
 */
export function calcularSimilitudMejorada(texto1: string, texto2: string): number {
  // Normalizar
  const norm1 = normalizar(texto1);
  const norm2 = normalizar(texto2);

  // Coincidencia exacta
  if (norm1 === norm2) return 1.0;

  // Contención completa
  if (norm1.includes(norm2) && norm2.length > 4) return 0.95;
  if (norm2.includes(norm1) && norm1.length > 4) return 0.95;

  // Dividir en palabras significativas
  const palabras1 = norm1.split(/\s+/).filter(p => p.length > 2);
  const palabras2 = norm2.split(/\s+/).filter(p => p.length > 2);

  if (palabras1.length === 0 || palabras2.length === 0) return 0;

  // Contar coincidencias
  let coincidencias = 0;
  let coincidenciasAltas = 0;

  for (const p1 of palabras1) {
    for (const p2 of palabras2) {
      if (p1 === p2) {
        coincidencias += 2;
        coincidenciasAltas += 1;
        break;
      } else if (esAcronimo(p1, p2) || esVariacion(p1, p2)) {
        coincidencias += 1.5;
        break;
      } else if (p1.startsWith(p2) || p2.startsWith(p1)) {
        coincidencias += 0.8;
        break;
      }
    }
  }

  // Si tiene coincidencias altas, boosteamos
  const bonus = coincidenciasAltas > 0 ? 0.1 : 0;
  const similaridad = (coincidencias / (Math.max(palabras1.length, palabras2.length) * 2)) + bonus;

  return Math.min(similaridad, 1.0);
}

/**
 * Normaliza un texto
 */
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Verifica si dos palabras son acrónimos una de la otra
 */
function esAcronimo(p1: string, p2: string): boolean {
  if (p1.length < 3 || p2.length < 3) return false;
  return (p1.startsWith(p2.charAt(0)) && p2.includes(p1.charAt(0))) ||
         (p2.startsWith(p1.charAt(0)) && p1.includes(p2.charAt(0)));
}

/**
 * Verifica si una palabra es variación de otra
 */
function esVariacion(p1: string, p2: string): boolean {
  // Singular/plural
  if ((p1 + 's' === p2) || (p2 + 's' === p1)) return true;
  
  // Variaciones comunes
  const variaciones: { [key: string]: string[] } = {
    'lápiz': ['lapiz', 'pencil', 'grafito'],
    'bolígrafo': ['boligrafo', 'pen', 'esfero'],
    'pegamento': ['pega', 'goma', 'adhesivo'],
    'tijera': ['tijeras'],
    'cuaderno': ['libreta', 'bloc'],
    'color': ['colore'],
  };

  for (const [base, vars] of Object.entries(variaciones)) {
    if (p1 === base && vars.includes(p2)) return true;
    if (p2 === base && vars.includes(p1)) return true;
  }

  return false;
}
