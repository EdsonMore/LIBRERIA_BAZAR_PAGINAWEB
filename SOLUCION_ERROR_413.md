# Solución Error 413 (Content Too Large)

## Problema
Error al actualizar productos: `PUT 413 (Content Too Large)` 
- El servidor rechaza la solicitud porque el payload es demasiado grande
- La URL de la imagen puede ser muy larga

## Cambios Realizados

### 1. **next.config.mjs** - Aumentar límite de tamaño
- Agregué configuración de `bodyParser` con límite de **50MB**
- Esto permite que el servidor acepte payloads más grandes

### 2. **app/api/admin/productos/[id]/route.ts** - Mejorar validación
- Agregué validación de `content-length` antes de procesar
- Validación de URL de imagen (máximo 2000 caracteres)
- Mejor manejo de errores JSON
- Mensaje de error específico si el payload es demasiado grande

### 3. **app/admin/productos/editar/[id]/page.tsx** - Optimizar datos
- Limpiar strings con `.trim()`
- Convertir números explícitamente
- Validación local antes de enviar
- Mensaje de éxito después de actualizar

### 4. **middleware.ts** - Middleware global
- Creado para posible protección adicional en futuro

## Qué Hacer Ahora

### Opción 1: Solución rápida (Local)
1. Redeploy en local para probar
2. Si funciona, commit y push a GitHub

### Opción 2: Solución en Vercel
1. Hacer push de los cambios a GitHub
2. Vercel redeploy automáticamente
3. Los cambios en `next.config.mjs` se aplicarán

## Recomendaciones Adicionales

### Si aún tienes problemas:
1. **Verificar URL de imagen**: 
   - Asegúrate que no sea demasiado larga
   - Usa URLs cortas (ej: CDN en lugar de datos base64)

2. **Verificar tamaño de descripción**: 
   - Si tiene muchas líneas, podría estar cerca del límite

3. **Si usas imágenes base64**:
   - NO las envíes en el JSON
   - En su lugar, carga la imagen a un CDN (ej: Cloudinary, AWS S3)
   - Solo guarda la URL en la base de datos

### Para mejor rendimiento:
- Las imágenes base64 NO deberían ir en la BD
- Las imágenes deberían estar en un CDN
- La BD solo guarda URLs

## Próximos Pasos Recomendados

1. **Probar la actualización de productos**
   - Intenta actualizar un producto con:
     - Nombre corto
     - Descripción normal
     - URL de imagen normal

2. **Verificar logs en Vercel**
   - Si persiste: ve a Vercel → Logs → busca "413"

3. **Si persiste después del redeploy**:
   - Considera cambiar a una solución de almacenamiento de imágenes
   - Cloudinary o AWS S3 son opciones gratuitas/baratas
