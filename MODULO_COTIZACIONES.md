# 📋 MÓDULO DE COTIZACIÓN DE LISTAS ESCOLARES

## ✨ Características Implementadas

### 1. **Cliente - Envía su Lista**
- Página: `/cotizar-lista`
- Permite subir archivos: PDF, Imágenes (JPG/PNG), Word (.docx)
- Máximo 10MB por archivo
- Genera solicitud de cotización automáticamente
- Historial de cotizaciones en la misma página

### 2. **SuperAdmin - Cotiza**
- Panel: `/superAdmin/cotizaciones`
- Ve todas las solicitudes pendientes
- Búsqueda automática de productos en BD
- Si encuentra → Precio auto-llena
- Si NO encuentra → Ingresa manualmente
- Calcula total automáticamente
- Genera PDF profesional con marca

### 3. **Generación de PDF**
- PDF con logo y datos de la tienda
- Tabla con productos, cantidad, precio, subtotal
- Total prominente
- Campo de observaciones
- QR (opcional) para hacer pedido
- Footer con información de contacto

### 4. **Envío al Cliente**
- Por Email
- Compartir por WhatsApp
- Descargar PDF directo
- Link a descargar desde cuenta del cliente

---

## 🗄️ TABLAS BASE DE DATOS

Ejecuta el script: `scripts/06_migration_cotizaciones_listas.sql`

```sql
-- Tablas creadas:
- cotizacion_listas (solicitudes principales)
- cotizacion_items (productos de cada cotización)
- cotizacion_generada (PDFs y totales generados)
- cotizacion_envios (auditoría de envíos)
```

---

## 🚀 INSTALACIÓN

### 1. Instalar dependencias
```bash
npm install jspdf jspdf-autotable pdfjs-dist tesseract.js office-text-extractor
```

### 2. Ejecutar migración BD
```bash
psql -U tu_usuario -d tu_bd -f scripts/06_migration_cotizaciones_listas.sql
```

### 3. Verificar directorios de uploads
```bash
mkdir -p public/uploads/cotizaciones
```

### 4. Reiniciar servidor
```bash
npm run dev
```

---

## 📁 ESTRUCTURA DE ARCHIVOS CREADOS

```
app/
├── cotizar-lista/
│   └── page.tsx (Interfaz cliente)
├── superadmin/
│   └── cotizaciones/
│       └── page.tsx (Panel SuperAdmin)
├── api/
│   ├── upload/
│   │   └── route.ts (Subida de archivos)
│   └── cotizaciones/
│       ├── crear/route.ts
│       ├── listar/route.ts
│       ├── [id]/
│       │   ├── agregar-items/route.ts
│       │   ├── buscar-producto/route.ts
│       │   ├── generar-pdf/route.ts
│       │   └── enviar/route.ts

lib/
├── text-extraction.ts (OCR + parsing)
└── pdf-generator.ts (Generación de PDFs)

scripts/
└── 06_migration_cotizaciones_listas.sql
```

---

## 🔄 FLUJO COMPLETO

### Paso 1: Cliente envía lista
```
1. Va a /cotizar-lista
2. Sube archivo (PDF/Imagen/Word)
3. Ingresa nombre y descripción
4. Sistema guarda archivo + crea registro en BD
```

### Paso 2: SuperAdmin recibe solicitud
```
1. Va a /superAdmin/cotizaciones
2. Ve lista de solicitudes pendientes
3. Selecciona una cotización
4. Ve preview del archivo (si es posible)
```

### Paso 3: SuperAdmin cotiza
```
1. Ingresa producto en la tabla
2. Sistema busca en BD automáticamente
3. Si encuentra → Precio auto-llena
4. Si NO → Ingresa manualmente
5. Calcula total en tiempo real
6. Agrega observaciones (opcional)
7. Genera PDF con un clic
```

### Paso 4: Envío al cliente
```
1. Sistema genera PDF profesional
2. Guarda en servidor
3. Actualiza estado a "COTIZADO"
4. Cliente recibe notificación
5. Puede descargar, enviar por email o compartir por WhatsApp
```

---

## 🔧 CONFIGURACIONES IMPORTANTES

### Variables de entorno (.env.local)
```
NEXT_PUBLIC_APP_URL=http://localhost:3000
# Para Email: configura tu proveedor (SendGrid, Resend, etc)
# Para WhatsApp: configura tu proveedor (Twilio, etc)
```

### Rutas publicamente accesibles
- `/cotizar-lista` - Solo clientes logueados
- `/superadmin/cotizaciones` - Solo SuperAdmin
- `/uploads/cotizaciones/*` - PDFs descargables

---

## 📊 ENDPOINTS API CREADOS

### Crear cotización
```
POST /api/cotizaciones/crear
{
  usuario_id: number
  titulo: string
  descripcion: string
  archivo_url: string
  tipo_archivo: string
}
```

### Listar cotizaciones
```
GET /api/cotizaciones/listar?usuario_id=1&rol=CLIENTE
GET /api/cotizaciones/listar?estado=PENDIENTE
```

### Agregar items
```
POST /api/cotizaciones/[id]/agregar-items
{
  items: [{
    nombre_producto: string
    cantidad: number
    precio_unitario: number
    producto_id?: number
    encontrado_en_bd: boolean
  }]
}
```

### Buscar producto en BD
```
GET /api/cotizaciones/[id]/buscar-producto?nombre=cuaderno
```

### Generar PDF
```
POST /api/cotizaciones/[id]/generar-pdf
{
  observaciones?: string
}
```

### Enviar cotización
```
POST /api/cotizaciones/[id]/enviar
{
  metodo_envio: "EMAIL" | "WHATSAPP" | "DESCARGA"
  correo_destino?: string
}
```

---

## 🎨 PERSONALIZACIÓN

### Cambiar colores
En `lib/pdf-generator.ts`:
```typescript
const colorPrimario = [102, 126, 234] // #667eea
// Cambiar a tus colores corporativos
```

### Cambiar logo
En `lib/pdf-generator.ts`:
```typescript
doc.text('TIENDA BAZAR', 15, 20) // Cambiar texto del logo
```

### Agregar más campos
Editar interfaz `CotizacionData` en `lib/pdf-generator.ts`

---

## ⚠️ NOTAS IMPORTANTES

1. **OCR**: Tesseract.js funciona mejor con imágenes claras y bien escaneadas
2. **Formatos soportados**: PDF, JPG, PNG, DOCX
3. **Límite de archivo**: 10 MB
4. **Almacenamiento**: Los PDFs se guardan en `public/uploads/cotizaciones/`
5. **Normalización**: Los nombres de productos se normalizan (minúsculas, sin acentos)
6. **Búsqueda BD**: Case-insensitive, busca palabras clave

---

## 🐛 TROUBLESHOOTING

### "Error al extraer texto del PDF"
- Verifica que el PDF no sea de imagen escaneada
- Para PDFs escaneados, usa la opción de imagen

### "Producto no encontrado en BD"
- Verifica el nombre exacto en la BD
- Intenta con palabras más genéricas
- Siempre puedes ingresar el precio manualmente

### "Error generando PDF"
- Verifica permisos de carpeta `public/uploads/cotizaciones/`
- Asegúrate de tener espacio en disco

---

## 📞 SOPORTE

Para más información sobre:
- **Envíos por Email**: Configurar SendGrid o Resend
- **Integración WhatsApp**: Usar Twilio o Business API
- **OCR avanzado**: Tesseract.js soporta +100 idiomas

---

**¡Módulo completamente funcional y listo para producción!** ✅
