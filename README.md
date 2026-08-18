# Tienda Bazar - Aplicación Web

Plataforma de comercio electrónico y gestión comercial de **Tienda Bazar**, construida con Next.js (App Router). Incluye tienda en línea para clientes, paneles de administración con distintos roles, punto de venta (POS) con escáner de código de barras, gestión de deudas, cotizaciones escolares con OCR y emisión de boletas en PDF.

## Características principales

### Tienda en línea (clientes)
- Catálogo de productos con categorías, búsqueda y filtros
- Carrito de compras sincronizado con la base de datos
- Checkout con cálculo de IGV y envío configurables
- Pago con YAPE/PLIN (QR) o contra entrega, con subida de comprobante
- Compras con 7 estados y seguimiento (código `ORD-...`)
- Emisión de **boletas** con descarga en PDF
- Reseñas y calificaciones de productos (aprobadas por administración)
- Notificaciones por usuario
- Libro de reclamaciones (genera expediente `EXP-YYYY-xxxxxx`)
- Página de contacto y términos y condiciones
- App Web Progresiva (PWA) con instalación en el dispositivo

### Punto de venta (POS)
- Registro de ventas manuales con escáner de código de barras (`html5-qrcode` + `BarcodeDetector`)
- Creación rápida de productos desde el escáner
- Ventas con pago parcial inicial y generación de deuda
- Métodos de pago: Efectivo, YAPE, PLIN, Transferencia, Otro

### Gestión de deudas
- Deudas pendientes por cliente con filtros y totales
- Registro de pagos parciales o totales
- Cancelación/condonación de deudas con historial
- Resumen de deudas exportable por WhatsApp
- Historial de pagos por método y por venta

### Cotizaciones escolares
- Carga de listas escolares (imagen, PDF o Word)
- **OCR** para extraer productos (`tesseract.js`, `pdfjs-dist`, `mammoth`)
- Coincidencia automática con el catálogo
- Generación de PDF de cotización con marca Tienda Bazar
- Envío por email, WhatsApp o descarga

### Gestión y reportes (Super Admin)
- Dashboard con métricas y gráficos (`recharts`)
- Gestión de usuarios, roles y permisos por rol
- Reportes de ventas: diarias por vendedor, ingresos por propietario, productos más vendidos y métodos de pago
- Registro de productos solicitados (no catálogo) y buscados (prioridad de compra)
- Configuración del sistema (IGV y costo de envío)

## Tecnologías

- **Next.js 16** (App Router) con **React 19** y **TypeScript**
- **PostgreSQL** como base de datos (conector `pg`)
- **Tailwind CSS 4** + **shadcn/ui** (Radix UI primitives)
- **bcryptjs** para hash de contraseñas (10 rondas)
- Sesiones mediante cookie HTTP-only (sin JWT)
- `swr`, `react-hook-form`, `zod`, `recharts`, `sonner`, `lucide-react`
- PDF: `jspdf`, `jspdf-autotable`, `pdfjs-dist`
- OCR: `tesseract.js`, `mammoth`, `sharp`
- Escáner de códigos: `html5-qrcode`

## Requisitos

- Node.js 18+
- PostgreSQL 12+
- pnpm, npm o yarn

## Variables de Entorno

Crear un archivo `.env.local` en la raíz del proyecto:

```env
# PostgreSQL (producción / Railway / Neon / Vercel)
DATABASE_URL=postgresql://usuario:password@host:5432/licoreriaapp?sslmode=require

# O configuración local por partes (alternativa a DATABASE_URL)
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=tu_password
DATABASE_NAME=licoreriaapp

# URL pública de la app (usada para enlaces absolutos y WhatsApp)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Verificación en producción
NODE_ENV=development
```

> Nota: el nombre de la base de datos por defecto es `licoreriaapp` (heredado de la versión original del proyecto).

## Instalación y Configuración

### 1. Instalar dependencias

```bash
pnpm install   # o npm install / yarn
```

### 2. Crear la base de datos

```bash
psql -U postgres
CREATE DATABASE licoreriaapp;
\q
```

### 3. Ejecutar el esquema y los seed

Los scripts se encuentran en `scripts/` y deben ejecutarse en orden:

```bash
psql -U postgres -d licoreriaapp -f scripts/01_script_final.sql
psql -U postgres -d licoreriaapp -f scripts/02_Insert_bd.sql
psql -U postgres -d licoreriaapp -f scripts/03_create-contacto-tables.sql
# ... aplicar las migraciones 04 a 13 en orden
```

- `01_script_final.sql` — esquema base (tablas, enums, roles, rutas, permisos)
- `02_Insert_bd.sql` — seed de roles, categorías, 5 usuarios de prueba y 30 productos
- `03_create-contacto-tables.sql` — tablas de contacto y libro de reclamaciones
- `04` a `13` — migraciones de módulos (usuario, conexión, cotizaciones, ventas, deudas, códigos de barras, optimizaciones)

