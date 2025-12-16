#!/bin/bash
# Script de verificación automatizada del módulo de cotizaciones
# Uso: bash verify-installation.sh

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  VERIFICACIÓN AUTOMÁTICA - MÓDULO COTIZACIONES            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contadores
PASS=0
FAIL=0

# Función para verificar archivos
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} Archivo existe: $1"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} Archivo NO existe: $1"
        ((FAIL++))
    fi
}

# Función para verificar directorios
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} Carpeta existe: $1"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} Carpeta NO existe: $1"
        ((FAIL++))
    fi
}

# Función para verificar comando
check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✓${NC} Comando disponible: $1"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} Comando NO disponible: $1"
        ((FAIL++))
    fi
}

# Función para verificar paquete npm
check_npm_package() {
    if npm list "$1" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} npm package instalado: $1"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} npm package NO instalado: $1"
        ((FAIL++))
    fi
}

echo "📋 PASO 1: VERIFICAR COMANDOS GLOBALES"
echo "════════════════════════════════════════════════════════════"
check_command "node"
check_command "npm"
check_command "psql"
echo ""

echo "📦 PASO 2: VERIFICAR DEPENDENCIAS NPM"
echo "════════════════════════════════════════════════════════════"
check_npm_package "jspdf"
check_npm_package "jspdf-autotable"
check_npm_package "pdfjs-dist"
check_npm_package "tesseract.js"
check_npm_package "office-text-extractor"
echo ""

echo "📁 PASO 3: VERIFICAR ARCHIVOS DEL SISTEMA"
echo "════════════════════════════════════════════════════════════"
check_file "app/cotizar-lista/page.tsx"
check_file "app/superadmin/cotizaciones/page.tsx"
check_file "app/superadmin/layout.tsx"
check_file "app/api/upload/route.ts"
check_file "app/api/cotizaciones/crear/route.ts"
check_file "app/api/cotizaciones/listar/route.ts"
check_file "app/api/cotizaciones/\[id\]/agregar-items/route.ts"
check_file "app/api/cotizaciones/\[id\]/buscar-producto/route.ts"
check_file "app/api/cotizaciones/\[id\]/generar-pdf/route.ts"
check_file "app/api/cotizaciones/\[id\]/enviar/route.ts"
check_file "lib/text-extraction.ts"
check_file "lib/pdf-generator.ts"
check_file "scripts/06_migration_cotizaciones_listas.sql"
echo ""

echo "📂 PASO 4: VERIFICAR CARPETAS"
echo "════════════════════════════════════════════════════════════"
check_dir "public/uploads/cotizaciones"
check_dir "app/cotizar-lista"
check_dir "app/superadmin/cotizaciones"
check_dir "app/api/cotizaciones"
echo ""

echo "📚 PASO 5: VERIFICAR DOCUMENTACIÓN"
echo "════════════════════════════════════════════════════════════"
check_file "MODULO_COTIZACIONES.md"
check_file "INSTALACION_COTIZACIONES.md"
check_file "VERIFICACION_INSTALACION.md"
echo ""

echo "════════════════════════════════════════════════════════════"
echo "RESULTADO FINAL"
echo "════════════════════════════════════════════════════════════"
echo -e "${GREEN}✓ Pasaron: $PASS${NC}"
echo -e "${RED}✗ Fallaron: $FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✅ ¡INSTALACIÓN CORRECTA!${NC}"
    echo "El módulo de cotizaciones está listo para usar."
    exit 0
else
    echo -e "${RED}❌ FALTAN COMPLETAR PASOS${NC}"
    echo "Por favor, ejecuta: npm install"
    echo "Y crea las carpetas faltantes."
    exit 1
fi
