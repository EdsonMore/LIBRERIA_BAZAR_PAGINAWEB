# ✅ VERIFICACIÓN DE INSTALACIÓN - MÓDULO COTIZACIONES

Ejecuta este script para verificar que todo está correctamente instalado.

## ANTES DE EJECUTAR

```bash
cd c:\Users\Lenovo Core i7\Documents\PROYECTOS\licoreria-app

# Verifica Node version
node --version   # debe ser v18+

# Verifica npm
npm --version    # debe ser v8+

# Verifica que la BD está corriendo
# (conecta desde tu cliente SQL)
```

---

## CHECKLIST MANUAL

### 📦 Paso 1: Archivos del Sistema

```bash
# Verifica que estos archivos existan:
dir app\cotizar-lista\page.tsx                                    ✓
dir app\superadmin\cotizaciones\page.tsx                          ✓
dir app\superadmin\layout.tsx                                     ✓
dir app\api\upload\route.ts                                       ✓
dir app\api\cotizaciones\crear\route.ts                           ✓
dir app\api\cotizaciones\listar\route.ts                          ✓
dir app\api\cotizaciones\[id]\agregar-items\route.ts              ✓
dir app\api\cotizaciones\[id]\buscar-producto\route.ts            ✓
dir app\api\cotizaciones\[id]\generar-pdf\route.ts                ✓
dir app\api\cotizaciones\[id]\enviar\route.ts                     ✓
dir lib\text-extraction.ts                                        ✓
dir lib\pdf-generator.ts                                          ✓
dir scripts\06_migration_cotizaciones_listas.sql                  ✓
```

### 📚 Paso 2: Dependencias npm

```bash
npm list jspdf
npm list jspdf-autotable
npm list pdfjs-dist
npm list tesseract.js
npm list office-text-extractor

# Si alguno no aparece, ejecutar:
npm install jspdf jspdf-autotable pdfjs-dist tesseract.js office-text-extractor
```

### 🗄️ Paso 3: Base de Datos

Conecta a tu BD PostgreSQL y ejecuta:

```sql
-- Verificar que las tablas existan
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'cotizacion%';

-- Deberías ver:
-- cotizacion_listas
-- cotizacion_items
-- cotizacion_generada
-- cotizacion_envios

-- Si no existen, ejecutar:
-- psql -U tu_usuario -d tu_bd < scripts/06_migration_cotizaciones_listas.sql
```

### 📁 Paso 4: Carpeta de Uploads

```bash
# Verificar que existe
dir public\uploads\cotizaciones

# Si no existe, crear:
# Windows (PowerShell)
New-Item -Path "public/uploads/cotizaciones" -ItemType Directory -Force

# Linux/Mac
mkdir -p public/uploads/cotizaciones
```

### 🚀 Paso 5: Iniciar Servidor

```bash
npm run dev

# Debería ver:
# > ready - started server on 0.0.0.0:3000
# > compiled client and server successfully

# Si hay errores, revisar logs para:
# - Module not found
# - Cannot find tables
# - ENOENT errors
```

---

## 🧪 PRUEBAS FUNCIONALES

### Test 1: Acceso a Página de Cotización (Cliente)

```
1. Abre: http://localhost:3000
2. Registra un usuario
3. Inicia sesión
4. En navbar, busca "📋 Cotizar Lista"
5. Haz clic
6. Debería cargar: http://localhost:3000/cotizar-lista
   ✓ Debería ver: Formulario de carga
   ✓ Debería ver: Tab "Mis Cotizaciones"
```

### Test 2: Panel SuperAdmin

```
1. Inicia sesión como SuperAdmin
2. Abre: http://localhost:3000/superAdmin/cotizaciones
   ✓ Debería ver: Sidebar con "Cotizaciones"
   ✓ Debería ver: Panel de cotizaciones pendientes
```

### Test 3: Subir Archivo

```
1. Como cliente, en /cotizar-lista
2. Ingresa:
   - Nombre: "Mi lista de útiles"
   - Archivo: Sube un PDF o imagen
3. Haz clic en "Enviar a Cotizar"
   ✓ Debería ver: "Cotización enviada"
   ✓ Debería aparecer en "Mis Cotizaciones" con estado "PENDIENTE"
   ✓ Archivo debe guardarse en: public/uploads/cotizaciones/
```

### Test 4: Ver en SuperAdmin

```
1. Como SuperAdmin, en /superAdmin/cotizaciones
2. Debería aparecer la cotización recién subida
3. Haz clic para seleccionarla
   ✓ Debería cargar en el panel derecho
   ✓ Debería mostrar texto extraído del archivo
```

### Test 5: Buscar y Agregar Producto

