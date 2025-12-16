# Corrección: Actualización de Productos - Problemas Resueltos

## Problemas Reportados

### 1. Error 413 Content Too Large
- **Causa**: URL de imagen muy larga (>2000 caracteres)
- **Síntoma**: `PUT 413 (Content Too Large)` + `"Request En"... is not valid JSON`

### 2. Precio se sobreescribe automáticamente
- **Causa**: Pérdida de precisión en decimales (1.50 → 1.47)
- **Síntoma**: Escribes 1.50, se convierte a 1.47

### 3. Error 400 Bad Request en otros productos
- **Causa**: Validación insuficiente + URL demasiado larga
- **Síntoma**: `PUT 400 (Bad Request)` sin mensaje claro

## Soluciones Implementadas

### 1. **app/api/admin/productos/[id]/route.ts** - Mejorado

#### Validaciones Añadidas:
```typescript
✅ Validar ID de producto
✅ Validar campos obligatorios (nombre, descripción)
✅ Validar precio: parseFloat + redondear a 2 decimales
✅ Validar stock: parseInt
✅ Validar categoría: parseInt
✅ Límite de URL de imagen: 1500 caracteres (reducido de 2000)
✅ Redondeo de precio: Math.round(precioNum * 100) / 100
```

#### Manejo de Errores:
```typescript
✅ Mejor parseo de JSON con try-catch
✅ Mensajes de error específicos
✅ Siempre devuelve JSON (nunca HTML)
```

### 2. **app/admin/productos/editar/[id]/page.tsx** - Optimizado

#### Input de Precio:
```typescript
// Cambio: type="number" → type="text" + inputMode="decimal"
// Razón: Mejor control sobre decimales

Características:
✅ Solo permite números y punto
✅ Redondea a 2 decimales al perder foco
✅ No hace conversiones automáticas dañinas
✅ Pattern: [0-9]+(\\.[0-9]{1,2})?
```

#### Input de Stock:
```typescript
// Cambio: type="number" → type="text" + inputMode="numeric"
// Razón: Mejor control sobre enteros

Características:
✅ Solo permite números
✅ No permite decimales
✅ Convierte correctamente con parseInt
```

#### Validaciones en Frontend:
```typescript
✅ Validar nombre no vacío
✅ Validar descripción no vacía
✅ Validar precio >= 0
✅ Validar stock >= 0
✅ Validar URL imagen <= 1500 caracteres
✅ Mensaje claro si URL es muy larga
✅ Redondeo de precio antes de enviar
✅ Logging del tamaño del payload
```

#### Mejor Manejo de Errores:
```typescript
✅ Try-catch para parsear respuesta JSON
✅ Si error 413: "Error 413: Content Too Large"
✅ Si error 400: Muestra el mensaje del servidor
✅ Si error de conexión: Muestra el error
```

## Comportamiento Nuevo

### Flujo Correcto de Actualización:

```
1. Usuario edita producto (ej: precio 1.50)
2. Frontend valida:
   - Precio >= 0? ✓
   - Precio es número? ✓
   - URL imagen <= 1500 chars? ✓
3. Frontend redondea: 1.50 → 1.50
4. Frontend envía JSON optimizado (~500 bytes)
5. Backend valida:
   - parseFloat(precio) → 1.50
   - Math.round(1.50 * 100) / 100 → 1.50
   - INSERT/UPDATE con precio correcto
6. Respuesta: 200 OK + "Producto actualizado exitosamente"
7. Usuario vuelve a lista de productos
```

### Si hay error:

```
URL demasiado larga:
Frontend: "URL de imagen demasiado larga (1600 caracteres). Máximo 1500 caracteres."
↓ Usuario ve alerta clara

Precio inválido:
Frontend: "El precio debe ser un número válido mayor a 0"
↓ Usuario ve alerta clara

URL con espacios/caracteres especiales:
Frontend: Rechaza si contiene caracteres inválidos
Backend: También valida y rechaza

Stock negativo:
Frontend: "El stock debe ser un número entero válido"
↓ Previene errores antes de enviar
```

