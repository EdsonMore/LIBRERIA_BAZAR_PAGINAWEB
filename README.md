# Licorería App - Next.js

Aplicación completa de venta de licores online migrada desde Spring Boot + Thymeleaf a Next.js con App Router.

## Características

- Sistema de autenticación con roles (SUPER_ADMIN, ADMIN, ENCARGADO_PRODUCTOS, ENCARGADO_VENTAS, CLIENTE)
- Gestión completa de productos con categorías
- Carrito de compras con sincronización cliente-servidor
- Sistema de compras y seguimiento de pedidos
- Panel de administración con múltiples niveles
- Sistema de reseñas y calificaciones
- Notificaciones en tiempo real
- Libro de reclamaciones
- Responsive design replicando estilos originales

## Requisitos

- Node.js 18+
- MySQL 8+
- npm o yarn

## Variables de Entorno Requeridas

Crear un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

\`\`\`env
# Base de datos
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=tu_password
DATABASE_NAME=licoreriaapp

# Autenticación
JWT_SECRET=tu_clave_secreta_muy_segura_aqui

# Next.js
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development
\`\`\`

## Instalación y Configuración

### 1. Instalar dependencias

\`\`\`bash
npm install
\`\`\`

### 2. Configurar base de datos

La aplicación usa MySQL. Asegúrate de tener MySQL instalado y corriendo.

\`\`\`bash
# Crear la base de datos
mysql -u root -p
CREATE DATABASE licoreriaapp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit;
\`\`\`

### 3. Ejecutar migraciones y seed

\`\`\`bash
# Esto creará las tablas y cargará los datos iniciales desde static/data/*.json
npm run import-seed
\`\`\`

### 4. Ejecutar en desarrollo

\`\`\`bash
npm run dev
\`\`\`

La aplicación estará disponible en `http://localhost:3000`

### 5. Build para producción

\`\`\`bash
npm run build
npm start
\`\`\`

## Estructura Completa del Proyecto

Este proyecto replica exactamente la aplicación Java+Thymeleaf original en Next.js con las siguientes características:

### Páginas Públicas
- `/` - Home con hero section y categorías
- `/productos` - Listado de productos con filtros
- `/producto/[id]` - Detalle de producto con reseñas
- `/carrito` - Carrito de compras con cálculo de totales
- `/contacto` - Página de contacto
- `/libro-reclamaciones` - Libro de reclamaciones

### Páginas de Usuario (Autenticación Requerida)
- `/perfil` - Perfil del usuario
- `/mis-compras` - Historial de compras
- `/mis-resenas` - Reseñas del usuario
- `/checkout` - Proceso de pago

### Panel de Administración (Roles: ADMIN, SUPER_ADMIN)
- `/admin` - Dashboard con estadísticas
- `/admin/productos` - Gestión de productos
- `/admin/compras` - Gestión de pedidos
- `/admin/usuarios` - Gestión de usuarios
- `/admin/resenas` - Aprobación de reseñas
- `/admin/configuracion` - Configuración del sistema

### Panel de Super Admin (Rol: SUPER_ADMIN)
- `/superAdmin` - Dashboard avanzado
- `/superAdmin/rutas` - Gestión de rutas y permisos
- `/superAdmin/roles` - Gestión de roles

### APIs Implementadas

#### Públicas
- `GET /api/productos` - Listar productos
- `GET /api/productos/[id]` - Detalle de producto
- `GET /api/categorias/activas` - Categorías activas
- `GET /api/configuracion-sistema` - Configuración (IGV, envío)

#### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/logout` - Cerrar sesión
- `GET /api/auth/me` - Usuario actual

#### Carrito
- `GET /api/carrito` - Obtener carrito
- `POST /api/carrito/agregar` - Agregar al carrito
- `PUT /api/carrito/actualizar` - Actualizar cantidad
- `DELETE /api/carrito/[id]` - Eliminar item
- `GET /api/carrito/count` - Contador de items

