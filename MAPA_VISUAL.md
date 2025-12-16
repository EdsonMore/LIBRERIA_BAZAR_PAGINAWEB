# 🗺️ MAPA VISUAL - CÓMO FUNCIONA TODO

---

## 🎯 ARQUITECTURA GENERAL

```
┌──────────────────────────────────────────────────────────┐
│                      USUARIOS                            │
├──────────────────────────────────────────────────────────┤
│   CLIENTE              SUPERADMIN           ADMIN        │
│      │                    │                   │          │
│      ▼                    ▼                   ▼          │
├──────────────────────────────────────────────────────────┤
│                   NEXT.JS FRONTEND                       │
│  /cotizar-lista  /superAdmin/cotizaciones  /admin/...   │
├──────────────────────────────────────────────────────────┤
│                   NODE.JS API ROUTES                     │
│  /api/upload      /api/cotizaciones/*     /api/auth/*   │
├──────────────────────────────────────────────────────────┤
│                      DATABASE                            │
│  cotizacion_listas  cotizacion_items  cotizacion_*       │
├──────────────────────────────────────────────────────────┤
│                     SERVICIOS                            │
│  text-extraction.ts  pdf-generator.ts   auth.ts   db.ts  │
├──────────────────────────────────────────────────────────┤
│                  ALMACENAMIENTO                          │
│  public/uploads/cotizaciones/  (PDFs y archivos)         │
└──────────────────────────────────────────────────────────┘
```

---

## 📁 ÁRBOL DE ARCHIVOS NUEVOS

```
project/
│
├─ 📂 app/
│  │
│  ├─ 🆕 cotizar-lista/
│  │  └─ page.tsx (Cliente: upload + historial)
│  │
│  ├─ 🆕 superadmin/cotizaciones/
│  │  └─ page.tsx (SuperAdmin: panel cotización)
│  │
│  ├─ 🔄 superadmin/layout.tsx (MODIFICADO: sidebar)
│  │
│  └─ 🆕 api/cotizaciones/
│     ├─ crear/route.ts
│     ├─ listar/route.ts
│     └─ [id]/
│        ├─ agregar-items/route.ts
│        ├─ buscar-producto/route.ts
│        ├─ generar-pdf/route.ts
│        └─ enviar/route.ts
│
├─ 🆕 app/api/upload/route.ts (Upload files)
│
├─ 📂 lib/
│  ├─ 🆕 text-extraction.ts (OCR + parsing)
│  └─ 🆕 pdf-generator.ts (PDF generation)
│
├─ 📂 public/
│  └─ 📂 uploads/
│     └─ 📂 cotizaciones/ (⭐ Archivos y PDFs aquí)
│
├─ 📂 scripts/
│  └─ 🆕 06_migration_cotizaciones_listas.sql (4 tablas)
│
└─ 📂 docs/ (Documentación)
   ├─ QUICK_START.md
   ├─ INSTALACION_COTIZACIONES.md
   ├─ VERIFICACION_INSTALACION.md
   ├─ MODULO_COTIZACIONES.md
   ├─ RESUMEN_FINAL.md
   ├─ PRE_PRODUCCION_CHECKLIST.md
   ├─ RESUMEN_VISUAL.md
   ├─ REFERENCIA_RAPIDA.md
   ├─ CARTA_DE_ENTREGA.md
   ├─ INDEX.md
   ├─ PASO_A_PASO_INSTALACION.md ← ESTE
   └─ TODO_ESTA_LISTO.md
```

---

## 🔄 FLUJO DE DATOS COMPLETO

