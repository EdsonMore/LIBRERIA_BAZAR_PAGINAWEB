-- Migration: Agregar campo ultima_conexion a la tabla usuarios
-- Propósito: Registrar la última fecha y hora en que cada usuario inició sesión

ALTER TABLE public.usuarios
ADD COLUMN IF NOT EXISTS ultima_conexion timestamp without time zone DEFAULT NULL;

-- Crear índice para optimizar búsquedas/ordenamiento por última conexión
CREATE INDEX IF NOT EXISTS idx_usuarios_ultima_conexion ON public.usuarios(ultima_conexion DESC NULLS LAST);

-- Verificación
-- SELECT id, user, nombres, ultima_conexion FROM usuarios ORDER BY ultima_conexion DESC NULLS LAST;
