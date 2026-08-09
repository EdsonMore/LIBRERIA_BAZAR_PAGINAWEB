-- Migración: Optimización de consultas para reducir consumo en Neon
-- ADITIVA: solo agrega extensiones e índices, no modifica datos existentes.

-- Extensión para búsquedas rápidas con ILIKE '%...%' (búsqueda por texto)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Índice trigram para la búsqueda de productos por nombre (usado en /api/productos?q=)
CREATE INDEX IF NOT EXISTS idx_productos_nombre_trgm
    ON public.productos USING gin (nombre gin_trgm_ops);

-- Índice trigram para la búsqueda por descripción
CREATE INDEX IF NOT EXISTS idx_productos_descripcion_trgm
    ON public.productos USING gin (descripcion gin_trgm_ops);

-- Índice compuesto para filtrado por categoría + disponibilidad (tienda /api/productos?categoria=)
CREATE INDEX IF NOT EXISTS idx_productos_categoria_disponible
    ON public.productos (categoria_id, disponible);

-- Índice compuesto para listados de la tienda (disponible + stock)
CREATE INDEX IF NOT EXISTS idx_productos_disponible_stock
    ON public.productos (disponible, stock);