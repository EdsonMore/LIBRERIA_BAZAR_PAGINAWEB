-- Migración: Agregar campo de código de barras a productos
-- ADITIVA: no elimina ni modifica datos existentes. Ejecutar una sola vez en Neon.

ALTER TABLE public.productos
    ADD COLUMN IF NOT EXISTS codigo_barras character varying(60);

-- Índice único para búsqueda rápida por código de barras.
-- PostgreSQL permite múltiples NULL en una columna con índice único,
-- por lo que los productos sin código no se bloquean entre sí.
CREATE UNIQUE INDEX IF NOT EXISTS idx_productos_codigo_barras
    ON public.productos (codigo_barras);