-- =====================================================
-- VERIFICACIÓN Y CORRECCIÓN: Soporte para Propietarios Manuales
-- =====================================================

-- Verificar e insertar la columna propietario_nombre si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ventas' AND column_name = 'propietario_nombre'
  ) THEN
    ALTER TABLE public.ventas
    ADD COLUMN propietario_nombre VARCHAR(150);
    
    RAISE NOTICE 'Columna propietario_nombre agregada exitosamente';
  ELSE
    RAISE NOTICE 'Columna propietario_nombre ya existe';
  END IF;
END $$;

-- Verificar que propietario_id sea nullable
ALTER TABLE public.ventas
ALTER COLUMN propietario_id DROP NOT NULL;

-- Eliminar la restricción anterior si existe
ALTER TABLE public.ventas
DROP CONSTRAINT IF EXISTS ventas_propietario_id_fkey;

-- Agregar nueva restricción ON DELETE SET NULL
ALTER TABLE public.ventas
ADD CONSTRAINT ventas_propietario_id_fkey 
FOREIGN KEY (propietario_id) REFERENCES public.usuarios(id) ON DELETE SET NULL;

-- Crear índice para propietario_nombre
CREATE INDEX IF NOT EXISTS idx_ventas_propietario_nombre ON public.ventas(propietario_nombre);

-- Recrear vista para incluir propietario_nombre
DROP VIEW IF EXISTS public.reporte_propietarios_ingresos CASCADE;

CREATE OR REPLACE VIEW public.reporte_propietarios_ingresos AS
SELECT 
    COALESCE(v.propietario_id, 0) as propietario_id,
    COALESCE(u.nombres, v.propietario_nombre, 'Propietario Desconocido') as propietario_nombre,
    COUNT(*) as total_ventas,
    SUM(v.total) as total_ingreso,
    ROUND(AVG(v.total), 2) as promedio_venta
FROM public.ventas v
LEFT JOIN public.usuarios u ON v.propietario_id = u.id
GROUP BY v.propietario_id, u.nombres, v.propietario_nombre
ORDER BY total_ingreso DESC;
