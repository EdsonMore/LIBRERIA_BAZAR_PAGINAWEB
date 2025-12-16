# Script de verificación automatizada del módulo de cotizaciones para Windows
# Uso: .\verify-installation.ps1

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  VERIFICACIÓN AUTOMÁTICA - MÓDULO COTIZACIONES            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$pass = 0
$fail = 0

# Función para verificar archivos
function Check-File {
    param([string]$path)
    if (Test-Path $path) {
        Write-Host "✓ Archivo existe: $path" -ForegroundColor Green
        $script:pass++
    } else {
        Write-Host "✗ Archivo NO existe: $path" -ForegroundColor Red
        $script:fail++
    }
}

# Función para verificar directorios
function Check-Directory {
    param([string]$path)
    if (Test-Path -PathType Container $path) {
        Write-Host "✓ Carpeta existe: $path" -ForegroundColor Green
        $script:pass++
    } else {
        Write-Host "✗ Carpeta NO existe: $path" -ForegroundColor Red
        $script:fail++
    }
}

# Función para verificar comando
function Check-Command {
    param([string]$cmd)
    try {
        $null = & $cmd --version 2>$null
        Write-Host "✓ Comando disponible: $cmd" -ForegroundColor Green
        $script:pass++
    } catch {
        Write-Host "✗ Comando NO disponible: $cmd" -ForegroundColor Red
        $script:fail++
    }
}

# Función para verificar paquete npm
function Check-NPMPackage {
    param([string]$pkg)
    $output = & npm list $pkg 2>$null
    if ($output -like "*$pkg*") {
        Write-Host "✓ npm package instalado: $pkg" -ForegroundColor Green
        $script:pass++
    } else {
        Write-Host "✗ npm package NO instalado: $pkg" -ForegroundColor Red
        $script:fail++
    }
}

Write-Host "📋 PASO 1: VERIFICAR COMANDOS GLOBALES" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Check-Command "node"
Check-Command "npm"
Check-Command "psql"
Write-Host ""

Write-Host "📦 PASO 2: VERIFICAR DEPENDENCIAS NPM" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Check-NPMPackage "jspdf"
Check-NPMPackage "jspdf-autotable"
Check-NPMPackage "pdfjs-dist"
Check-NPMPackage "tesseract.js"
Check-NPMPackage "office-text-extractor"
Write-Host ""

Write-Host "📁 PASO 3: VERIFICAR ARCHIVOS DEL SISTEMA" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Check-File "app/cotizar-lista/page.tsx"
Check-File "app/superadmin/cotizaciones/page.tsx"
Check-File "app/superadmin/layout.tsx"
Check-File "app/api/upload/route.ts"
Check-File "app/api/cotizaciones/crear/route.ts"
Check-File "app/api/cotizaciones/listar/route.ts"
Check-File "app/api/cotizaciones/[id]/agregar-items/route.ts"
Check-File "app/api/cotizaciones/[id]/buscar-producto/route.ts"
Check-File "app/api/cotizaciones/[id]/generar-pdf/route.ts"
Check-File "app/api/cotizaciones/[id]/enviar/route.ts"
Check-File "lib/text-extraction.ts"
Check-File "lib/pdf-generator.ts"
Check-File "scripts/06_migration_cotizaciones_listas.sql"
Write-Host ""

Write-Host "📂 PASO 4: VERIFICAR CARPETAS" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Check-Directory "public/uploads/cotizaciones"
Check-Directory "app/cotizar-lista"
Check-Directory "app/superadmin/cotizaciones"
Check-Directory "app/api/cotizaciones"
Write-Host ""

Write-Host "📚 PASO 5: VERIFICAR DOCUMENTACIÓN" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Check-File "MODULO_COTIZACIONES.md"
Check-File "INSTALACION_COTIZACIONES.md"
Check-File "VERIFICACION_INSTALACION.md"
Write-Host ""

Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "RESULTADO FINAL" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✓ Pasaron: $pass" -ForegroundColor Green
Write-Host "✗ Fallaron: $fail" -ForegroundColor Red
Write-Host ""

if ($fail -eq 0) {
    Write-Host "✅ ¡INSTALACIÓN CORRECTA!" -ForegroundColor Green
    Write-Host "El módulo de cotizaciones está listo para usar." -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ FALTAN COMPLETAR PASOS" -ForegroundColor Red
    Write-Host "Por favor, ejecuta: npm install" -ForegroundColor Red
    Write-Host "Y crea las carpetas faltantes." -ForegroundColor Red
    exit 1
}