```
┌────────────────┐
│   CLIENTE      │
│ /cotizar-lista │
└────────┬───────┘
         │
         ├─ 1. Selecciona archivo (PDF/IMG/WORD)
         │
         ├─ 2. Llena nombre + descripción
         │
         └─ 3. SUBMIT
            │
            ▼
    ┌──────────────────────┐
    │ Frontend Validation  │
    │ ├─ ¿PDF/IMG/WORD?   │
    │ ├─ ¿<10 MB?         │
    │ └─ ¿Campos llenos?   │
    └────────┬─────────────┘
             │
             ▼
    ┌──────────────────────────────────────┐
    │ POST /api/cotizaciones/crear         │
    │ + POST /api/upload                   │
    └────────┬─────────────────────────────┘
             │
             ▼
    ┌──────────────────────────────────────┐
    │ Backend: text-extraction.ts          │
    │ ├─ SI PDF → pdfjs-dist               │
    │ ├─ SI IMG → tesseract.js (OCR)       │
    │ └─ SI WORD → office-text-extractor   │
    └────────┬─────────────────────────────┘
             │
             ▼
    ┌──────────────────────────────────────┐
    │ Database: INSERT cotizacion_listas   │
    │ ├─ usuario_id                        │
    │ ├─ titulo                            │
    │ ├─ texto_extraido (OCR result)       │
    │ └─ estado = 'PENDIENTE'              │
    └────────┬─────────────────────────────┘
             │
             ▼
    ┌──────────────────────────────────────┐
    │ File Storage                         │
    │ public/uploads/cotizaciones/[id].pdf │
    └────────┬─────────────────────────────┘
             │
             ▼
┌────────────────────┐
│  CLIENTE           │
│ Ve: "Enviado" ✓    │
│ Estado: PENDIENTE  │
└────────────────────┘
     ↑
     │ (espera)
     │
     └────────────┐
                  │
                  ▼
        ┌──────────────────────┐
        │ SUPERADMIN           │
        │ /superAdmin/cotiz    │
        │ ├─ Ve lista          │
        │ ├─ Selecciona        │
        │ └─ Panel se abre     │
        └────────┬─────────────┘
                 │
                 ├─ 1. Busca producto
                 │
                 ▼
        ┌──────────────────────────────────┐
        │ GET /api/cotizaciones/[id]/      │
        │ buscar-producto?q=agua            │
        └────────┬─────────────────────────┘
                 │
                 ▼
        ┌──────────────────────────────────┐
        │ Database Query                    │
        │ SELECT * FROM producto            │
        │ WHERE nombre ILIKE '%agua%'       │
        └────────┬─────────────────────────┘
                 │
        ┌─ SI encontrado: Retorna precio
        │
        └─ SI NO encontrado: Vacío (ingresa manual)
                 │
                 ▼
        ┌──────────────────────────────────┐
        │ SuperAdmin: Agrega items         │
        │ ├─ Agua: 12 x $15 = $180         │
        │ ├─ Cuaderno: 24 x $8 = $192      │
        │ └─ TOTAL = $372 (CALCULADO)      │
        └────────┬─────────────────────────┘
                 │
                 ├─ 2. Click: "Generar PDF"
                 │
                 ▼
        ┌──────────────────────────────────┐
        │ POST /api/cotizaciones/[id]/     │
        │ generar-pdf                       │
        └────────┬─────────────────────────┘
                 │
                 ▼
        ┌──────────────────────────────────┐
        │ Backend: pdf-generator.ts        │
        │ ├─ Logo Tienda Bazar            │
        │ ├─ Tabla de items               │
        │ ├─ Total destacado              │
        │ └─ Footer con contacto          │
        └────────┬─────────────────────────┘
                 │
                 ▼
        ┌──────────────────────────────────┐
        │ Database: INSERT cotizacion_pdf  │
        │ ├─ archivo_pdf                  │
        │ ├─ total = 372                  │
        │ └─ estado = 'COTIZADO'          │
        └────────┬─────────────────────────┘
                 │
                 ▼
        ┌──────────────────────────────────┐
        │ SuperAdmin: "PDF generado" ✓     │
        │ ├─ Link para descargar           │
        │ └─ Estado actualizado            │
        └────────┬─────────────────────────┘
                 │
                 ▼
┌────────────────────────────────┐
│  CLIENTE                       │
│  /cotizar-lista                │
│  ├─ "Mis Cotizaciones"         │
│  ├─ Estado: COTIZADO ✓         │
│  ├─ Botón: Descargar PDF       │
│  └─ PDF profesional descargado │
└────────────────────────────────┘
```

---

## 🗄️ RELACIONES DE BASE DE DATOS

