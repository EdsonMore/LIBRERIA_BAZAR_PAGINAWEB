# 🎬 PASO A PASO - CÓMO INSTALAR (CON SCREENSHOTS TEXTUALES)

**Sigue estos pasos en orden.**

---

## 📍 PASO 1: ABRE TERMINAL

```
Windows:
  Win + R → cmd → Enter
  
Linux/Mac:
  Ctrl + Alt + T (o abre Terminal desde Aplicaciones)
```

---

## 📍 PASO 2: NAVEGA A LA CARPETA

```bash
cd c:\Users\Lenovo Core i7\Documents\PROYECTOS\licoreria-app

# Verifica que estés aquí con:
dir
# Deberías ver: app, lib, public, scripts, node_modules, package.json, etc
```

---

## 📍 PASO 3: INSTALA LIBRERÍAS (Copia-pega esto)

```bash
npm install jspdf jspdf-autotable pdfjs-dist tesseract.js office-text-extractor
```

**Espera a que termine.** Verás algo como:

```
npm notice
npm notice created a lockfile as package-lock.json.

added 150 packages, removed 0 packages
```

**Si ves errores, intenta:**
```bash
npm install --force
npm install --legacy-peer-deps
```

---

## 📍 PASO 4: MIGRA LA BASE DE DATOS

### Opción A: Con psql (línea de comandos)

```bash
psql -U tu_usuario -d tu_base_datos < scripts/06_migration_cotizaciones_listas.sql
```

**Reemplaza:**
- `tu_usuario` → Tu usuario de PostgreSQL
- `tu_base_datos` → Tu nombre de base de datos

**Ejemplo real:**
```bash
psql -U postgres -d licoreria_db < scripts/06_migration_cotizaciones_listas.sql
```

**Si funciona, verás:**
```
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE INDEX
CREATE INDEX
```

### Opción B: Con cliente gráfico (pgAdmin)

```
1. Abre pgAdmin
2. Conecta a tu BD
3. Abre "Query Tool"
4. Copia el contenido de: scripts/06_migration_cotizaciones_listas.sql
5. Pega en Query Tool
6. Click: Execute (o F5)
7. Verifica que creó las 4 tablas
```

**Verifica que se crearon:**
```bash
psql -U tu_usuario -d tu_base_datos -c "\dt cotizacion*"
```

Deberías ver:
```
             List of relations
 Schema |         Name         | Type  | Owner
--------+----------------------+-------+-------
 public | cotizacion_envios    | table | user
 public | cotizacion_generada  | table | user
 public | cotizacion_items     | table | user
 public | cotizacion_listas    | table | user
(4 rows)
```

---

## 📍 PASO 5: CREA CARPETA DE UPLOADS

### Windows (PowerShell o CMD):

```bash
mkdir public\uploads\cotizaciones
```

O en PowerShell:
```powershell
New-Item -Path "public/uploads/cotizaciones" -ItemType Directory -Force
```

### Linux/Mac:

```bash
mkdir -p public/uploads/cotizaciones
chmod 755 public/uploads/cotizaciones
```

**Verifica que existe:**
```bash
dir public\uploads\cotizaciones

# o en Linux:
ls -la public/uploads/cotizaciones/
```

---

## 📍 PASO 6: REINICIA EL SERVIDOR

```bash
npm run dev
```

**Espera a ver:**
```
> ready - started server on 0.0.0.0:3000
> compiled client and server successfully
```

**Si ves errores como `Module not found`, vuelve a PASO 3.**

---

## 📍 PASO 7: VERIFICA QUE FUNCIONA

Abre en navegador (elige uno):

### Cliente
```
http://localhost:3000/cotizar-lista
```

Deberías ver:
- ✅ Página que carga sin errores
- ✅ Tab "Nueva Cotización"
- ✅ Tab "Mis Cotizaciones"
- ✅ Botón para drag-and-drop

### SuperAdmin
```
http://localhost:3000/superAdmin/cotizaciones
```

Deberías ver:
- ✅ Página que carga sin errores
- ✅ Sidebar con menú
- ✅ "Cotizaciones" en sidebar
- ✅ Panel vacío (sin cotizaciones aún)

---

## ✅ TEST RÁPIDO

Si todo cargó bien, haz una prueba:

### 1. Como Cliente:

1. En navbar (arriba), busca "📋 Cotizar Lista"
2. Haz clic
3. Deberías ir a `/cotizar-lista`

