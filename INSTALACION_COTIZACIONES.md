# 🚀 INSTALACIÓN Y CONFIGURACIÓN DEL MÓDULO DE COTIZACIONES

## ⚡ PASOS DE INSTALACIÓN

### 1️⃣ ACTUALIZAR DEPENDENCIAS

```bash
cd c:\Users\Lenovo Core i7\Documents\PROYECTOS\licoreria-app
npm install
```

Las siguientes librerías se agregaron a `package.json`:
- `jspdf-autotable` - Tablas en PDFs
- `pdfjs-dist` - Lectura de PDFs
- `tesseract.js` - OCR para imágenes
- `office-text-extractor` - Extracción de texto en Word

### 2️⃣ EJECUTAR MIGRACIÓN DE BASE DE DATOS

```bash
# Con psql
psql -U tu_usuario -d nombre_bd < scripts/06_migration_cotizaciones_listas.sql

# O ejecutar SQL manualmente desde tu cliente SQL
# Abrir: scripts/06_migration_cotizaciones_listas.sql
# Copiar y ejecutar
```

**Tablas creadas:**
- `cotizacion_listas` - Solicitudes principales
- `cotizacion_items` - Productos en cada cotización
- `cotizacion_generada` - PDFs y totales guardados
- `cotizacion_envios` - Registro de envíos

### 3️⃣ CREAR CARPETA DE UPLOADS

```bash
# Windows (PowerShell)
New-Item -Path "public/uploads/cotizaciones" -ItemType Directory -Force

# Linux/Mac
mkdir -p public/uploads/cotizaciones
chmod 755 public/uploads/cotizaciones
```

### 4️⃣ VERIFICAR ARCHIVOS CREADOS

```bash
# Verificar que estos archivos existan:
✅ app/cotizar-lista/page.tsx
✅ app/superadmin/cotizaciones/page.tsx
✅ app/api/cotizaciones/crear/route.ts
✅ app/api/cotizaciones/listar/route.ts
✅ app/api/cotizaciones/[id]/agregar-items/route.ts
✅ app/api/cotizaciones/[id]/buscar-producto/route.ts
✅ app/api/cotizaciones/[id]/generar-pdf/route.ts
✅ app/api/cotizaciones/[id]/enviar/route.ts
✅ app/api/upload/route.ts
✅ lib/text-extraction.ts
✅ lib/pdf-generator.ts
✅ scripts/06_migration_cotizaciones_listas.sql
```

### 5️⃣ REINICIAR SERVIDOR

```bash
npm run dev
```

El servidor debe reiniciarse sin errores. Si hay errores, revisa:
- ¿Las librerías se instalaron? (`npm list jspdf-autotable`)
- ¿Las tablas se crearon? (Conecta a BD y verifica)
- ¿Existen los permisos en `public/uploads/cotizaciones`?

---

## ✅ VERIFICAR QUE TODO FUNCIONA

### 1. Acceso Cliente
```
1. Registra un usuario nuevo
2. Logueate como cliente
3. En navbar, debería ver "📋 Cotizar Lista"
4. Haz clic y vé a /cotizar-lista
```

### 2. Acceso SuperAdmin
```
1. Logueate como SuperAdmin
2. En el panel, debería ver "Cotizaciones" en sidebar
3. Haz clic y vé a /superAdmin/cotizaciones
```

### 3. Prueba de Flujo Completo
```
1. Como CLIENTE:
   - Sube un PDF/Imagen con lista
   - Verifica que aparezca en "Mis Cotizaciones"

2. Como SUPERADMIN:
   - Ve en panel "Solicitudes Pendientes"
   - Selecciona la cotización
   - Busca un producto en BD
   - Agrega manualmente si no encuentra
   - Genera PDF
   - Verifica que se descargue

3. Vuelve como CLIENTE:
   - Debería ver el estado "COTIZADO"
   - Debería poder descargar el PDF
```

---

## ⚙️ CONFIGURACIONES OPCIONALES

### Habilitar Envío por Email

En `.env.local`, agregar:
```
# SendGrid (recomendado)
SENDGRID_API_KEY=tu_api_key_aqui

# O usar Resend
RESEND_API_KEY=tu_api_key_aqui
```