```
cotizacion_listas (Solicitud principal)
        │
        ├─ PK: id
        ├─ FK: usuario_id → usuario.id
        ├─ titulo: "Mi lista de útiles"
        ├─ archivo_original: "lista.pdf"
        ├─ texto_extraido: "agua, cuaderno, lápiz..."
        ├─ estado: 'PENDIENTE'
        └─ timestamps
        
        ├──────────────┬──────────────┐
        │              │              │
        ▼              ▼              ▼
        
cotizacion_items      cotizacion_generada   cotizacion_envios
(Productos)          (PDF generado)         (Auditoria)
├─ id                ├─ id                  ├─ id
├─ FK: cotizacion_id ├─ FK: cotizacion_id   ├─ FK: cotizacion_id
├─ nombre_producto   ├─ archivo_pdf         ├─ tipo_envio
├─ cantidad          ├─ total               ├─ destinatario
├─ precio_unitario   ├─ observaciones       ├─ fecha_envio
└─ subtotal          └─ fecha_generacion    └─ estado_envio
```

---

## 📡 ENDPOINTS API

```
                /api/cotizaciones/
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
    crear/          listar/         upload/
    POST            GET             POST
    │               │               │
    ├─ Crea         ├─ Mis           ├─ Valida
    │  cotizacion   │  cotizaciones  │  archivo
    │  en BD        │  (filtrado     ├─ Guarda
    └─ status 201  │   por usuario)  └─ Retorna
                   └─ status 200       ruta
                        
                   /api/cotizaciones/[id]/
                           │
        ┌──────────┬────────┼────────┬──────────┐
        │          │        │        │          │
        ▼          ▼        ▼        ▼          ▼
        
   agregar-items/  buscar-producto/  generar-pdf/  enviar/
   POST/GET        GET               POST          POST
   │               │                 │             │
   ├─ CRUD items   ├─ Busca en       ├─ Genera    ├─ Registra
   ├─ Retorna      │  producto.tabla │  PDF       │  envío
   │  items        ├─ Retorna precio ├─ Guarda    │  (EMAIL/
   └─ status 200  │  si existe       │  PDF       │   WHATSAPP/
                  └─ status 200     ├─ UPDATE     │   DESCARGA)
                                     │  estado     └─ status 200
                                    └─ status 200
```

---

## 🎨 INTERFAZ - WHAT YOU SEE

```
┌─────────────────────────────────────────────────┐
│ TIENDA BAZAR                                    │
├─────────────────────────────────────────────────┤
│ [Logo] | Inicio | Productos | 📋 Cotizar Lista │
└─────────────────────────────────────────────────┘
           ↑
           └─ Nuevo link aquí para clientes
           
           
┌────────────────────────────────────────────┐
│          /cotizar-lista (CLIENTE)          │
├────────────────────────────────────────────┤
│ Tab1: Nueva Cotización │ Tab2: Mis Cot... │
├────────────────────────────────────────────┤
│                                            │
│ Arrastra PDF/Imagen/Word aquí              │
│     [DRAG AND DROP AREA]                   │
│                                            │
│ Nombre: [_________________]                │
│ Descripción: [_________________]           │
│                                            │
│     [ ENVIAR A COTIZAR ]                   │
│                                            │
├────────────────────────────────────────────┤
│ Mis Cotizaciones:                         │
│ └─ "Lista de útiles" - PENDIENTE          │
└────────────────────────────────────────────┘


┌────────────────────────────────────────────┐
│  /superAdmin/cotizaciones (SUPERADMIN)    │
├────────────────────────────────────────────┤
│ ┌─ SIDEBAR ─┐ ┌─ PANEL COTIZACIÓN ─────┐ │
│ │ Dashboard │ │ Solicitud Pendiente:    │ │
│ │ Usuarios  │ │                         │ │
│ │ Productos │ │ Texto extraído: agua,   │ │
│ │ Categorías│ │ cuaderno, ...           │ │
│ │ Compras   │ │                         │ │
│ │*Cotizac*  │ │ Buscar Producto:        │ │
│ │ Roles     │ │ [agua_______] [BUSCAR]  │ │
│ │           │ │                         │ │
│ │           │ │ Items agregados:        │ │
│ │           │ │ 12x Agua $15 = $180     │ │
│ │           │ │ 24x Cuaderno $8 = $192  │ │
│ │           │ │                         │ │
│ │           │ │ TOTAL: $372             │ │
│ │           │ │                         │ │
│ │           │ │ [ GENERAR PDF ]         │ │
│ └───────────┘ └─────────────────────────┘ │
└────────────────────────────────────────────┘
```

