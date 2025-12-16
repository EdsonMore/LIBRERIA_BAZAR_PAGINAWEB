CREATE TABLE IF NOT EXISTS contactos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  correo VARCHAR(100) NOT NULL,
  telefono VARCHAR(20),
  asunto VARCHAR(100),
  mensaje TEXT NOT NULL,
  fecha_envio TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  estado VARCHAR(20) DEFAULT 'NUEVO',
  respuesta TEXT,
  fecha_respuesta TIMESTAMP WITHOUT TIME ZONE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_contactos_fecha
  ON contactos (fecha_envio);

CREATE INDEX IF NOT EXISTS idx_contactos_estado
  ON contactos (estado);


CREATE TABLE IF NOT EXISTS libro_reclamaciones (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  telefono VARCHAR(20),
  tipo_documento VARCHAR(50),
  numero_documento VARCHAR(20) NOT NULL,
  direccion TEXT,
  tipo_solicitud VARCHAR(50),
  fecha_incidente DATE,
  detalle TEXT NOT NULL,
  expediente VARCHAR(50) NOT NULL UNIQUE,
  estado VARCHAR(20) DEFAULT 'REGISTRADO',
  fecha_registro TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  respuesta TEXT,
  fecha_respuesta TIMESTAMP WITHOUT TIME ZONE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_libro_expediente
  ON libro_reclamaciones (expediente);

CREATE INDEX IF NOT EXISTS idx_libro_email
  ON libro_reclamaciones (email);

CREATE INDEX IF NOT EXISTS idx_libro_estado
  ON libro_reclamaciones (estado);

CREATE INDEX IF NOT EXISTS idx_libro_fecha
  ON libro_reclamaciones (fecha_registro);