## Cambios Técnicos Detallados

### Endpoint PUT: Redondeo de Decimales
```typescript
// Antes (Problema):
precio: Number(producto.precio)  // 1.50 → 1.4999999...

// Después (Correcto):
const precioNum = parseFloat(precio)
const precioDosDecimales = Math.round(precioNum * 100) / 100
// 1.50 → 1.50 (correcto)
```

### Frontend: Control de Input
```typescript
// Antes (Problema):
<input type="number" value={producto.precio} onChange={(e) => setProducto(...)} />
// Causaba: 1.50 → 1.4999... → 1.47 en pantalla

// Después (Correcto):
<input 
  type="text" 
  inputMode="decimal"
  value={producto.precio}
  onChange={(e) => {
    if (/^\d*\.?\d*$/.test(value)) setProducto(...)
  }}
  onBlur={(e) => {
    const rounded = Math.round(value * 100) / 100
    setProducto({ ...producto, precio: rounded })
  }}
/>
// Resultado: 1.50 → 1.50 (siempre)
```

## Límites Ahora

| Campo | Antes | Ahora | Razón |
|-------|-------|-------|-------|
| URL Imagen | 2000 chars | 1500 chars | Evitar 413 en Vercel |
| Precio | Sin redondeo | Redondear a 2 decimales | Precisión financiera |
| Stock | Sin validación | parseInt + >= 0 | Datos válidos |
| Payload Total | No validado | Logging (max ~1KB) | Debug en frontend |

## Testing Manual Recomendado

```typescript
// Test 1: Precio con 2 decimales
Escribir: 1.50
Esperar 1s (blur)
Ver en input: 1.50 ✓

// Test 2: Precio sin decimales
Escribir: 10
Esperar 1s (blur)
Ver en input: 10 ✓

// Test 3: Stock
Escribir: 5
Esperar 1s (blur)
Ver en input: 5 ✓

// Test 4: URL larga
Escribir: URL > 1500 chars
Click Guardar
Ver alerta: "URL demasiado larga..." ✓

// Test 5: Actualizar
Todo válido
Click Guardar
Ver: "Producto actualizado exitosamente" ✓
Ir a lista de productos ✓
Verificar en BD que precio = 1.50 (no 1.47) ✓
```

## Próximos Pasos

1. **Git push**
   ```bash
   git add .
   git commit -m "Fix: Mejorar actualización de productos - decimales, validación, tamaño"
   git push
   ```

2. **Vercel redeploy**
   - Automático después de push
   - Esperar 2-3 minutos

3. **Pruebas en Producción**
   - Ir a Admin → Editar un producto
   - Cambiar precio a 1.50
   - Guardar
   - Verificar que se guarde como 1.50 (no 1.47)

## Si Persisten Problemas

### Error 413 aún aparece:
```
→ La URL de imagen es > 1500 caracteres
→ Usar URL más corta o CDN (Cloudinary, Imgur)
→ No guardar imágenes como base64 en strings
```

### Precio sigue siendo incorrecto:
```
→ Limpiar caché del navegador (Ctrl+Shift+Del)
→ Verificar en DevTools que se envía precio correcto
→ Verificar en BD que se guardó correcto
```

### Error 400 sin mensaje:
```
→ Abrir console del navegador (F12)
→ Copiar el JSON que se envía
→ Verificar que tenga estructura correcta:
   {
     "nombre": "...",
     "descripcion": "...",
     "precio": 1.50,
     "stock": 10,
     "categoria_id": 1,
     "imagen": "https://...",
     "disponible": true
   }
```

## Documentación Relacionada

- [SOLUCION_ERROR_413.md](SOLUCION_ERROR_413.md)
- [SOLUCION_ERROR_500_CONNECTION.md](SOLUCION_ERROR_500_CONNECTION.md)
