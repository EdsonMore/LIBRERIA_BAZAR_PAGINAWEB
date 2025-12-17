    -- =====================================================
    -- TABLA: PRODUCTOS_BUSCADOS (Lista de Compra)
    -- Descripción: Trackea qué productos buscan clientes pero no existen
    -- =====================================================

    CREATE TABLE IF NOT EXISTS public.productos_buscados (
        id BIGSERIAL PRIMARY KEY,
        
        -- Información del producto buscado
        nombre VARCHAR(255) NOT NULL UNIQUE,
        veces_buscado INTEGER DEFAULT 1,
        
        -- Información del cliente que buscó
        usuario_id BIGINT,
        cliente_nombre VARCHAR(150),
        cliente_email VARCHAR(150),
        cliente_telefono VARCHAR(20),
        
        -- Tracking
        primera_busqueda TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        ultima_busqueda TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        -- Restricciones
        CONSTRAINT productos_buscados_veces_positivo CHECK (veces_buscado > 0),
        FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE SET NULL
    );

    -- Índices
    CREATE INDEX IF NOT EXISTS idx_productos_buscados_nombre ON public.productos_buscados(nombre);
    CREATE INDEX IF NOT EXISTS idx_productos_buscados_veces ON public.productos_buscados(veces_buscado DESC);
    CREATE INDEX IF NOT EXISTS idx_productos_buscados_ultima_busqueda ON public.productos_buscados(ultima_busqueda DESC);

    -- =====================================================
    -- VISTA: LISTA_COMPRA_PRIORIDAD
    -- Descripción: Productos más solicitados (ordenados por demanda)
    -- =====================================================
    CREATE OR REPLACE VIEW public.lista_compra_prioridad AS
    SELECT 
        id,
        nombre,
        veces_buscado,
        ultima_busqueda,
        CASE 
            WHEN veces_buscado >= 10 THEN 'URGENTE'
            WHEN veces_buscado >= 5 THEN 'ALTA'
            WHEN veces_buscado >= 2 THEN 'MEDIA'
            ELSE 'BAJA'
        END as prioridad,
        EXTRACT(DAY FROM (CURRENT_TIMESTAMP - ultima_busqueda)) as dias_desde_ultima_busqueda
    FROM public.productos_buscados
    ORDER BY veces_buscado DESC, ultima_busqueda DESC;

    -- =====================================================
    -- COMENTARIOS DESCRIPTIVOS
    -- =====================================================

    COMMENT ON TABLE public.productos_buscados IS 
    'Registra búsquedas de productos que NO existen en la BD.
    Útil para decidir qué productos comprar/agregar.
    Es diferente a productos_solicitados (que son ventas manuales).';

    COMMENT ON COLUMN public.productos_buscados.nombre IS 
    'Nombre del producto que el cliente buscó';

    COMMENT ON COLUMN public.productos_buscados.veces_buscado IS 
    'Contador de cuántas veces fue solicitado este producto';

    COMMENT ON COLUMN public.productos_buscados.usuario_id IS 
    'Si fue un cliente del sistema, su ID';

    COMMENT ON COLUMN public.productos_buscados.ultima_busqueda IS 
    'Última fecha cuando alguien buscó este producto';
