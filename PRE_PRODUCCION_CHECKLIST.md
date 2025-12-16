# 🚀 PRE-PRODUCCIÓN CHECKLIST

**Antes de lanzar la campaña de útiles, verifica estos puntos.**

---

## ✅ INSTALACIÓN Y CONFIGURACIÓN

### Dependencias
- [ ] `npm install jspdf jspdf-autotable pdfjs-dist tesseract.js office-text-extractor`
- [ ] `npm list jspdf` (verificar que está)
- [ ] `npm list tesseract.js` (verificar que está)

### Base de Datos
- [ ] Ejecuté migración: `scripts/06_migration_cotizaciones_listas.sql`
- [ ] Conecté a BD y verifiqué tablas: `SELECT * FROM cotizacion_listas;`
- [ ] Tablas tienen datos de prueba (opcional)

### Carpetas
- [ ] `mkdir -p public/uploads/cotizaciones` creada
- [ ] Permisos correctos: `chmod 755 public/uploads/cotizaciones`

### Servidor
- [ ] `npm run dev` inicia sin errores
- [ ] No hay mensajes de `Module not found`
- [ ] No hay mensajes de `Cannot find table`

---

## 🎨 VERIFICACIONES DE UX

### Cliente - Página de Cotización
- [ ] `/cotizar-lista` carga sin 404
- [ ] Puedo hacer drag-and-drop de archivo
- [ ] Validación rechaza archivos grandes (>10MB)
- [ ] Validación rechaza tipos incorrectos (no PDF/imagen/Word)
- [ ] Puedo ingresar nombre y descripción
- [ ] Botón "Enviar a Cotizar" funciona
- [ ] Veo mensaje "Cotización enviada"
- [ ] La cotización aparece en "Mis Cotizaciones" con estado PENDIENTE

### SuperAdmin - Panel de Cotizaciones
- [ ] `/superAdmin/cotizaciones` carga sin 404
- [ ] Veo sidebar con "Cotizaciones" en menú
- [ ] Lista muestra cotizaciones pendientes
- [ ] Puedo seleccionar una cotización
- [ ] Panel derecho muestra el formulario
- [ ] Puedo buscar productos por nombre
- [ ] Si existe → muestra precio automáticamente
- [ ] Si NO existe → puedo ingresar precio manual
- [ ] Contador de items se actualiza
- [ ] Total se calcula automáticamente
- [ ] Puedo agregar observaciones
- [ ] Botón "Generar Cotización" funciona

### PDF - Generación y Descarga
- [ ] PDF se genera sin errores
- [ ] PDF tiene logo/branding de "Tienda Bazar"
- [ ] Tabla de productos está bien formateada
- [ ] Precios y cantidades son correctos
- [ ] Total está prominente
- [ ] Footer tiene contacto de la empresa
- [ ] PDF es descargable desde cliente
- [ ] PDF se guarda en `public/uploads/cotizaciones/`

### Navegación
- [ ] Navbar muestra "📋 Cotizar Lista" para clientes
- [ ] Sidebar SuperAdmin tiene "Cotizaciones"
- [ ] Puedo navegar sin 404s
- [ ] Breadcrumbs o indicadores de ubicación son claros

---

## 🔒 SEGURIDAD

### Validaciones Server-Side
- [ ] Upload valida MIME type en servidor
- [ ] Upload valida tamaño en servidor (max 10MB)
- [ ] Upload rechaza ejecutables
- [ ] Rutas API requieren autenticación
- [ ] Cliente solo ve sus cotizaciones
- [ ] SuperAdmin solo ve todas las cotizaciones

### Base de Datos
- [ ] Contraseñas están hasheadas (no en texto plano)
- [ ] Conexión usa SSL (si está en producción)
- [ ] Backups automáticos están configurados
- [ ] Permisos de carpeta son 755 (no 777)

### Archivos
- [ ] No hay archivos sensibles en `public/`
- [ ] PDFs generados no contienen datos de otros usuarios
- [ ] Uploads se guardan fuera del web root si es posible
- [ ] No hay acceso directo a tokens en URL

---

## ⚡ PERFORMANCE

### Velocidad de Carga
- [ ] `/cotizar-lista` carga en <2 segundos
- [ ] `/superAdmin/cotizaciones` carga en <2 segundos
- [ ] PDF se genera en <5 segundos
- [ ] Búsqueda de productos responde en <1 segundo

### Optimizaciones
- [ ] Imágenes están comprimidas
- [ ] CSS está minificado
- [ ] JavaScript está minificado
- [ ] Caché está habilitado

### OCR
- [ ] Tesseract funciona (primera vez: ~2 min, luego: <30 seg)
- [ ] Se pueden extraer palabras desde PDF correctamente
- [ ] Se pueden extraer palabras desde imágenes correctamente
- [ ] Se pueden extraer palabras desde Word correctamente

---

## 🧪 TESTING

### Flujo Cliente
- [ ] Registro → Login → Cotizar → Upload → Ves estado PENDIENTE
- [ ] Esperar a que SuperAdmin cotice
- [ ] Ver estado cambiar a COTIZADO
- [ ] Descargar PDF

### Flujo SuperAdmin
- [ ] Ver cotizaciones pendientes
- [ ] Seleccionar una
- [ ] Buscar "agua" → Aparece con precio
- [ ] Agregar 2 botellas
- [ ] Buscar "producto inexistente" → No aparece
- [ ] Ingresar manual: "Producto especial" - $50
- [ ] Ver total se actualiza
- [ ] Generar PDF