#### Usuario
- `PUT /api/usuarios/actualizar-perfil` - Actualizar perfil
- `GET /api/mis-compras` - Historial de compras
- `GET /api/mis-resenas` - Reseñas del usuario
- `DELETE /api/resenas/[id]` - Eliminar reseña

#### Admin
- `GET /api/admin/estadisticas` - Estadísticas del dashboard
- `GET /api/admin/compras` - Todas las compras
- `POST /api/admin/compras/actualizar-estado` - Actualizar estado de compra

## Características Implementadas

1. **Sistema de Autenticación Completo**
   - Registro de usuarios con validación
   - Login con sesiones seguras
   - Middleware de protección de rutas
   - Roles y permisos (5 roles diferentes)

2. **Gestión de Productos**
   - CRUD completo de productos
   - Categorías dinámicas
   - Control de stock
   - Búsqueda y filtros

3. **Carrito de Compras**
   - Sincronización cliente-servidor
   - Persistencia en base de datos
   - Cálculo automático de totales
   - IGV y envío configurables

4. **Sistema de Compras**
   - Proceso de checkout completo
   - Estados de pedido (7 estados)
   - Historial de compras
   - Notificaciones automáticas

5. **Sistema de Reseñas**
   - Calificación de 1-5 estrellas
   - Comentarios de usuarios
   - Aprobación por administrador
   - Promedio de calificaciones

6. **Panel de Administración**
   - Dashboard con estadísticas
   - Gestión de productos y stock
   - Gestión de pedidos
   - Gestión de usuarios
   - Aprobación de reseñas

7. **Configuración del Sistema**
   - IGV configurable
   - Costo de envío configurable
   - Activación/desactivación de IGV y envío

## Seguridad Implementada

- Contraseñas hasheadas con bcrypt
- Sesiones HTTP-only cookies
- Middleware de autenticación
- Protección CSRF
- Validación de datos en backend
- Protección de rutas por roles
- Sanitización de inputs

## Optimizaciones

- Server-Side Rendering (SSR) para SEO
- Caching de datos con SWR
- Optimización de imágenes con Next.js
- Code splitting automático
- Lazy loading de componentes

## Diferencias con la Versión Java Original

Esta versión mantiene **100% de la funcionalidad** del sistema original mientras mejora:
- **Performance**: SSR y optimización de Next.js
- **UX**: Transiciones suaves y feedback visual mejorado
- **SEO**: Metadatos optimizados y renderizado del servidor
- **Deployment**: Optimizado para Vercel con zero-config
- **Developer Experience**: TypeScript, hot reload, y mejor debugging

## Estructura del Proyecto

