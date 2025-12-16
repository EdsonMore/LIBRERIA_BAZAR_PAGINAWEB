
-- Tipos enumerados
CREATE TYPE public.estado_compra_enum AS ENUM (
    'PENDIENTE',
    'CONFIRMADA',
    'PREPARANDO',
    'ENVIADA',
    'DESPACHADO',
    'ENTREGADA',
    'CANCELADA'
);

CREATE TYPE public.tipo_doc_enum AS ENUM (
    'DNI',
    'CARNET_EXTRANJERIA',
    'PASAPORTE'
);

-- Tablas
CREATE TABLE public.boletas (
    id bigint NOT NULL,
    compra_id bigint NOT NULL,
    usuario_id bigint NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    igv numeric(10,2) DEFAULT 0,
    igv_activo boolean DEFAULT false,
    costo_envio numeric(10,2) DEFAULT 0,
    envio_activo boolean DEFAULT false,
    total numeric(10,2) NOT NULL,
    fecha_generacion timestamp without time zone NOT NULL,
    numero_boleta character varying(50) GENERATED ALWAYS AS (('BOL-'::text || lpad((id)::text, 10, '0'::text))) STORED,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    tipo_boleta character varying(20) DEFAULT 'CLIENTE'::character varying
);

CREATE TABLE public.categorias (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion character varying(255),
    activa boolean DEFAULT true,
    imagen text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.compras (
    id bigint NOT NULL,
    usuario_id bigint NOT NULL,
    fecha_compra timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    igv numeric(10,2) DEFAULT 0,
    igv_activo boolean DEFAULT true,
    costo_envio numeric(10,2) DEFAULT 0,
    envio_activo boolean DEFAULT true,
    total numeric(10,2) NOT NULL,
    metodo_pago character varying(50) NOT NULL,
    estado public.estado_compra_enum DEFAULT 'PENDIENTE'::public.estado_compra_enum,
    direccion_entrega character varying(500) NOT NULL,
    numero_seguimiento character varying(100),
    motivo_rechazo text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.comprobantes_pago (
    id bigint NOT NULL,
    compra_id bigint NOT NULL,
    usuario_id bigint NOT NULL,
    archivo_url text NOT NULL,
    metodo_pago character varying(50) NOT NULL,
    fecha_carga timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.configuracion_sistema (
    id integer NOT NULL,
    aplicar_igv boolean DEFAULT true,
    porcentaje_igv numeric(5,2) DEFAULT 18.00,
    aplicar_envio boolean DEFAULT true,
    costo_envio numeric(10,2) DEFAULT 15.00,
    nombre_empresa character varying(200),
    direccion_empresa character varying(500),
    telefono_empresa character varying(50),
    email_empresa character varying(150),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.detalles_compra (
    id bigint NOT NULL,
    compra_id bigint NOT NULL,
    producto_id integer NOT NULL,
    cantidad integer NOT NULL,
    precio_unitario numeric(10,2) NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.item_carrito (
    id bigint NOT NULL,
    usuario_id bigint NOT NULL,
    producto_id integer NOT NULL,
    cantidad integer DEFAULT 1 NOT NULL,
    fecha_agregado timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE public.notificaciones (
    id bigint NOT NULL,
    usuario_id bigint NOT NULL,
    compra_id bigint NOT NULL,
    titulo character varying(200) NOT NULL,
    mensaje text NOT NULL,
    tipo character varying(50),
    leida boolean DEFAULT false,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fecha_lectura timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.permisos (
    id bigint NOT NULL,
    codigo character varying(100) NOT NULL,
    nombre character varying(150),
    descripcion character varying(255),
    categoria character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.productos (
    id integer NOT NULL,
    nombre character varying(150) NOT NULL,
    categoria_id integer NOT NULL,
    precio numeric(10,2) NOT NULL,
    stock integer DEFAULT 0 NOT NULL,
    disponible boolean DEFAULT true,
    imagen text,
    descripcion character varying(500),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.resenas (
    id bigint NOT NULL,
    usuario_id bigint NOT NULL,
    producto_id integer NOT NULL,
    calificacion integer NOT NULL,
    comentario text NOT NULL,
    estado character varying(20) DEFAULT 'PENDIENTE'::character varying,
    fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT resenas_calificacion_check CHECK (((calificacion >= 1) AND (calificacion <= 5)))
);

CREATE TABLE public.rol_permisos (
    rol_id bigint NOT NULL,
    permiso_id bigint NOT NULL
);

CREATE TABLE public.roles (
    id bigint NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion character varying(255),
    activo boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.ruta_roles (
    ruta_id bigint NOT NULL,
    rol_id bigint NOT NULL
);

CREATE TABLE public.rutas (
    id bigint NOT NULL,
    ruta character varying(255) NOT NULL,
    metodo character varying(20) NOT NULL,
    descripcion character varying(500),
    es_publica boolean DEFAULT false,
    categoria character varying(50),
    activa boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.usuario_roles (
    usuario_id bigint NOT NULL,
    rol_id bigint NOT NULL
);

CREATE TABLE public.usuarios (
    id bigint NOT NULL,
    "user" character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    correo character varying(150) NOT NULL,
    nombres character varying(100),
    apellido_paterno character varying(100),
    apellido_materno character varying(100),
    direccion1 character varying(255),
    direccion2 character varying(255),
    numero character varying(20),
    genero character varying(10),
    dni character varying(20),
    fecha_nacimiento date,
    fecha_registro timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    tipo_doc public.tipo_doc_enum DEFAULT 'DNI'::public.tipo_doc_enum,
    activo boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- Secuencias
CREATE SEQUENCE public.comprobantes_pago_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.boletas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.categorias_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.compras_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.configuracion_sistema_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.detalles_compra_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.item_carrito_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.notificaciones_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.permisos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.productos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.resenas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.roles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.rutas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.usuarios_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Asignar secuencias a columnas
ALTER SEQUENCE public.comprobantes_pago_id_seq OWNED BY public.comprobantes_pago.id;
ALTER SEQUENCE public.boletas_id_seq OWNED BY public.boletas.id;
ALTER SEQUENCE public.categorias_id_seq OWNED BY public.categorias.id;
ALTER SEQUENCE public.compras_id_seq OWNED BY public.compras.id;
ALTER SEQUENCE public.configuracion_sistema_id_seq OWNED BY public.configuracion_sistema.id;
ALTER SEQUENCE public.detalles_compra_id_seq OWNED BY public.detalles_compra.id;
ALTER SEQUENCE public.item_carrito_id_seq OWNED BY public.item_carrito.id;
ALTER SEQUENCE public.notificaciones_id_seq OWNED BY public.notificaciones.id;
ALTER SEQUENCE public.permisos_id_seq OWNED BY public.permisos.id;
ALTER SEQUENCE public.productos_id_seq OWNED BY public.productos.id;
ALTER SEQUENCE public.resenas_id_seq OWNED BY public.resenas.id;
ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;
ALTER SEQUENCE public.rutas_id_seq OWNED BY public.rutas.id;
ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;

-- Valores por defecto
ALTER TABLE ONLY public.comprobantes_pago ALTER COLUMN id SET DEFAULT nextval('public.comprobantes_pago_id_seq'::regclass);
ALTER TABLE ONLY public.boletas ALTER COLUMN id SET DEFAULT nextval('public.boletas_id_seq'::regclass);
ALTER TABLE ONLY public.categorias ALTER COLUMN id SET DEFAULT nextval('public.categorias_id_seq'::regclass);
ALTER TABLE ONLY public.compras ALTER COLUMN id SET DEFAULT nextval('public.compras_id_seq'::regclass);
ALTER TABLE ONLY public.configuracion_sistema ALTER COLUMN id SET DEFAULT nextval('public.configuracion_sistema_id_seq'::regclass);
ALTER TABLE ONLY public.detalles_compra ALTER COLUMN id SET DEFAULT nextval('public.detalles_compra_id_seq'::regclass);
ALTER TABLE ONLY public.item_carrito ALTER COLUMN id SET DEFAULT nextval('public.item_carrito_id_seq'::regclass);
ALTER TABLE ONLY public.notificaciones ALTER COLUMN id SET DEFAULT nextval('public.notificaciones_id_seq'::regclass);
ALTER TABLE ONLY public.permisos ALTER COLUMN id SET DEFAULT nextval('public.permisos_id_seq'::regclass);
ALTER TABLE ONLY public.productos ALTER COLUMN id SET DEFAULT nextval('public.productos_id_seq'::regclass);
ALTER TABLE ONLY public.resenas ALTER COLUMN id SET DEFAULT nextval('public.resenas_id_seq'::regclass);
ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);
ALTER TABLE ONLY public.rutas ALTER COLUMN id SET DEFAULT nextval('public.rutas_id_seq'::regclass);
ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);

-- Llaves primarias
ALTER TABLE ONLY public.comprobantes_pago ADD CONSTRAINT comprobantes_pago_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.boletas ADD CONSTRAINT boletas_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.categorias ADD CONSTRAINT categorias_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.compras ADD CONSTRAINT compras_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.configuracion_sistema ADD CONSTRAINT configuracion_sistema_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.detalles_compra ADD CONSTRAINT detalles_compra_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.item_carrito ADD CONSTRAINT item_carrito_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.notificaciones ADD CONSTRAINT notificaciones_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.permisos ADD CONSTRAINT permisos_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.productos ADD CONSTRAINT productos_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.resenas ADD CONSTRAINT resenas_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.rol_permisos ADD CONSTRAINT rol_permisos_pkey PRIMARY KEY (rol_id, permiso_id);
ALTER TABLE ONLY public.roles ADD CONSTRAINT roles_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.ruta_roles ADD CONSTRAINT ruta_roles_pkey PRIMARY KEY (ruta_id, rol_id);
ALTER TABLE ONLY public.rutas ADD CONSTRAINT rutas_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.usuario_roles ADD CONSTRAINT usuario_roles_pkey PRIMARY KEY (usuario_id, rol_id);
ALTER TABLE ONLY public.usuarios ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);

-- Llaves únicas
ALTER TABLE ONLY public.boletas ADD CONSTRAINT boletas_compra_usuario_tipo_unique UNIQUE (compra_id, usuario_id, tipo_boleta);
ALTER TABLE ONLY public.categorias ADD CONSTRAINT categorias_nombre_key UNIQUE (nombre);
ALTER TABLE ONLY public.item_carrito ADD CONSTRAINT item_carrito_usuario_id_producto_id_key UNIQUE (usuario_id, producto_id);
ALTER TABLE ONLY public.permisos ADD CONSTRAINT permisos_codigo_key UNIQUE (codigo);
ALTER TABLE ONLY public.roles ADD CONSTRAINT roles_nombre_key UNIQUE (nombre);
ALTER TABLE ONLY public.rutas ADD CONSTRAINT rutas_ruta_metodo_key UNIQUE (ruta, metodo);
ALTER TABLE ONLY public.usuarios ADD CONSTRAINT usuarios_correo_key UNIQUE (correo);
ALTER TABLE ONLY public.usuarios ADD CONSTRAINT usuarios_dni_key UNIQUE (dni);
ALTER TABLE ONLY public.usuarios ADD CONSTRAINT usuarios_user_key UNIQUE ("user");

-- Índices
CREATE INDEX idx_boletas_compra ON public.boletas USING btree (compra_id);
CREATE INDEX idx_boletas_fecha ON public.boletas USING btree (fecha_generacion);
CREATE INDEX idx_boletas_tipo ON public.boletas USING btree (tipo_boleta);
CREATE INDEX idx_boletas_usuario ON public.boletas USING btree (usuario_id);
CREATE INDEX idx_comprobantes_pago_compra ON public.comprobantes_pago USING btree (compra_id);
CREATE INDEX idx_comprobantes_pago_usuario ON public.comprobantes_pago USING btree (usuario_id);
CREATE INDEX idx_categorias_activa ON public.categorias USING btree (activa);
CREATE INDEX idx_categorias_nombre ON public.categorias USING btree (nombre);
CREATE INDEX idx_compras_estado ON public.compras USING btree (estado);
CREATE INDEX idx_compras_fecha ON public.compras USING btree (fecha_compra);
CREATE INDEX idx_compras_usuario ON public.compras USING btree (usuario_id);
CREATE INDEX idx_detalles_compra_compra ON public.detalles_compra USING btree (compra_id);
CREATE INDEX idx_detalles_compra_producto ON public.detalles_compra USING btree (producto_id);
CREATE INDEX idx_item_carrito_producto ON public.item_carrito USING btree (producto_id);
CREATE INDEX idx_item_carrito_usuario ON public.item_carrito USING btree (usuario_id);
CREATE INDEX idx_notificaciones_fecha ON public.notificaciones USING btree (fecha_creacion);
CREATE INDEX idx_notificaciones_leida ON public.notificaciones USING btree (leida);
CREATE INDEX idx_notificaciones_usuario ON public.notificaciones USING btree (usuario_id);
CREATE INDEX idx_permisos_categoria ON public.permisos USING btree (categoria);
CREATE INDEX idx_permisos_codigo ON public.permisos USING btree (codigo);
CREATE INDEX idx_productos_categoria ON public.productos USING btree (categoria_id);
CREATE INDEX idx_productos_disponible ON public.productos USING btree (disponible);
CREATE INDEX idx_productos_nombre ON public.productos USING btree (nombre);
CREATE INDEX idx_productos_precio ON public.productos USING btree (precio);
CREATE INDEX idx_resenas_estado ON public.resenas USING btree (estado);
CREATE INDEX idx_resenas_fecha ON public.resenas USING btree (fecha);
CREATE INDEX idx_resenas_producto ON public.resenas USING btree (producto_id);
CREATE INDEX idx_resenas_usuario ON public.resenas USING btree (usuario_id);
CREATE INDEX idx_rol_permisos_permiso ON public.rol_permisos USING btree (permiso_id);
CREATE INDEX idx_rol_permisos_rol ON public.rol_permisos USING btree (rol_id);
CREATE INDEX idx_roles_nombre ON public.roles USING btree (nombre);
CREATE INDEX idx_ruta_roles_rol ON public.ruta_roles USING btree (rol_id);
CREATE INDEX idx_ruta_roles_ruta ON public.ruta_roles USING btree (ruta_id);
CREATE INDEX idx_rutas_activa ON public.rutas USING btree (activa);
CREATE INDEX idx_rutas_categoria ON public.rutas USING btree (categoria);
CREATE INDEX idx_rutas_metodo ON public.rutas USING btree (metodo);
CREATE INDEX idx_rutas_ruta ON public.rutas USING btree (ruta);
CREATE INDEX idx_usuario_roles_rol ON public.usuario_roles USING btree (rol_id);
CREATE INDEX idx_usuario_roles_usuario ON public.usuario_roles USING btree (usuario_id);
CREATE INDEX idx_usuarios_activo ON public.usuarios USING btree (activo);
CREATE INDEX idx_usuarios_correo ON public.usuarios USING btree (correo);
CREATE INDEX idx_usuarios_dni ON public.usuarios USING btree (dni);
CREATE INDEX idx_usuarios_user ON public.usuarios USING btree ("user");

-- Llaves foráneas
ALTER TABLE ONLY public.boletas ADD CONSTRAINT boletas_compra_id_fkey FOREIGN KEY (compra_id) REFERENCES public.compras(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.boletas ADD CONSTRAINT boletas_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.comprobantes_pago ADD CONSTRAINT comprobantes_pago_compra_id_fkey FOREIGN KEY (compra_id) REFERENCES public.compras(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.comprobantes_pago ADD CONSTRAINT comprobantes_pago_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.compras ADD CONSTRAINT compras_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE RESTRICT;
ALTER TABLE ONLY public.detalles_compra ADD CONSTRAINT detalles_compra_compra_id_fkey FOREIGN KEY (compra_id) REFERENCES public.compras(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.detalles_compra ADD CONSTRAINT detalles_compra_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id) ON DELETE RESTRICT;
ALTER TABLE ONLY public.item_carrito ADD CONSTRAINT item_carrito_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.item_carrito ADD CONSTRAINT item_carrito_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.notificaciones ADD CONSTRAINT notificaciones_compra_id_fkey FOREIGN KEY (compra_id) REFERENCES public.compras(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.notificaciones ADD CONSTRAINT notificaciones_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.productos ADD CONSTRAINT productos_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categorias(id) ON DELETE RESTRICT;
ALTER TABLE ONLY public.resenas ADD CONSTRAINT resenas_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.resenas ADD CONSTRAINT resenas_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.rol_permisos ADD CONSTRAINT rol_permisos_permiso_id_fkey FOREIGN KEY (permiso_id) REFERENCES public.permisos(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.rol_permisos ADD CONSTRAINT rol_permisos_rol_id_fkey FOREIGN KEY (rol_id) REFERENCES public.roles(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.ruta_roles ADD CONSTRAINT ruta_roles_rol_id_fkey FOREIGN KEY (rol_id) REFERENCES public.roles(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.ruta_roles ADD CONSTRAINT ruta_roles_ruta_id_fkey FOREIGN KEY (ruta_id) REFERENCES public.rutas(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.usuario_roles ADD CONSTRAINT usuario_roles_rol_id_fkey FOREIGN KEY (rol_id) REFERENCES public.roles(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.usuario_roles ADD CONSTRAINT usuario_roles_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;