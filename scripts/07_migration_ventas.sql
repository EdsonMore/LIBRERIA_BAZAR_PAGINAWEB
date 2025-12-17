-- =====================================================
-- MIGRATION: MÓDULO DE REGISTRO DE VENTAS
-- Descripción: Tablas para registrar ventas de forma ordenada
--              con soporte para productos existentes y no existentes
-- =====================================================

-- Tipo enumerado para métodos de pago
CREATE TYPE public.metodo_pago_enum AS ENUM (
    'EFECTIVO',
    'YAPE',
    'PLIN',
    'TRANSFERENCIA',
    'OTRO'
);

-- =====================================================
-- TABLA: VENTAS
-- Descripción: Registro principal de cada venta
-- =====================================================
CREATE TABLE IF NOT EXISTS public.ventas (
    id BIGSERIAL PRIMARY KEY,
    
    -- Datos de la venta
    fecha_hora TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    vendedor_id BIGINT NOT NULL,
    propietario_id BIGINT NOT NULL,
    metodo_pago public.metodo_pago_enum NOT NULL,
    descripcion_metodo_otro VARCHAR(255),
    
    -- Datos del cliente (opcional - puede ser anónimo)
    cliente_id BIGINT,
    cliente_nombre VARCHAR(150),
    cliente_email VARCHAR(150),
    cliente_telefono VARCHAR(20),
    
    -- Totales
    subtotal NUMERIC(10,2) NOT NULL,
    descuento NUMERIC(10,2) DEFAULT 0,
    total NUMERIC(10,2) NOT NULL,
    
    -- Auditoría
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Restricciones
    CONSTRAINT ventas_total_positivo CHECK (total >= 0),
    CONSTRAINT ventas_subtotal_positivo CHECK (subtotal >= 0),
    CONSTRAINT ventas_descuento_positivo CHECK (descuento >= 0),
    FOREIGN KEY (vendedor_id) REFERENCES public.usuarios(id),
    FOREIGN KEY (propietario_id) REFERENCES public.usuarios(id),
    FOREIGN KEY (cliente_id) REFERENCES public.usuarios(id)
);

CREATE INDEX idx_ventas_fecha ON public.ventas(fecha_hora);
CREATE INDEX idx_ventas_vendedor ON public.ventas(vendedor_id);
CREATE INDEX idx_ventas_propietario ON public.ventas(propietario_id);
CREATE INDEX idx_ventas_cliente ON public.ventas(cliente_id);

