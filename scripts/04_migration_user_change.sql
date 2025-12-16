-- Migración para agregar campo de última fecha de cambio de usuario

ALTER TABLE public.usuarios
ADD COLUMN IF NOT EXISTS ultima_fecha_cambio_user timestamp without time zone DEFAULT NULL;

-- Agregar comentario para documentar
COMMENT ON COLUMN public.usuarios.ultima_fecha_cambio_user IS 'Fecha del último cambio de nombre de usuario. Controla el intervalo de 30 días entre cambios.';