### 4. Ejecutar en desarrollo

```bash
pnpm dev
```

La aplicación estará disponible en `http://localhost:3000`.

### 5. Build para producción

```bash
pnpm build
pnpm start
```

## Usuarios de Prueba

Después del seed (`02_Insert_bd.sql`):

| Usuario     | Contraseña  | Rol                    |
|-------------|-------------|------------------------|
| `superadmin`| `admin123`  | SUPER_ADMIN            |
| `admin`     | `admin123`  | ADMIN                  |
| `productos` | `admin123`  | ENCARGADO_PRODUCTOS    |
| `ventas`    | `admin123`  | ENCARGADO_VENTAS       |
| `cliente`   | `cliente123`| CLIENTE                |

## Estructura de Rutas

### Públicas
- `/` — Home con categorías y destacados navideños
- `/productos` — Catálogo con filtros y búsqueda
- `/producto/[id]` — Detalle de producto con reseñas
- `/carrito` — Carrito de compras
- `/checkout` — Proceso de pago
- `/compra/confirmacion/[id]` — Confirmación de compra
- `/cotizar-lista` — Solicitar cotización (subir lista escolar)
- `/boletas` y `/boletas/[id]` — Boletas
- `/contacto`, `/sobre-nosotros`, `/terminos` — Información
- `/libro-reclamaciones` — Libro de reclamaciones
- `/auth/login` y `/auth/registro` — Autenticación

### Usuario autenticado
- `/perfil` — Perfil del usuario
- `/mis-compras` y `/mis-compras/[id]` — Historial de compras
- `/mis-compras-resena` — Reseñar compras realizadas
- `/mis-resenas` — Mis reseñas
- `/mis-boletas` — Mis boletas
- `/notificaciones` — Notificaciones

### Punto de venta
- `/ventas` — Registro de ventas (POS con escáner de códigos)

### Administración (ADMIN y SUPER_ADMIN)
- `/admin` — Dashboard con estadísticas
- `/admin/productos` (+ crear/editar) — Gestión de productos
- `/admin/categorias` — Gestión de categorías
- `/admin/compras` — Gestión de pedidos
- `/admin/usuarios` — Gestión de usuarios

### Super Admin
- `/superadmin` — Panel principal
- `/superadmin/dashboard` — Métricas y gráficos
- `/superadmin/productos` (+ crear/editar) — Productos
- `/superadmin/categorias` — Categorías
- `/superadmin/compras` — Pedidos
- `/superadmin/usuarios` — Usuarios y roles
- `/superadmin/roles` — Roles
- `/superadmin/resenas` — Aprobación de reseñas
- `/superadmin/cotizaciones` (+ historial) — Cotizaciones
- `/superadmin/deudas` — Gestión de deudas
- `/superadmin/ventas-reportes` — Reportes de ventas
- `/superadmin/mis-boletas` — Boletas
- `/superadmin/configuracion` — IGV y costo de envío

### Otros
- `/acceso-denegado` — Página 403

## API Endpoints

### Autenticación
- `POST /api/auth/login` — Iniciar sesión
- `POST /api/auth/register` — Registrar usuario (rol CLIENTE)
- `POST /api/auth/logout` — Cerrar sesión
- `GET /api/auth/me` — Usuario actual
- `POST /api/auth/check-user` — Verificar disponibilidad de nombre de usuario

### Catálogo
- `GET /api/productos` — Listar productos (filtros: `categoria`, `q`, paginación)
- `GET /api/productos/[id]` — Detalle de producto
- `GET /api/productos/codigo/[codigo]` — Producto por código de barras
- `GET /api/productos/destacados-navidad` — Destacados de temporada
- `GET /api/categorias/activas` — Categorías activas

### Carrito
- `GET /api/carrito` — Carrito del usuario
- `POST /api/carrito/agregar` — Agregar al carrito
- `PUT /api/carrito/actualizar` — Actualizar cantidad
- `DELETE /api/carrito/[id]` — Eliminar item
- `GET /api/carrito/count` — Contador de items

### Compras
- `POST /api/compras/realizar` — Crear compra (recalcula precios, descuenta stock)
- `POST /api/compras/comprobante` — Subir comprobante de pago
- `GET /api/compras/[id]` — Detalle de compra
- `GET /api/mis-compras` y `/api/mis-compras/[id]` — Compras del usuario
- `GET /api/admin/compras` — Todas las compras (admin)
- `POST /api/admin/compras/actualizar-estado` — Actualizar estado

### Boletas
- `GET /api/boletas` y `GET /api/boletas/[id]` — Boletas
- `GET /api/boletas/[id]/descargar` — Descargar boleta en PDF

