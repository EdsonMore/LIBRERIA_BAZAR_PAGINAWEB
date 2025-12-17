-- =====================================================
-- MIGRATION: MÓDULO DE GESTIÓN DE DEUDAS
-- Descripción: Agregar soporte para pagos parciales, deudas y seguimiento
-- =====================================================

-- =====================================================
-- 1. ACTUALIZAR TABLA VENTAS - Agregar campos de pago
-- =====================================================
ALTER TABLE public.ventas
ADD COLUMN IF NOT EXISTS monto_pagado NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS saldo_pendiente NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS estado_pago VARCHAR(50) DEFAULT 'PENDIENTE',
ADD CONSTRAINT ventas_monto_pagado_positivo CHECK (monto_pagado >= 0),
ADD CONSTRAINT ventas_saldo_pendiente_positivo CHECK (saldo_pendiente >= 0),
ADD CONSTRAINT ventas_estado_pago_valido CHECK (estado_pago IN ('PAGADO', 'PARCIAL', 'PENDIENTE', 'CANCELADO'));

-- =====================================================
-- 2. CREAR TABLA: PAGOS
-- Descripción: Historial de todos los pagos realizados
-- =====================================================
CREATE TABLE IF NOT EXISTS public.pagos (
    id BIGSERIAL PRIMARY KEY,
    
    -- Relación con la venta
    venta_id BIGINT NOT NULL,
    
    -- Datos del pago
    monto NUMERIC(10,2) NOT NULL,
    metodo_pago public.metodo_pago_enum NOT NULL,
    descripcion_metodo_otro VARCHAR(255),
    
    -- Quién registró el pago
    usuario_id BIGINT NOT NULL,
    
    -- Tipo de pago
    es_pago_inicial BOOLEAN DEFAULT false,
    
    -- Observaciones (ej: para cancelaciones)
    observaciones TEXT,
    
    -- Auditoría
    fecha_hora TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Restricciones
    CONSTRAINT pagos_monto_positivo CHECK (monto > 0),
    FOREIGN KEY (venta_id) REFERENCES public.ventas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE SET NULL
);

CREATE INDEX idx_pagos_venta ON public.pagos(venta_id);
CREATE INDEX idx_pagos_usuario ON public.pagos(usuario_id);
CREATE INDEX idx_pagos_fecha ON public.pagos(fecha_hora);
CREATE INDEX idx_pagos_metodo ON public.pagos(metodo_pago);

-- =====================================================
-- 3. CREAR TABLA: CANCELACIONES_DEUDA (Opcional pero útil)
-- Descripción: Registro de deudas canceladas/anuladas
-- =====================================================
CREATE TABLE IF NOT EXISTS public.cancelaciones_deuda (
    id BIGSERIAL PRIMARY KEY,
    
    -- Relación con la venta
    venta_id BIGINT NOT NULL,
    
    -- Datos de cancelación
    motivo VARCHAR(255) NOT NULL,
    saldo_perdonado NUMERIC(10,2),
    
    -- Quién canceló
    usuario_id BIGINT NOT NULL,
    
    -- Auditoría
    fecha_hora TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Restricciones
    FOREIGN KEY (venta_id) REFERENCES public.ventas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE SET NULL
);

CREATE INDEX idx_cancelaciones_venta ON public.cancelaciones_deuda(venta_id);
CREATE INDEX idx_cancelaciones_fecha ON public.cancelaciones_deuda(fecha_hora);

-- =====================================================
-- 4. VISTA: DEUDAS_PENDIENTES
-- Descripción: Todas las ventas con saldo pendiente
-- =====================================================
CREATE OR REPLACE VIEW public.deudas_pendientes AS
SELECT 
    v.id as venta_id,
    v.fecha_hora as fecha_venta,
    v.cliente_id,
    COALESCE(u.nombres, v.cliente_nombre) as cliente_nombre,
    COALESCE(u.correo, v.cliente_email) as cliente_email,
    v.cliente_telefono,
    v.total as monto_total,
    v.monto_pagado,
    v.saldo_pendiente,
    v.estado_pago,
    v.metodo_pago,
    v.propietario_id,
    EXTRACT(DAY FROM (CURRENT_TIMESTAMP - v.fecha_hora)) as dias_pendiente,
    CASE 
        WHEN v.saldo_pendiente = 0 THEN 'PAGADO'
        WHEN v.saldo_pendiente = v.total THEN 'PENDIENTE'
        ELSE 'PARCIAL'
    END as estado_calculado
