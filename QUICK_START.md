# ⚡ QUICK START - MÓDULO COTIZACIONES

**¿Prisa? Aquí va todo en 10 minutos.**

---

## 🏃 EN 3 COMANDOS

```bash
# 1. Instalar librerías (2 min)
npm install jspdf jspdf-autotable pdfjs-dist tesseract.js office-text-extractor

# 2. Migrar base de datos (1 min)
psql -U tu_usuario -d tu_bd < scripts/06_migration_cotizaciones_listas.sql

# 3. Crear carpeta (10 seg)
mkdir -p public/uploads/cotizaciones

# 4. Reiniciar (2 min)
npm run dev
```

**Total: ~5 minutos** ✅

---

## ✅ VERIFICAR QUE FUNCIONA

Abre en navegador:
- Cliente: http://localhost:3000/cotizar-lista
- SuperAdmin: http://localhost:3000/superAdmin/cotizaciones

Si ves las páginas sin errores: **¡LISTO!** 🎉

---

## 🎯 FLUJO RÁPIDO DE PRUEBA

```
1. CLIENTE:
   - Registra usuario
   - Va a /cotizar-lista
   - Sube un PDF (puede ser cualquiera)
   - Ves "Cotización enviada"

2. SUPERADMIN:
   - Va a /superAdmin/cotizaciones
   - Ve la solicitud
   - Busca "agua" en campo de producto
   - Agrega un item
   - Genera PDF
   - Haz clic en link para descargar

3. CLIENTE:
   - Vuelve a /cotizar-lista
   - En "Mis Cotizaciones" ve estado "COTIZADO"
   - Descarga el PDF
```

**Listo en <3 minutos** ✨

---

## 🐛 SI ALGO FALLA

| Problema | Solución |
|----------|----------|
| `Cannot find module` | `npm install` |
| `Relation does not exist` | Ejecutar SQL |
| Página 404 | Reiniciar `npm run dev` |
| PDF vacío | Asegúrate de agregar items |
| Archivo no sube | Verifica carpeta `public/uploads/cotizaciones` existe |

---

## 📱 RUTAS NUEVAS

- `localhost:3000/cotizar-lista` ← Cliente sube archivos
- `localhost:3000/superAdmin/cotizaciones` ← SuperAdmin cotiza

---

## 📖 DOCUMENTACIÓN COMPLETA

Si necesitas más info:
- [INSTALACION_COTIZACIONES.md](INSTALACION_COTIZACIONES.md) - Pasos detallados
- [MODULO_COTIZACIONES.md](MODULO_COTIZACIONES.md) - Guía técnica
- [VERIFICACION_INSTALACION.md](VERIFICACION_INSTALACION.md) - Troubleshooting
- [RESUMEN_FINAL.md](RESUMEN_FINAL.md) - Vista general

---

## ⚡ COMANDOS DE DEBUG

```bash
# Ver si npm packages están instalados
npm list jspdf

# Ver si tablas de BD existen
psql -U tu_usuario -d tu_bd -c "SELECT * FROM cotizacion_listas LIMIT 1;"

# Ver archivos subidos
ls -la public/uploads/cotizaciones

# Limpiar caché y reiniciar
rm -r .next && npm run dev
```

---

## 🎁 BONUS: PRÓXIMAS MEJORAS

Opcionales pero útiles:

```typescript
// Envío por email (descomenta en [id]/enviar/route.ts)
case 'EMAIL':
  await enviarEmailConPDF(correo, pdfUrl)
  break

// Compartir por WhatsApp (genera link automático)
const enlace = `https://wa.me/?text=Mi cotización: ${pdfUrl}`

// QR en PDF (agregar a pdf-generator.ts)
doc.addImage(qrCodeUrl, 'PNG', 170, 10, 20, 20)
```

---

## 🚀 ¡A EMPEZAR!

```bash
cd c:\Users\Lenovo Core i7\Documents\PROYECTOS\licoreria-app
npm install jspdf jspdf-autotable pdfjs-dist tesseract.js office-text-extractor
psql -U tu_usuario -d tu_bd < scripts/06_migration_cotizaciones_listas.sql
mkdir -p public/uploads/cotizaciones
npm run dev
```

En 5 minutos tendrás el sistema completo funcionando.

**¡Que disfrutes la campaña de útiles! 🎓**