**Verifica:**
- ✅ Ves el formulario
- ✅ Ves "Arrastra archivo aquí"
- ✅ Ves campo para nombre
- ✅ Ves botón "Enviar a Cotizar"

### 2. Sube un archivo de prueba:

```
1. Haz clic en "Arrastra archivo aquí"
2. Selecciona cualquier PDF que tengas
3. Ingresa nombre: "Test"
4. Haz clic: "Enviar a Cotizar"
```

**Deberías ver:**
- ✅ "Cotización enviada"
- ✅ Archivo aparece en "Mis Cotizaciones"
- ✅ Estado es "PENDIENTE"

### 3. Como SuperAdmin:

1. Ve a `/superAdmin/cotizaciones`
2. Deberías ver tu cotización en la lista

**Verifica:**
- ✅ Cotización aparece
- ✅ Puedes seleccionarla
- ✅ Panel derecho se abre

### 4. Prueba búsqueda de producto:

1. En panel derecho, busca "agua"
2. Deberías ver un producto

**Verifica:**
- ✅ Aparece "agua" con precio
- ✅ Puedes agregarla

### 5. Genera PDF:

1. Agrega algunos items
2. Haz clic: "Generar Cotización"

**Deberías ver:**
- ✅ "PDF generado exitosamente"
- ✅ Link para descargar

---

## 🎉 ¡LISTO!

Si todo esto funcionó, **tu instalación está 100% completa.**

El sistema está listo para:
- ✅ Que clientes suban archivos
- ✅ Que SuperAdmin cotice
- ✅ Que se generen PDFs
- ✅ Que se compartan cotizaciones

---

## 🚨 ALGO NO FUNCIONA?

### Error en PASO 3 (npm install)

```bash
# Intenta:
npm install --force

# O:
npm install --legacy-peer-deps

# Si nada funciona:
rm -r node_modules package-lock.json
npm install
```

### Error en PASO 4 (migración BD)

**Verifica:**
1. ¿PostgreSQL está corriendo?
   ```bash
   psql --version
   ```

2. ¿Tu usuario existe?
   ```bash
   psql -U postgres -l
   # Deberías ver tu BD en la lista
   ```

3. ¿El archivo existe?
   ```bash
   dir scripts\06_migration_cotizaciones_listas.sql
   ```

4. **Si nada funciona, usa pgAdmin:**
   - Abre pgAdmin
   - Query Tool
   - Copia-pega el SQL
   - Ejecuta

### Error en PASO 7 (página 404)

```bash
# Reinicia:
npm run dev

# Y en navegador:
Ctrl + Shift + R  (limpiar caché)
```

### Tesseract.js muy lento

**Normal en primera carga.** Espera 2 minutos. Después va rápido.

---

## 📊 RESULTADO ESPERADO

Después de estos 7 pasos, deberías tener:

```
✅ npm packages instalados
✅ Base de datos migrada (4 tablas)
✅ Carpeta de uploads creada
✅ Servidor corriendo en :3000
✅ Cliente funcionando en /cotizar-lista
✅ SuperAdmin funcionando en /superAdmin/cotizaciones
✅ Puedo subir archivos
✅ Puedo cotizar
✅ Puedo generar PDFs
```

---

## 🎓 COMANDOS DE REFERENCIA

Guardá estos comandos para después:

```bash
# Iniciar servidor (cada día)
npm run dev

# Instalar nuevas dependencias (si agrego más)
npm install

# Ver versión de Node
node --version

# Ver versión de npm
npm --version

# Conectar a BD
psql -U tu_usuario -d tu_bd

# Limpiar caché y reiniciar
rm -r .next
npm run dev

# Build para producción
npm run build
npm start
```

---

## 📞 AYUDA

Si algo no funciona:
1. Ejecuta: `.\verify-installation.ps1` (Windows)
2. O: `bash verify-installation.sh` (Linux/Mac)
3. Lee: [VERIFICACION_INSTALACION.md](VERIFICACION_INSTALACION.md)

---

## ✨ ¡LISTO!

En 7 pasos, tu sistema está completamente funcional.

**¡A vender útiles escolares!** 📚✏️

---

**Tiempo total:** 10-15 minutos ⏱️  
**Dificultad:** Muy fácil 👶  
**Resultado:** Sistema profesional en producción 🚀