Luego implementar en `/app/api/cotizaciones/[id]/enviar/route.ts`:
```typescript
// Descomentar la sección de EMAIL
case 'EMAIL':
  await enviarEmailCotizacion(correo, pdfUrl)
  break
```

### Habilitar Compartir WhatsApp

```typescript
// El sistema genera automáticamente:
const enlace = `${process.env.NEXT_PUBLIC_APP_URL}/cotizaciones/ver/${id}`
const mensaje = `Mi cotización está lista! ${enlace}`
const whatsappLink = `https://wa.me/?text=${encodeURIComponent(mensaje)}`
```

### Cambiar Colores del PDF

En `lib/pdf-generator.ts`, línea ~18:
```typescript
const colorPrimario = [102, 126, 234] // #667eea - CAMBIAR AQUÍ
```

---

## 🔍 TROUBLESHOOTING

### Error: "Module not found: jspdf"
**Solución:**
```bash
npm install jspdf jspdf-autotable pdfjs-dist tesseract.js office-text-extractor
npm run dev
```

### Error: "relation 'cotizacion_listas' does not exist"
**Solución:**
- Ejecutar script SQL: `scripts/06_migration_cotizaciones_listas.sql`
- Verificar que la BD existe y tienes permisos

### Error: "ENOENT: no such file or directory, open 'public/uploads/cotizaciones'"
**Solución:**
```bash
mkdir -p public/uploads/cotizaciones
chmod 755 public/uploads/cotizaciones
```

### Tesseract.js lento para OCR
**Nota:** La primera ejecución descarga el modelo de lenguaje (~180 MB)
- Solo ocurre una vez
- Luego es más rápido

---

## 📱 RUTAS DISPONIBLES

### Para Clientes (logueado)
- `GET /cotizar-lista` - Crear nueva cotización + historial

### Para SuperAdmin
- `GET /superAdmin/cotizaciones` - Panel de cotizaciones

### Para PDF descargable
- `GET /uploads/cotizaciones/{archivo}.pdf` - Descargar PDF

### APIs (internas)
- `POST /api/upload` - Subir archivo
- `POST /api/cotizaciones/crear` - Crear cotización
- `GET /api/cotizaciones/listar` - Listar cotizaciones
- `POST /api/cotizaciones/[id]/agregar-items` - Agregar productos
- `GET /api/cotizaciones/[id]/agregar-items` - Obtener items
- `GET /api/cotizaciones/[id]/buscar-producto` - Buscar en BD
- `POST /api/cotizaciones/[id]/generar-pdf` - Generar PDF
- `POST /api/cotizaciones/[id]/enviar` - Registrar envío

---

## 📊 BASE DE DATOS - EJEMPLOS

### Ver cotizaciones pendientes
```sql
SELECT * FROM cotizacion_listas WHERE estado = 'PENDIENTE';
```

### Ver todos los items de una cotización
```sql
SELECT * FROM cotizacion_items WHERE cotizacion_id = 1;
```

### Ver cotizaciones completadas con total
```sql
SELECT cl.titulo, u.nombres, cg.total, cg.fecha_generacion
FROM cotizacion_listas cl
JOIN cotizacion_generada cg ON cl.id = cg.cotizacion_id
JOIN usuario u ON cl.usuario_id = u.id
WHERE cl.estado = 'COTIZADO';
```

---

## 🎯 PRÓXIMOS PASOS OPCIONALES

1. **Email automático**: Configurar SendGrid/Resend para enviar PDF por email
2. **WhatsApp Bot**: Integrar Twilio para enviar por WhatsApp
3. **QR en PDF**: Agregar código QR para descargar desde móvil
4. **Notificaciones**: Agregar notificaciones en tiempo real
5. **Estadísticas**: Dashboard con análisis de cotizaciones
6. **Múltiples archivos**: Permitir subir varias imágenes

---

## ✨ ¡LISTO!

El módulo está completamente funcional. Puede:
- ✅ Clientes suben listas (PDF/Imagen/Word)
- ✅ SuperAdmin cotiza automáticamente desde BD
- ✅ Ingresa precios manualmente si falta producto
- ✅ Genera PDF profesional
- ✅ Descarga/Comparte PDF

**¡Sin romper nada del proyecto!** 🚀