---

## 🔐 SEGURIDAD - VALIDACIONES

```
┌──────────────────────────────────────────┐
│         CLIENT-SIDE VALIDATION           │
├──────────────────────────────────────────┤
│ 1. ¿Archivo seleccionado?                │
│ 2. ¿Es PDF/IMG/WORD?                     │
│ 3. ¿<10 MB?                              │
│ 4. ¿Nombre completado?                   │
│ └─ Si TODO ok → Envía al servidor        │
└──────────────────────────────────────────┘
           ↓
┌──────────────────────────────────────────┐
│        SERVER-SIDE VALIDATION            │
├──────────────────────────────────────────┤
│ 1. ¿Usuario autenticado?                 │
│ 2. ¿MIME type válido?                    │
│ 3. ¿Tamaño <10 MB?                       │
│ 4. ¿Nombre no vacío?                     │
│ 5. ¿Carpeta de uploads existe?           │
│ └─ Si TODO ok → Procesa y guarda         │
└──────────────────────────────────────────┘
           ↓
┌──────────────────────────────────────────┐
│        ALMACENAMIENTO SEGURO             │
├──────────────────────────────────────────┤
│ 1. Renombra archivo (ID único)           │
│ 2. Guarda en public/uploads/             │
│ 3. Registra en BD con usuario_id         │
│ 4. Cliente solo ve sus archivos          │
│ 5. SuperAdmin ve todos (rol check)       │
└──────────────────────────────────────────┘
```

---

## ⏱️ TIMINGS

```
CLIENTE
  Upload: <1 seg
  Ver lista: <1 seg
  Descargar: <1 seg

SUPERADMIN
  Buscar producto: <1 seg (DB indexed)
  Generar PDF: 3-5 seg

OCR (Tesseract)
  Primera vez: ~2 min (descarga modelo)
  Siguientes: <30 seg

API Response
  POST /crear: <200 ms
  GET /listar: <200 ms
  GET /buscar-producto: <100 ms
  POST /generar-pdf: 3-5 seg
```

---

## 📊 ESTADOS Y TRANSICIONES

```
┌──────────┐
│ PENDIENTE│ ← Cliente sube archivo
└────┬─────┘
     │ SuperAdmin selecciona
     ▼
┌──────────────┐
│EN_COTIZACION│ ← SuperAdmin trabaja
└────┬────────┘
     │ SuperAdmin genera PDF
     ▼
┌──────────┐
│ COTIZADO │ ← Cliente puede descargar
└────┬─────┘
     │ SuperAdmin/Cliente envía
     ▼
┌──────────┐
│ ENVIADO  │ ← Registro de auditoría
└──────────┘
```

---

## 🎯 RESUMEN VISUAL

```
HERRAMIENTA DE COTIZACIÓN DE ÚTILES
│
├─ CLIENTE
│  ├─ Upload archivo (PDF/IMG/WORD)
│  ├─ Sistema extrae texto (OCR)
│  ├─ Ve en historial (PENDIENTE)
│  ├─ Espera a SuperAdmin
│  ├─ Ve estado cambiar (COTIZADO)
│  └─ Descarga PDF profesional
│
├─ SUPERADMIN
│  ├─ Ve solicitud pendiente
│  ├─ Busca productos en BD
│  ├─ Auto-llena precio o ingresa manual
│  ├─ Calcula total automático
│  ├─ Genera PDF con 1 click
│  └─ Marca como COTIZADO
│
└─ SISTEMA
   ├─ OCR: pdfjs, tesseract, office-extractor
   ├─ PDF: jspdf + jspdf-autotable
   ├─ BD: 4 tablas con relaciones
   ├─ Storage: public/uploads/cotizaciones/
   └─ Seguridad: Validaciones server-side
```

---

**Este es el mapa completo de cómo funciona todo.** 🗺️

¿Preguntas sobre arquitectura? Revisar este archivo. 📖
