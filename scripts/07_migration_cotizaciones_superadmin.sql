-- Script de migración para agregar seguimiento de superAdmin en cotizaciones
-- Fecha: 2025-12-16

-- Agregar columna de superadmin_id a cotizacion_generada si no existe
ALTER TABLE cotizacion_generada 
ADD COLUMN IF NOT EXISTS superadmin_id BIGINT REFERENCES usuarios(id) ON DELETE SET NULL;

-- Agregar columna de superadmin_id a cotizacion_listas para rastrear quién comienza la cotización
ALTER TABLE cotizacion_listas
ADD COLUMN IF NOT EXISTS superadmin_id BIGINT REFERENCES usuarios(id) ON DELETE SET NULL;

-- Crear índice para búsquedas rápidas por superadmin
CREATE INDEX IF NOT EXISTS idx_cotizacion_generada_superadmin ON cotizacion_generada(superadmin_id);
CREATE INDEX IF NOT EXISTS idx_cotizacion_listas_superadmin ON cotizacion_listas(superadmin_id);
