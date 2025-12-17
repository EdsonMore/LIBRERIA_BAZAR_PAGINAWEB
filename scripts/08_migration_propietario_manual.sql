-- =====================================================
-- MIGRATION: Soporte para Propietarios Manuales
-- Descripción: Permite registrar propietarios que no están en el sistema
-- =====================================================

-- Modificar la columna propietario_id para que sea nullable
ALTER TABLE public.ventas
ALTER COLUMN propietario_id DROP NOT NULL;

-- Agregar columna para propietario manual
ALTER TABLE public.ventas
ADD COLUMN IF NOT EXISTS propietario_nombre VARCHAR(150);

-- Actualizar la restricción de clave foránea
ALTER TABLE public.ventas
DROP CONSTRAINT ventas_propietario_id_fkey;

ALTER TABLE public.ventas
ADD CONSTRAINT ventas_propietario_id_fkey 
FOREIGN KEY (propietario_id) REFERENCES public.usuarios(id) ON DELETE SET NULL;

-- Agregar validación: al menos uno de propietario_id o propietario_nombre debe estar presente
-- Nota: Las CHECK constraints no pueden hacer esto directamente, se usa en la aplicación

-- Crear índice para búsqueda de propietarios manuales
CREATE INDEX IF NOT EXISTS idx_ventas_propietario_nombre ON public.ventas(propietario_nombre);

-- Actualizar las vistas para incluir propietario_nombre en el caso de propietarios manuales
DROP VIEW IF EXISTS public.reporte_propietarios_ingresos CASCADE;

CREATE OR REPLACE VIEW public.reporte_propietarios_ingresos AS
SELECT 
    COALESCE(v.propietario_id, 0) as propietario_id,
    COALESCE(u.nombres, v.propietario_nombre) as propietario_nombre,
    COUNT(*) as total_ventas,
    SUM(v.total) as total_ingreso,
    AVG(v.total) as promedio_venta
FROM public.ventas v
LEFT JOIN public.usuarios u ON v.propietario_id = u.id
GROUP BY v.propietario_id, u.nombres, v.propietario_nombre;