```
1. En panel SuperAdmin
2. En "Buscar Producto", escribe nombre de un producto existente
3. Ejemplo: "agua", "galleta", "azúcar"
   ✓ Si existe en BD: Debería mostrar precio automático
   ✓ Si NO existe: Debes ingresar precio manual
4. Haz clic en agregar
   ✓ Debería aparecer en tabla de items
   ✓ Total debería actualizarse automáticamente
```

### Test 6: Generar PDF

```
1. En SuperAdmin, con items agregados
2. Haz clic en "Generar Cotización PDF"
   ✓ Debería aparecer: "PDF generado exitosamente"
   ✓ Debería guardarse en: public/uploads/cotizaciones/
   ✓ Link debería ser descargable
```

### Test 7: Cliente Descarga PDF

```
1. Como cliente, en /cotizar-lista
2. En "Mis Cotizaciones", busca la cotización que generaste
3. Estado debería ser "COTIZADO"
4. Haz clic en "Descargar PDF"
   ✓ Debería descargar un PDF profesional
   ✓ Debería incluir:
     - Logo/branding de "Tienda Bazar"
     - Lista de productos con cantidades
     - Precios unitarios
     - Total en grande
     - Fecha
```

---

## ⚠️ ERRORES COMUNES Y SOLUCIONES

### Error 1: "Module not found: tesseract.js"
```bash
# Solución
npm install tesseract.js
npm run dev
```

### Error 2: "relation 'cotizacion_listas' does not exist"
```sql
-- Solución: Ejecutar migración
psql -U tu_usuario -d tu_bd < scripts/06_migration_cotizaciones_listas.sql

-- O verificar en cliente SQL que las tablas se crearon
SELECT * FROM cotizacion_listas;
```

### Error 3: "ENOENT: no such file or directory ... public/uploads"
```bash
# Solución: Crear carpeta
mkdir -p public/uploads/cotizaciones
```

### Error 4: "404 not found" en navbar "Cotizar Lista"
```
Solución:
1. Verificar que app/cotizar-lista/page.tsx existe
2. Reiniciar servidor: npm run dev
3. Limpiar caché: Ctrl+Shift+R en navegador
```

### Error 5: Tesseract.js descargando (lento en primera carga)
```
Normal: 180 MB en primera ejecución
Luego: Más rápido (cached)
Paciencia: Espera ~2 minutos en primer PDF/imagen
```

---

## 🔧 VERIFICACIÓN DE BASE DE DATOS

Ejecuta estas queries para verificar setup:

```sql
-- 1. Contar tablas creadas
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'cotizacion%';
-- Resultado esperado: 4

-- 2. Ver estructura de cotizacion_listas
\d cotizacion_listas

-- 3. Ver columnas de cotizacion_items
\d cotizacion_items

-- 4. Verificar indexes
SELECT * FROM pg_indexes 
WHERE tablename LIKE 'cotizacion%';

-- 5. Si todo está bien, no debería haber errors
SELECT * FROM cotizacion_listas LIMIT 1;
SELECT * FROM cotizacion_items LIMIT 1;
SELECT * FROM cotizacion_generada LIMIT 1;
SELECT * FROM cotizacion_envios LIMIT 1;
```

---

## 📊 COMANDOS ÚTILES PARA DEBUG

```bash
# Ver logs de npm
npm run dev 2>&1 | tee logs.txt

# Verificar conexión a BD
psql -U tu_usuario -d tu_bd -c "SELECT version();"

# Ver archivos subidos
dir public\uploads\cotizaciones

# Limpiar caché de Next.js
rm -r .next
npm run dev

# Reinstalar todas las dependencias
rm -r node_modules package-lock.json
npm install
```

---

## ✅ VERIFICACIÓN FINAL

Si pasaste TODOS los tests:
- ✅ Archivos creados
- ✅ Dependencias instaladas
- ✅ Base de datos migrada
- ✅ Carpeta de uploads existe
- ✅ Servidor inicia sin errores
- ✅ Página /cotizar-lista carga
- ✅ Panel /superAdmin/cotizaciones carga
- ✅ Puedo subir archivo
- ✅ Aparece en SuperAdmin
- ✅ Puedo buscar productos
- ✅ Puedo generar PDF
- ✅ Cliente puede descargar PDF

**¡INSTALACIÓN EXITOSA!** 🎉

---

## 🆘 ¿PROBLEMAS?

Si algo no funciona:

1. Revisa `MODULO_COTIZACIONES.md` para documentación completa
2. Revisa `INSTALACION_COTIZACIONES.md` para pasos detallados
3. Ejecuta todo de nuevo desde cero
4. Revisa logs en consola de npm run dev
5. Verifica permisos en carpetas
6. Verifica conectividad a BD

¡El módulo está listo para producción! 🚀