### Reseñas
- `POST /api/resenas` y `POST /api/resenas/crear` — Crear reseña
- `DELETE /api/resenas/[id]` — Eliminar reseña propia
- `GET /api/resenas/producto/[id]` — Reseñas de un producto
- `GET /api/mis-resenas` — Mis reseñas
- `GET /api/admin/resenas` y `PATCH /api/admin/resenas/[id]` — Moderación

### Notificaciones
- `GET /api/notificaciones` — Últimas 50
- `GET /api/notificaciones/no-leidas` — No leídas
- `POST /api/notificaciones/[id]/marcar-leida` — Marcar como leída

### Ventas (POS)
- `POST /api/ventas` — Registrar venta (productos existentes o ad-hoc, pago parcial)
- `GET /api/ventas` — Listar ventas con filtros
- `POST /api/ventas/producto-rapido` — Crear producto rápido desde el escáner
- `GET /api/ventas/[id]/detalles` — Detalle de venta
- `GET /api/ventas/reportes` — Reportes (por vendedor, propietario, producto, método de pago)
- `GET /api/ventas/reportes/detalles` — Reporte detallado por vendedor
- `GET /api/ventas/reportes/metricas` — Métricas

### Deudas
- `GET /api/deudas` — Deudas pendientes con filtros
- `POST /api/deudas/registrar-pago` — Registrar pago parcial/total
- `GET /api/deudas/historial` — Historial de deudas pagadas/canceladas
- `POST /api/deudas/cancelar` — Cancelar deuda
- `GET /api/deudas/[ventaId]/detalles` — Detalle de deuda

### Cotizaciones
- `POST /api/cotizaciones/crear` — Crear solicitud
- `GET /api/cotizaciones/listar` — Listar solicitudes
- `POST /api/cotizaciones/analizar-imagen` — Extraer productos desde OCR
- `GET/POST /api/cotizaciones/[id]/agregar-items` — Items de la cotización
- `GET /api/cotizaciones/[id]/buscar-producto` — Buscar en catálogo
- `POST /api/cotizaciones/[id]/generar-pdf` — Generar PDF de cotización
- `POST /api/cotizaciones/[id]/enviar` — Enviar (EMAIL/WHATSAPP/DESCARGA)
- `DELETE /api/cotizaciones/[id]/delete` — Eliminar solicitud
- `GET /api/cotizaciones/historial-superadmin` — Historial por superadmin

### Administración
- `GET/POST /api/admin/productos` y `PUT /api/admin/productos/[id]` — CRUD de productos
- `PATCH /api/admin/productos/[id]/toggle` — Activar/desactivar producto
- `POST /api/admin/productos/upload` y `PUT .../[id]/imagen` — Imágenes
- `GET/POST/PUT /api/admin/categorias` y `DELETE /api/admin/categorias/[id]` — Categorías
- `GET/POST/PUT /api/admin/roles` — Roles
- `POST /api/admin/seed-roles` — Restablecer asignación de roles demo
- `GET /api/admin/usuarios` y `GET/PUT /api/admin/usuarios/[id]` — Usuarios
- `PATCH /api/admin/usuarios/toggle`, `POST .../asignar-roles`, `DELETE .../eliminar` — Gestión
- `POST /api/admin/configuracion` y `GET /api/configuracion(-sistema)` — Configuración
- `GET /api/admin/estadisticas` — Estadísticas del dashboard

### Varios
- `POST /api/contacto` — Guardar mensaje de contacto
- `POST /api/libro-reclamaciones` — Registrar reclamo
- `POST /api/upload` — Subida genérica de archivos (≤10 MB)
- `GET/POST /api/productos-solicitados` — Productos vendidos fuera de catálogo
- `GET/POST /api/productos-buscados-lista` — Productos buscados no encontrados
- `GET/POST /api/perfil/cambiar-usuario` — Cambiar nombre de usuario (cada 30 días)
- `GET /api/usuario/perfil` y `PUT /api/usuarios/actualizar-perfil` — Perfil
- `/api/debug/*` — Endpoints de diagnóstico y desarrollo

## Seguridad

- Contraseñas hasheadas con bcrypt (10 rondas)
- Sesiones mediante cookie HTTP-only (`sameSite: lax`, `secure` en producción)
- Protección de rutas por rol (`SUPER_ADMIN`, `ADMIN`, `ENCARGADO_PRODUCTOS`, `ENCARGADO_VENTAS`, `CLIENTE`)
- Validación de datos con zod y react-hook-form
- Recalculo de precios y stock en el servidor
- Subida de archivos con validación de tipo y tamaño

## Scripts

```bash
pnpm dev          # Servidor de desarrollo
pnpm build        # Build de producción
pnpm start        # Iniciar build
pnpm lint         # ESLint
```

## Despliegue

La aplicación está preparada para despliegue en **Vercel** o **Railway** (`railway.json`, `Procfile`). Configura las variables de entorno listadas arriba (en especial `DATABASE_URL` y `NEXT_PUBLIC_APP_URL`) en la plataforma elegida.
