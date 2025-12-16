# Solución Error 500 - Connection Terminated Unexpectedly

## Problema
Error al cargar productos: `Error: Connection terminated unexpectedly`
- Status: 500
- Causa: Pool de conexiones a PostgreSQL se cierra inesperadamente
- Contexto: Sucede en Vercel/Railway después de obtener el producto

## Raíz del Problema

1. **Pool mal configurado para serverless**: 
   - Vercel tiene límites de conexiones activas
   - El pool tenía `max: 10` conexiones, demasiado para serverless
   - Las conexiones idle no se limpiaban rápido

2. **Múltiples queries en cascada**:
   - Se hacen 4 queries (producto, categoría, relacionados, reseñas)
   - Si alguna falla, cierra toda la conexión
   - No hay manejo de error granular

3. **Timeout de statement muy bajo**:
   - `statementTimeoutMillis: 10000` es muy bajo
   - Queries complejas pueden exceder este tiempo

## Cambios Realizados

### 1. **lib/db.ts** - Optimizar configuración del pool
```typescript
// Antes: max: 10 (demasiado para serverless)
// Después: max: 5 (mejor para serverless)

// Antes: idleTimeoutMillis: 30000
// Después: idleTimeoutMillis: 15000 (limpiar más rápido)

// Antes: statementTimeoutMillis: 10000
// Después: statementTimeoutMillis: 30000 (más tiempo)

// Agregado: Manejo de eventos del pool
pool.on('error', (error) => { ... })
pool.on('connect', () => { ... })
pool.on('remove', () => { ... })

// Agregado: Try-catch en client.release()
// Evita errores al liberar conexiones
```

### 2. **lib/db.ts** - Mejor manejo de errores
```typescript
// Agregado: Try-catch en client.release()
// Para capturar errores al liberar conexiones

// Agregado: Logs más detallados (❌, ⚠️)
// Para diagnosticar problemas de conexión
```

### 3. **app/api/productos/[id]/route.ts** - Manejo granular
```typescript
// Agregado: Validación del ID
if (!id || isNaN(Number(id))) { ... }

// Cambio: Cada query en su propio try-catch
// Si falla reseñas, no falla el producto
// Si falla relacionados, devuelve array vacío

// Agreg: Logs con ⚠️ para errores parciales
// Ahora devuelve datos parciales en lugar de fallar
```

## Comportamiento Nuevo

### Antes (Problema):
```
1. GET producto → OK
2. GET categoría → OK
3. GET relacionados → OK
4. GET reseñas → ❌ FALLA CONEXIÓN
5. Todo falla con error 500
```

### Después (Mejorado):
```
1. GET producto → OK (datos principales)
2. GET categoría → OK (o vacío si falla)
3. GET relacionados → OK (o array vacío si falla)
4. GET reseñas → OK (o array vacío si falla)
5. Devuelve 200 con datos parciales
```

## Qué Hacer Ahora

### 1. Git push
```bash
git add .
git commit -m "Fix: Mejorar configuración de pool PostgreSQL y manejo de errores"
git push
```

### 2. Vercel redeploy
- El cambio se aplicará automáticamente
- Espera 2-3 minutos

### 3. Probar
- Intenta cargar un producto
- Debería funcionar sin error 500

## Si Persiste el Error

### Revisar en Vercel Logs:
1. Ve a https://vercel.com/dashboard
2. Selecciona tu proyecto
3. Logs → Función `/api/productos/[id]`
4. Busca qué query falla

### Común: Falta de Índices
Si la query de reseñas es lenta:
```sql
-- Verificar si existen índices:
SELECT * FROM pg_indexes WHERE tablename = 'resenas';

-- Si no existen, crearlos:
CREATE INDEX idx_resenas_producto ON resenas(producto_id);
CREATE INDEX idx_resenas_estado ON resenas(estado);
```

### Común: Timeout en JOIN
Si el JOIN usuarios-reseñas es lento:
```sql
-- Verificar índices en usuarios:
CREATE INDEX idx_usuarios_id ON usuarios(id);
```

## Monitoreo Futuro

Para evitar esto en el futuro:
1. Agregar logging de tiempos de query
2. Alertas en Sentry si queries > 5s
3. Índices en todas las FK (Foreign Keys)
4. Usar read replicas si es posible

## Variables de Entorno Recomendadas

```env
# PostgreSQL en Vercel
DATABASE_URL=postgresql://user:pass@host:port/dbname

# Si usas Railway, ya debería estar configurado
# Si usas Neon, agregar esto:
# ?sslmode=require
```