FROM public.ventas v
LEFT JOIN public.usuarios u ON v.cliente_id = u.id
WHERE v.saldo_pendiente > 0 AND v.estado_pago != 'CANCELADO'
ORDER BY v.fecha_hora DESC;

-- =====================================================
-- 5. VISTA: RESUMEN_DEUDAS_POR_CLIENTE
-- Descripción: Total de deuda por cliente
-- =====================================================
CREATE OR REPLACE VIEW public.resumen_deudas_por_cliente AS
SELECT 
    v.cliente_id,
    COALESCE(u.nombres, v.cliente_nombre) as cliente_nombre,
    v.cliente_telefono,
    COUNT(v.id) as cantidad_deudas,
    SUM(v.saldo_pendiente) as total_deuda,
    MAX(v.fecha_hora) as ultima_deuda
FROM public.ventas v
LEFT JOIN public.usuarios u ON v.cliente_id = u.id
WHERE v.saldo_pendiente > 0 AND v.estado_pago != 'CANCELADO'
GROUP BY v.cliente_id, u.nombres, v.cliente_nombre, v.cliente_telefono
ORDER BY total_deuda DESC;

-- =====================================================
-- 6. VISTA: RESUMEN_PAGOS_POR_METODO
-- Descripción: Total de pagos recibidos por método
-- =====================================================
CREATE OR REPLACE VIEW public.resumen_pagos_por_metodo AS
SELECT 
    DATE(p.fecha_hora) as fecha,
    p.metodo_pago,
    COUNT(p.id) as cantidad_pagos,
    SUM(p.monto) as total_recibido,
    AVG(p.monto) as promedio_pago
FROM public.pagos p
GROUP BY DATE(p.fecha_hora), p.metodo_pago
ORDER BY fecha DESC, total_recibido DESC;

-- =====================================================
-- 7. VISTA: HISTORIAL_PAGOS_VENTA
-- Descripción: Historial completo de pagos por venta
-- =====================================================
CREATE OR REPLACE VIEW public.historial_pagos_venta AS
SELECT 
    p.id as pago_id,
    p.venta_id,
    p.monto,
    p.metodo_pago,
    p.fecha_hora,
    p.es_pago_inicial,
    u.nombres as usuario_registra,
    v.total as venta_total,
    SUM(p.monto) OVER (PARTITION BY p.venta_id ORDER BY p.fecha_hora) as monto_pagado_acumulado
FROM public.pagos p
LEFT JOIN public.usuarios u ON p.usuario_id = u.id
LEFT JOIN public.ventas v ON p.venta_id = v.id
ORDER BY p.venta_id, p.fecha_hora;

-- =====================================================
-- COMENTARIOS DESCRIPTIVOS
-- =====================================================
COMMENT ON TABLE public.pagos IS 
'Registro de histórico de TODOS los pagos.
Cada pago es un evento inmutable que registra quién pagó, cuánto, cuándo y cómo.
Permite trazabilidad completa de cualquier deuda.';

COMMENT ON COLUMN public.pagos.es_pago_inicial IS 
'TRUE = pago hecho al registrar la venta
FALSE = pago posterior registrado desde panel de deudas';

COMMENT ON TABLE public.cancelaciones_deuda IS 
'Registro de deudas anuladas o perdonadas.
Sirve para auditoría y justificación de cambios de estado.';

COMMENT ON TABLE public.ventas IS 
'UPDATED: Ahora incluye campos de pago y estado.
monto_pagado: Suma de todos los pagos registrados.
saldo_pendiente: total - monto_pagado.
estado_pago: Calculado automáticamente.';

-- =====================================================
-- ÍNDICES ADICIONALES PARA PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_ventas_estado_pago ON public.ventas(estado_pago);
CREATE INDEX IF NOT EXISTS idx_ventas_saldo_pendiente ON public.ventas(saldo_pendiente) 
WHERE saldo_pendiente > 0;
CREATE INDEX IF NOT EXISTS idx_pagos_venta_fecha ON public.pagos(venta_id, fecha_hora);
