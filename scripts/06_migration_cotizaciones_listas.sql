-- Script de migración para Módulo de Cotización de Listas Escolares
-- Fecha: 2025-12-16
-- NOTA: Asegúrate de reemplazar "usuario" con el nombre correcto de tu tabla de usuarios

-- Tabla principal de solicitudes de cotización
CREATE TABLE IF NOT EXISTS cotizacion_listas (
    id BIGSERIAL PRIMARY KEY,
    usuario_id BIGINT NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    archivo_url VARCHAR(500),
    tipo_archivo VARCHAR(50), -- pdf, image (jpg/png), word (docx)
    texto_extraido TEXT, -- Texto extraído del archivo para matching
    estado VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE', -- PENDIENTE, EN_COTIZACION, COTIZADO, ENVIADO
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- NOTA: Descomentar la línea siguiente si la tabla de usuarios existe
    CONSTRAINT fk_cotizacion_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabla de items en cada cotización
CREATE TABLE IF NOT EXISTS cotizacion_items (
    id BIGSERIAL PRIMARY KEY,
    cotizacion_id BIGINT NOT NULL,
    producto_id BIGINT, -- NULL si no se encontró en BD
    nombre_producto VARCHAR(255) NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL, -- cantidad * precio_unitario
    encontrado_en_bd BOOLEAN DEFAULT FALSE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cotizacion_item FOREIGN KEY (cotizacion_id) REFERENCES cotizacion_listas(id) ON DELETE CASCADE,
    -- NOTA: Descomentar la siguiente línea si la tabla "producto" existe
    CONSTRAINT fk_producto FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE SET NULL
);

-- Tabla de cotizaciones generadas (histórico con PDFs)
CREATE TABLE IF NOT EXISTS cotizacion_generada (
    id BIGSERIAL PRIMARY KEY,
    cotizacion_id BIGINT NOT NULL UNIQUE,
    pdf_url VARCHAR(500),
    imagen_url VARCHAR(500),
    total DECIMAL(10, 2) NOT NULL,
    observaciones TEXT,
    fecha_generacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cotizacion_generada FOREIGN KEY (cotizacion_id) REFERENCES cotizacion_listas(id) ON DELETE CASCADE
);

-- Tabla de auditoría para envíos
CREATE TABLE IF NOT EXISTS cotizacion_envios (
    id BIGSERIAL PRIMARY KEY,
    cotizacion_id BIGINT NOT NULL,
    metodo_envio VARCHAR(50), -- EMAIL, WHATSAPP, DESCARGA
    enviado_a VARCHAR(255),
    fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado_envio VARCHAR(50) DEFAULT 'COMPLETADO',
    CONSTRAINT fk_envio_cotizacion FOREIGN KEY (cotizacion_id) REFERENCES cotizacion_listas(id) ON DELETE CASCADE
);

-- Índices para optimizar búsquedas
CREATE INDEX idx_cotizacion_usuario ON cotizacion_listas(usuario_id);
CREATE INDEX idx_cotizacion_estado ON cotizacion_listas(estado);
CREATE INDEX idx_cotizacion_items ON cotizacion_items(cotizacion_id);
CREATE INDEX idx_cotizacion_producto ON cotizacion_items(producto_id);