### Casos Extremos
- [ ] Subir archivo con miles de productos (no crashea)
- [ ] Subir imagen de baja calidad (OCR lo intenta)
- [ ] Subir PDF escaneeado (OCR funciona)
- [ ] Buscar producto con caracteres especiales (ñ, acentos)
- [ ] Ingresar precio muy grande ($999,999.99)
- [ ] Ingresar precio en 0
- [ ] Agregar 0 items (no permite generar PDF)

### Multibrowser
- [ ] Chrome - funciona
- [ ] Firefox - funciona
- [ ] Safari - funciona
- [ ] Edge - funciona
- [ ] Mobile (responsive) - funciona

---

## 📊 DATOS Y ESTADÍSTICAS

### BD - Datos Iniciales
- [ ] Tabla `cotizacion_listas` está vacía (o con datos de test)
- [ ] Tabla `cotizacion_items` está vacía
- [ ] Tabla `cotizacion_generada` está vacía
- [ ] Tabla `cotizacion_envios` está vacía
- [ ] Índices están creados para performance

### Limpieza
- [ ] Eliminé archivos de prueba de `public/uploads/`
- [ ] Limpiés datos de test de BD
- [ ] No hay logs innecesarios en console
- [ ] No hay `console.log` de debug en código

---

## 📱 BRANDING Y DISEÑO

### Tienda Bazar
- [ ] Logo aparece en PDFs
- [ ] Colores primarios (#667eea, #764ba2) son consistentes
- [ ] Email de contacto es correcto: info@tiendabazar.com
- [ ] Nombre en navbar es "Tienda Bazar"
- [ ] Nombre en footer es "Tienda Bazar"

### UI/UX
- [ ] Colores son legibles
- [ ] Tipografía es profesional
- [ ] Espaciado es consistente
- [ ] Botones tienen estados (hover, active, disabled)
- [ ] Loading states están visibles
- [ ] Error messages son claros

---

## 📞 COMUNICACIÓN

### Mensajes de Éxito
- [ ] "Cotización enviada" es claro
- [ ] "PDF generado exitosamente" es claro
- [ ] Estados (PENDIENTE, COTIZADO, etc) son claros

### Mensajes de Error
- [ ] "Archivo muy grande" - mensaj claro
- [ ] "Formato no soportado" - mensaje claro
- [ ] "Error al generar PDF" - mensaje claro
- [ ] Errores no exponen stack traces al usuario

### Email (Opcional)
- [ ] Email de confirmación se envía cuando cliente sube
- [ ] Email de notificación se envía cuando PDF está listo
- [ ] Email tiene logo y branding
- [ ] Email incluye link para descargar

---

## 🆘 TROUBLESHOOTING

### Si algo no funciona:
- [ ] Ejecuté `verify-installation.ps1` (Windows) o `.sh` (Linux)
- [ ] Reinicié servidor: `npm run dev`
- [ ] Limpié caché: `rm -r .next`
- [ ] Revisé logs en consola
- [ ] Revisé BD: todas las tablas existen
- [ ] Revisé permisos: `public/uploads/` es escribible

---

## 📚 DOCUMENTACIÓN

- [ ] `QUICK_START.md` está disponible
- [ ] `INSTALACION_COTIZACIONES.md` está disponible
- [ ] `MODULO_COTIZACIONES.md` está disponible
- [ ] `VERIFICACION_INSTALACION.md` está disponible
- [ ] `RESUMEN_FINAL.md` está disponible
- [ ] `INDEX.md` está disponible

---

## 🚀 DEPLOYMENT

### Antes de Producción
- [ ] `npm run build` funciona sin errores
- [ ] No hay warnings en build
- [ ] Tamaño de bundle es razonable

### Producción
- [ ] Variables de entorno están configuradas
- [ ] Database URL apunta a BD de producción
- [ ] Carpeta `public/uploads` tiene permisos correctos
- [ ] Backups de BD están configurados
- [ ] SSL está habilitado
- [ ] CDN está configurado (si es posible)

### Monitoreo
- [ ] Error tracking (Sentry, etc) está configurado
- [ ] Logs están siendo guardados
- [ ] Alertas de errores están activas
- [ ] Puedo monitorear uso de servidor

---

## ✅ VERIFICACIÓN FINAL

Antes de lanzar:

```bash
# 1. Todas las verificaciones pasaron
./verify-installation.ps1

# 2. Build funciona
npm run build

# 3. No hay errores en consola
npm run dev

# 4. Puedo acceder a ambas páginas
# http://localhost:3000/cotizar-lista
# http://localhost:3000/superAdmin/cotizaciones

# 5. Puedo hacer un flujo completo sin errores
```

---

## 📋 CHECKLIST FINAL

- [ ] 0 warnings en instalación
- [ ] 0 errores en build
- [ ] 0 errores en npm run dev
- [ ] Todas las pruebas funcionales pasaron
- [ ] BD está funcionando
- [ ] Permisos de carpetas son correctos
- [ ] PDFs se generan correctamente
- [ ] OCR funciona
- [ ] Cliente puede subir y descargar
- [ ] SuperAdmin puede cotizar
- [ ] UI se ve profesional
- [ ] Documentación está completa
- [ ] No hay datos de prueba en producción

---

## 🎉 ¡LISTO PARA LANZAR!

Si todas las casillas están marcadas, **estás 100% listo para la campaña de útiles** 🚀

---

## 🆘 EMERGENCIAS

Si algo falla en producción:

1. **Verificá logs**: `npm run dev`
2. **Revisá BD**: `psql -U user -d db -c "SELECT * FROM cotizacion_listas;"`
3. **Limpiá caché**: `rm -r .next`
4. **Reiniciá servidor**: `npm run dev`
5. **Si nada funciona**: Volvé a ejecutar SQL migration

---

**Buena suerte con la campaña!** 🎓📚

Fecha: 2024  
Estado: ✅ LISTA PARA PRODUCCIÓN