\`\`\`
├── app/                      # App Router de Next.js
│   ├── page.tsx             # Página principal (Home)
│   ├── layout.tsx           # Layout principal
│   ├── globals.css          # Estilos globales
│   ├── productos/           # Listado de productos
│   ├── producto/[id]/       # Detalle de producto
│   ├── carrito/             # Carrito de compras
│   ├── perfil/              # Perfil de usuario
│   ├── mis-compras/         # Historial de compras
│   ├── mis-resenas/         # Reseñas del usuario
│   ├── contacto/            # Página de contacto
│   ├── libro-reclamaciones/ # Libro de reclamaciones
│   ├── auth/                # Login y registro
│   ├── admin/               # Panel de administración
│   ├── superAdmin/          # Panel de super administrador
│   └── api/                 # API Routes
│       ├── auth/            # Endpoints de autenticación
│       ├── productos/       # CRUD de productos
│       ├── carrito/         # Gestión de carrito
│       ├── compras/         # Gestión de compras
│       ├── resenas/         # Gestión de reseñas
│       └── usuarios/        # Gestión de usuarios
├── components/              # Componentes React reutilizables
│   ├── layout/             # Navbar, Footer, etc.
│   └── ui/                 # Componentes de UI
├── lib/                    # Utilidades y configuración
│   ├── db.ts              # Conexión a base de datos
│   ├── auth.ts            # Utilidades de autenticación
│   └── types.ts           # Tipos TypeScript
├── scripts/               # Scripts de utilidad
│   └── importSeed.js     # Script para importar datos iniciales
├── public/               # Archivos estáticos
│   ├── img/             # Imágenes
│   └── data/            # Datos JSON para seed
└── middleware.ts        # Middleware de autenticación

\`\`\`

## Despliegue en Vercel

### 1. Conectar con GitHub

1. Sube el proyecto a GitHub
2. Conecta tu repositorio en Vercel
3. Configura las variables de entorno en Vercel Dashboard

### 2. Base de Datos Externa

Recomendamos usar una base de datos MySQL gestionada:

- **PlanetScale**: MySQL serverless compatible con Vercel
- **Amazon RDS**: Base de datos MySQL gestionada
- **Digital Ocean**: MySQL gestionado

### 3. Variables de Entorno en Vercel

En el dashboard de Vercel, agrega todas las variables de entorno necesarias:

\`\`\`
DATABASE_HOST=tu-host-mysql.com
DATABASE_USER=tu-usuario
DATABASE_PASSWORD=tu-password
DATABASE_NAME=licoreriaapp
JWT_SECRET=tu-clave-secreta
\`\`\`

### 4. Desplegar

\`\`\`bash
# Usando Vercel CLI
npm i -g vercel
vercel --prod
\`\`\`

## Usuarios de Prueba

Después de ejecutar el seed, tendrás los siguientes usuarios disponibles:

- **Super Admin**: usuario: `superadmin`, password: `admin123`
- **Admin**: usuario: `admin`, password: `admin123`
- **Encargado Productos**: usuario: `productos`, password: `admin123`
- **Encargado Ventas**: usuario: `ventas`, password: `admin123`
- **Cliente**: usuario: `cliente`, password: `cliente123`

## API Endpoints Principales

### Públicos
- `GET /api/productos` - Listar todos los productos
- `GET /api/productos/[id]` - Obtener detalle de producto
- `GET /api/categorias/activas` - Listar categorías activas
- `GET /api/configuracion-sistema` - Obtener configuración (IGV, envío)

### Autenticación Requerida
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar nuevo usuario
- `POST /api/auth/logout` - Cerrar sesión
- `GET /api/carrito` - Obtener carrito del usuario
- `POST /api/carrito/agregar` - Agregar producto al carrito
- `POST /api/compras/crear` - Crear nueva compra
- `GET /api/mis-compras` - Obtener compras del usuario

### Admin
- `POST /api/admin/productos` - Crear producto
- `PUT /api/admin/productos/[id]` - Actualizar producto
- `DELETE /api/admin/productos/[id]` - Eliminar producto
- `GET /api/admin/compras` - Gestionar todas las compras
- `POST /api/admin/compras/actualizar-estado` - Actualizar estado de compra

### Super Admin
- `GET /api/superAdmin/usuarios` - Gestionar usuarios
- `POST /api/superAdmin/rutas` - Gestionar rutas y permisos
- `GET /api/superAdmin/estadisticas` - Dashboard con estadísticas

## Testing

\`\`\`bash
# Ejecutar tests
npm test

# Coverage
npm run test:coverage
\`\`\`

## Tecnologías Utilizadas

- **Next.js 15** - Framework React con App Router
- **React 19** - Biblioteca de UI
- **TypeScript** - Tipado estático
- **MySQL2** - Conector de base de datos
- **Tailwind CSS 4** - Framework de estilos
- **SWR** - Data fetching y caché
- **bcryptjs** - Hashing de contraseñas

## Soporte

Para problemas o preguntas, abre un issue en GitHub o contacta al equipo de desarrollo.

## Licencia

Este proyecto es privado y confidencial.