-- =====================================================
-- TABLA: DETALLES_VENTA
-- Descripción: Detalle de productos por cada venta
--              Puede usar producto_id (existente) o guardar datos manuales
-- =====================================================
CREATE TABLE IF NOT EXISTS public.detalles_venta (
    id BIGSERIAL PRIMARY KEY,
    venta_id BIGINT NOT NULL,
    
    -- Producto existente (opcional)
    producto_id INTEGER,
    
    -- Datos del producto
    nombre_producto VARCHAR(255) NOT NULL,
    cantidad INTEGER NOT NULL,
    precio_unitario NUMERIC(10,2) NOT NULL,
    subtotal NUMERIC(10,2) NOT NULL,
    
    -- Flags para identificar tipo de producto
    es_producto_existente BOOLEAN DEFAULT false,
    
    -- Auditoría
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Restricciones
    CONSTRAINT detalles_venta_cantidad_positiva CHECK (cantidad > 0),
    CONSTRAINT detalles_venta_precio_positivo CHECK (precio_unitario > 0),
    CONSTRAINT detalles_venta_subtotal_valido CHECK (subtotal = cantidad * precio_unitario),
    FOREIGN KEY (venta_id) REFERENCES public.ventas(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES public.productos(id)
);

CREATE INDEX idx_detalles_venta_venta ON public.detalles_venta(venta_id);
CREATE INDEX idx_detalles_venta_producto ON public.detalles_venta(producto_id);

-- =====================================================
-- TABLA: PRODUCTOS_SOLICITADOS
-- Descripción: Registro de productos NO existentes que fueron vendidos
--              Útil para identificar productos más solicitados
-- =====================================================
CREATE TABLE IF NOT EXISTS public.productos_solicitados (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL UNIQUE,
    cantidad_veces_solicitado INTEGER DEFAULT 1,
    ultima_fecha_solicitud TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Auditoría
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Restricciones
    CONSTRAINT productos_solicitados_cantidad_positiva CHECK (cantidad_veces_solicitado > 0)
);

CREATE INDEX idx_productos_solicitados_nombre ON public.productos_solicitados(nombre);
CREATE INDEX idx_productos_solicitados_fecha ON public.productos_solicitados(ultima_fecha_solicitud);

-- =====================================================
-- TABLA: PRODUCTOS_TEMPORALES (Opcional, para análisis detallado)
-- Descripción: Copia de productos no existentes vendidos
--              Permite análisis histórico sin perder datos
-- =====================================================
CREATE TABLE IF NOT EXISTS public.productos_temporales (
    id BIGSERIAL PRIMARY KEY,
    detalle_venta_id BIGINT NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    cantidad INTEGER NOT NULL,
    precio_unitario NUMERIC(10,2) NOT NULL,
    
    -- Auditoría
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (detalle_venta_id) REFERENCES public.detalles_venta(id) ON DELETE CASCADE
);

-- =====================================================
-- VISTA: REPORTE_VENTAS_DIARIAS
-- Descripción: Consolidado diario de ventas por vendedor
-- =====================================================
CREATE OR REPLACE VIEW public.reporte_ventas_diarias AS
SELECT 
    DATE(v.fecha_hora) as fecha,
    v.vendedor_id,
    u.nombres as vendedor_nombre,
    COUNT(v.id) as total_ventas,
    SUM(v.total) as total_ingreso,
    AVG(v.total) as promedio_venta,
    v.metodo_pago
FROM public.ventas v
LEFT JOIN public.usuarios u ON v.vendedor_id = u.id
GROUP BY DATE(v.fecha_hora), v.vendedor_id, u.nombres, v.metodo_pago;

-- =====================================================
-- VISTA: REPORTE_PROPIETARIOS_INGRESOS
-- Descripción: Ingresos por propietario de producto
-- =====================================================
CREATE OR REPLACE VIEW public.reporte_propietarios_ingresos AS
SELECT 
    v.propietario_id,
    u.nombres as propietario_nombre,
    COUNT(v.id) as total_ventas,
    SUM(v.total) as total_ingresos,
    AVG(v.total) as promedio_venta
FROM public.ventas v
LEFT JOIN public.usuarios u ON v.propietario_id = u.id
GROUP BY v.propietario_id, u.nombres;

-- =====================================================
-- VISTA: REPORTE_PRODUCTOS_MAS_VENDIDOS
-- Descripción: Productos existentes más vendidos
-- =====================================================
CREATE OR REPLACE VIEW public.reporte_productos_mas_vendidos AS
SELECT 
    p.id,
    p.nombre,
    SUM(dv.cantidad) as total_cantidad,
    SUM(dv.subtotal) as total_ingreso,
    COUNT(DISTINCT dv.venta_id) as veces_vendido
FROM public.detalles_venta dv
LEFT JOIN public.productos p ON dv.producto_id = p.id
WHERE dv.es_producto_existente = true AND dv.producto_id IS NOT NULL
GROUP BY p.id, p.nombre
ORDER BY total_cantidad DESC;

-- =====================================================
-- VISTA: REPORTE_METODOS_PAGO
-- Descripción: Resumen de métodos de pago utilizados
-- =====================================================
CREATE OR REPLACE VIEW public.reporte_metodos_pago AS
SELECT 
    v.metodo_pago,
    COUNT(v.id) as cantidad_transacciones,
    SUM(v.total) as total_monto,
    AVG(v.total) as promedio_transaccion
FROM public.ventas v
GROUP BY v.metodo_pago;

-- Comentarios de documentación
COMMENT ON TABLE public.ventas IS 'Registro principal de todas las ventas. Inmutable una vez creada.';
COMMENT ON TABLE public.detalles_venta IS 'Detalle de productos por venta. Soporta productos existentes y no existentes.';
COMMENT ON TABLE public.productos_solicitados IS 'Registro de productos no existentes solicitados (vendidos).';
COMMENT ON TABLE public.productos_temporales IS 'Historial de productos temporales vendidos.';
