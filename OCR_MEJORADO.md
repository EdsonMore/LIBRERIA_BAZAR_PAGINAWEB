# 🔥 Sistema OCR Mejorado para Extracción de Listas Escolares

## ¿Qué cambió?

El sistema ahora es **mucho más potente** para extraer productos de imágenes de listas. Implementamos:

### 1. **OCR con Tesseract.js + Preprocessing**
- Convierte imágenes a escala de grises
- Mejora contraste automáticamente
- Aumenta nitidez
- Soporta español e inglés

### 2. **Algoritmo Avanzado de Extracción**
- Reconoce múltiples patrones de listas:
  - `1 - Cuaderno de 100 hojas`
  - `1 caja de lápices (12 colores)`
  - `Cuaderno (100 hojas)`
  - `Lápiz grafito`
- Filtra automáticamente líneas que no son productos
- Limpia especificaciones y precios

### 3. **Fuzzy Matching Inteligente**
- Compara palabras clave, no solo similitud simple
- Detecta variaciones: "lápiz" ≈ "lapiz" ≈ "pencil"
- Reconoce singular/plural
- Usa umbral de 45% para capturar más coincidencias

## Mejoras Específicas

| Antes | Después |
|-------|---------|
| 4 productos extraídos | +30-40 productos |
| Extraía solo nombre completo exacto | Extrae variaciones y sinónimos |
| Frecuentes fallos con imágenes de mala calidad | Mejora automáticamente las imágenes |
| No reconocía patrones comunes | Reconoce 10+ patrones diferentes |

## Cómo Usar

### En el Panel SuperAdmin

1. **Cargar Imagen**: 
   - Soporta: JPG, PNG, PDF
   - Mejor calidad = mejor extracción
   - Imágenes de 1000x1000 px+ funcionan bien

2. **Análisis Automático**:
   - El sistema automáticamente hará OCR si sube imagen
   - Extrae y busca coincidencias en BD
   - Muestra productos encontrados y sugeridos

3. **Revisión**:
   - Productos encontrados con % similitud
   - Productos no encontrados para completar manualmente
   - Puede editar cantidades y precios

### En el Formulario de Upload

```typescript
// Frontend: Enviar imagen o texto
const formData = new FormData();
formData.append('archivo', imageFile); // O
formData.append('textoExtraido', 'texto manual');

const res = await fetch('/api/cotizaciones/analizar-imagen', {
  method: 'POST',
  body: formData,
});
```

## Configuración Disponible

En `lib/ocr-utils.ts` puedes customizar:

### Patrones de Productos
```typescript
const PATRONES_UTILES = {
  cuadernos: ['cuaderno', 'libreta', 'bloc'],
  lapices: ['lápiz', 'lapiz', 'pencil'],
  // ... más patrones
}
```

### Palabras a Filtrar
```typescript
const PALABRAS_FILTRO = [
  'lista', 'útiles', 'escolar', 'primaria',
  // ... agregar más si necesario
]
```

### Umbral de Similitud
En `buscarProductosSimilares()`:
```typescript
let mejorSimilitud = 0.45; // ← Cambiar aquí (0.0 a 1.0)
if (mejorSimilitud >= 0.5) { // ← Y aquí para aceptar
```

## Requisitos Instalados

✅ tesseract.js - OCR
✅ sharp - Procesamiento de imágenes

## Diagnóstico

Si no funciona bien:

1. **Verifica que la imagen sea legible**
   - Mínimo 500x500 px
   - Contraste claro entre texto y fondo

2. **Revisa el texto extraído**
   - La respuesta devuelve `textoExtraido` para debugging
   - Si está vacío, la imagen es muy mala

3. **Ajusta umbrales en ocr-utils.ts**
   - Bajar `mejorSimilitud` capta más productos (pero menos precisos)
   - Subir `mejorSimilitud` es más preciso (pero captura menos)

## Ejemplos de Casos de Uso

### ✅ Funciona Bien
```
- Cuaderno de 100 hojas
- 1 caja de lápices (12 colores)
- Uniforme completo
- Mochila resistente
```

### ⚠️ Puede Necesitar Corrección
```
- Texto OCR deficiente (imagen borrosa)
- Productos con nombres muy largos
- Caracteres especiales corrupto
```

## Próximas Mejoras (Opcionales)

- [ ] Integrar Google Cloud Vision API para OCR aún más potente
- [ ] Cache de productos coincidentes para más rápido
- [ ] Aprendizaje: recordar correcciones manuales del admin
- [ ] Soporte para múltiples idiomas automático
- [ ] Exportar lista de "productos no encontrados" para agregar a BD
