# Estructura de Carpetas de Imágenes

Las imágenes de la aplicación se organizan en las siguientes carpetas:

## Estructura

```
/public/images/
├── /qr/           - Códigos QR de pagos (Yape, Plín)
├── /logos/        - Logo de la tienda y logos de partners
├── /banners/      - Imágenes de banners y héroe (hero sections)
└── /productos/    - Imágenes de los productos
```

## Ubicaciones Específicas

### QR Codes (`/qr/`)
Para códigos QR de métodos de pago:
- `yape-qr.png` - QR para Yape
- `plin-qr.png` - QR para Plín
- Otros códigos de pago según sea necesario

**Uso en código:**
```tsx
<img src="/images/qr/yape-qr.png" alt="QR Yape" />
<img src="/images/qr/plin-qr.png" alt="QR Plín" />
```

### Logos (`/logos/`)
Para logotipos e iconografía:
- `logo.png` - Logo principal de la tienda
- `logo-white.png` - Logo en versión blanca para fondos oscuros
- `favicon.ico` - Favicon de la aplicación

**Uso en código:**
```tsx
<img src="/images/logos/logo.png" alt="Logo Tienda" />
```

### Banners (`/banners/`)
Para imágenes de héroe y banners promocionales:
- `hero.jpg` - Imagen principal del homepage
- `promocion-[mes].jpg` - Banners de promociones mensuales
- Otros banners temáticos

**Uso en código:**
```tsx
<img src="/images/banners/hero.jpg" alt="Banner Principal" />
```

### Productos (`/productos/`)
Para imágenes de los artículos del catálogo:
- Nombrar con el ID del producto: `producto-1.jpg`, `producto-2.png`
- O usar nombres descriptivos: `ron-blanco.jpg`, `vodka-importado.png`

**Almacenamiento en BD:**
Guardar en la tabla `productos` el campo `imagen` con la ruta:
```sql
UPDATE productos SET imagen = '/images/productos/producto-1.jpg' WHERE id = 1;
```

## Recomendaciones

1. **Formato de Imágenes:**
   - Productos: JPG o WebP (mejor compresión)
   - Logos: PNG (transparencia)
   - QR: PNG (claridad)
   - Banners: JPG o WebP

2. **Tamaños Recomendados:**
   - Imágenes de producto: 500x500px mínimo
   - Logos: 200x200px
   - Banners/Héroe: 1920x1080px o superior
   - QR: 300x300px mínimo

3. **Optimización:**
   - Comprimir imágenes antes de subir
   - Usar herramientas como TinyPNG o ImageOptim
   - Considerar usar Next.js Image component para optimización automática

4. **Acceso desde el Frontend:**
```tsx
import Image from "next/image"

// Recomendado: usar Image component de Next.js
<Image
  src="/images/productos/producto-1.jpg"
  alt="Nombre Producto"
  width={500}
  height={500}
/>

// O HTML img regular
<img src="/images/productos/producto-1.jpg" alt="Nombre Producto" />
```

## Notas

- Las imágenes en `/public` son estáticas y se sirven directamente
- Los URLs son relativos a `/public`, así que no incluir `/public` en la ruta
- Todas las imágenes deben incluir `alt` descriptivo para accesibilidad
