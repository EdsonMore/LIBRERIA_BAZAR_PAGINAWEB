# Análisis: API de Deudas - Estructura y Campos Disponibles

## 📋 Resumen General

El sistema de gestión de deudas permite registrar, consultar y procesar pagos de ventas con saldo pendiente. La estructura combina:
- **Tabla `ventas`**: Información principal de cada venta
- **Tabla `detalles_venta`**: Detalle de productos de cada venta
- **Tabla `pagos`**: Historial de todos los pagos realizados
- **Tabla `cancelaciones_deuda`**: Registro de deudas canceladas/anuladas

---

## 🗂️ ENDPOINTS DISPONIBLES

### 1. **GET `/api/deudas` (route.ts)**
**Propósito**: Listar deudas pendientes con filtros

**Query Parameters**:
- `clienteId?: number` - Filtrar por cliente
- `estadoPago?: "PAGADO" | "PARCIAL" | "PENDIENTE" | "CANCELADO"` - Filtrar por estado
- `fechaInicio?: ISO string` - Filtro de rango de fecha
- `fechaFin?: ISO string` - Filtro de rango de fecha
- `busqueda?: string` - Busca en nombre, email, teléfono
- `page?: number` (default: 1)
- `limit?: number` (default: 20)

**Respuesta - Estructura de cada deuda**:
```typescript
{
  venta_id: number,           // ID de la venta
  fecha_hora: timestamp,      // Fecha de la venta
  cliente_id: number | null,  // ID del cliente (puede ser null para anónimo)
  cliente_nombre: string,     // Nombre del cliente
  cliente_email: string,      // Email del cliente
  cliente_telefono: string,   // Teléfono del cliente
  total: number,              // Total de la venta
  monto_pagado: number,       // Monto ya pagado
  saldo_pendiente: number,    // Monto aún adeudado
  estado_pago: string,        // "PAGADO", "PARCIAL", "PENDIENTE", "CANCELADO"
  metodo_pago: string,        // "EFECTIVO", "YAPE", "PLIN", "TRANSFERENCIA", "OTRO"
  propietario_id: number,     // ID del dueño del producto
  propietario_nombre: string, // Nombre del propietario
  dias_pendiente: number      // Días que lleva pendiente
}
```

**Respuesta completa**:
```json
{
  "deudas": [/* array de deudas */],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  },
  "resumen": {
    "totalDeudasPendientes": 5000.50
  }
}
```

---

### 2. **POST `/api/deudas/registrar-pago` (registrar-pago/route.ts)**
**Propósito**: Registrar un pago posterior en una venta

**Body requerido**:
```typescript
{
  ventaId: number,                              // ID de la venta (REQUERIDO)
  monto: number,                                // Monto a pagar (REQUERIDO)
  metodoPago: "EFECTIVO" | "YAPE" | "PLIN" | 
              "TRANSFERENCIA" | "OTRO",         // Método de pago (REQUERIDO)
  descripcionMetodoOtro?: string,               // Requerido si metodoPago = "OTRO"
  usuarioId: number,                            // Quién registra el pago (REQUERIDO)
  observaciones?: string                        // Notas adicionales
}
```

**Respuesta (201)**:
```json
{
  "mensaje": "Pago registrado exitosamente",
  "pagoId": 123,
  "venta": {
    "ventaId": 1,
    "totalVenta": 1000,
    "montoPagado": 600,
    "saldoPendiente": 400,
    "estadoPago": "PARCIAL"
  },
  "pago": {
    "monto": 600,
    "metodoPago": "YAPE",
    "fecha": "2025-12-17T10:30:00Z"
  }
}
```

---

### 3. **GET `/api/deudas/historial` (historial/route.ts)**
**Propósito**: Obtener historial de deudas pagadas y canceladas

**Query Parameters**:
- `tipo?: "PAGADO" | "CANCELADO" | "TODOS"` (default: "TODOS")
- `clienteId?: number`
- `fechaInicio?: ISO string`
- `fechaFin?: ISO string`
- `busqueda?: string`
- `page?: number` (default: 1)
- `limit?: number` (default: 20)

**Respuesta - Estructura**:
```typescript
{
  venta_id: number,
  fecha_hora: timestamp,
  cliente_id: number | null,
  cliente_nombre: string,
  cliente_email: string,
  cliente_telefono: string,
  total: number,
  monto_pagado: number,
  saldo_pendiente: number,
  estado_pago: string,
  metodo_pago: string,
  propietario_id: number,
  propietario_nombre: string,
  cancelacion_motivo: string | null,
  saldo_perdonado: number | null,
  fecha_cancelacion: timestamp | null,
  tipo_deuda: "Pagada" | "Cancelada" | "Otro"
}
```

---

### 4. **POST `/api/deudas/cancelar` (cancelar/route.ts)**
**Propósito**: Cancelar/anular una deuda existente

**Body requerido**:
```typescript
{
  ventaId: number,                  // ID de la venta (REQUERIDO)
  motivo: string,                   // Razón de cancelación (REQUERIDO)
  saldoPerdonado?: number,          // Monto perdonado (default: saldo completo)
  usuarioId: number                 // Quién cancela (REQUERIDO)
}
```

---

## 🗄️ ESQUEMA DE BASE DE DATOS

### Tabla: `ventas`
**Descripción**: Registro principal de cada venta

| Campo | Tipo | Descripción |
|-------|------|-------------|
| **id** | BIGSERIAL | Identificador único (PK) |
| fecha_hora | TIMESTAMP | Fecha y hora de la venta |
| vendedor_id | BIGINT | Quién realizó la venta (FK → usuarios) |
| propietario_id | BIGINT | Dueño del producto (FK → usuarios) |
| metodo_pago | metodo_pago_enum | EFECTIVO, YAPE, PLIN, TRANSFERENCIA, OTRO |
| descripcion_metodo_otro | VARCHAR(255) | Descripción si metodo_pago = "OTRO" |
| cliente_id | BIGINT | Cliente (puede ser null para anónimo) (FK → usuarios) |
| cliente_nombre | VARCHAR(150) | Nombre del cliente |
| cliente_email | VARCHAR(150) | Email del cliente |
| cliente_telefono | VARCHAR(20) | Teléfono del cliente |
| subtotal | NUMERIC(10,2) | Suma de productos sin descuento |
| descuento | NUMERIC(10,2) | Descuento aplicado |
| total | NUMERIC(10,2) | Total de la venta |
| **monto_pagado** | NUMERIC(10,2) | **Dinero ya recibido** |
| **saldo_pendiente** | NUMERIC(10,2) | **Total - monto_pagado** |
| **estado_pago** | VARCHAR(50) | **PAGADO, PARCIAL, PENDIENTE, CANCELADO** |
| created_at | TIMESTAMP | Fecha de creación |
| updated_at | TIMESTAMP | Última actualización |

**Índices importantes**:
- `idx_ventas_estado_pago` - Para filtros rápidos
- `idx_ventas_saldo_pendiente` - Deudas pendientes
- `idx_ventas_propietario` - Por propietario

---

### Tabla: `detalles_venta`
**Descripción**: Detalle de productos de cada venta

| Campo | Tipo | Descripción |
|-------|------|-------------|
| **id** | BIGSERIAL | Identificador único (PK) |
| **venta_id** | BIGINT | Venta a la que pertenece (FK → ventas) |
| **producto_id** | INTEGER | Producto existente (FK → productos) (opcional) |
| **nombre_producto** | VARCHAR(255) | **Nombre del producto** |
| **cantidad** | INTEGER | **Cantidad vendida** |
| **precio_unitario** | NUMERIC(10,2) | **Precio por unidad** |
| **subtotal** | NUMERIC(10,2) | cantidad × precio_unitario |
| es_producto_existente | BOOLEAN | ¿Es un producto del catálogo? |
| created_at | TIMESTAMP | Fecha de creación |

**Relación con productos**:
- Si `es_producto_existente = true` y `producto_id` está presente → producto del catálogo
- Si `es_producto_existente = false` → producto temporal/manual

**Constraint**: `subtotal = cantidad * precio_unitario`

---

### Tabla: `pagos`
**Descripción**: Historial de todos los pagos realizados

| Campo | Tipo | Descripción |
|-------|------|-------------|
| **id** | BIGSERIAL | Identificador único (PK) |
| **venta_id** | BIGINT | Venta a la que corresponde (FK → ventas) |
| **monto** | NUMERIC(10,2) | Cantidad pagada |
| metodo_pago | metodo_pago_enum | Cómo se pagó |
| descripcion_metodo_otro | VARCHAR(255) | Si metodo_pago = "OTRO" |
| usuario_id | BIGINT | Quién registró el pago (FK → usuarios) |
| es_pago_inicial | BOOLEAN | true = pago al crear venta, false = pago posterior |
| observaciones | TEXT | Notas adicionales |
| fecha_hora | TIMESTAMP | Cuándo se realizó el pago |
| created_at | TIMESTAMP | Creación del registro |

**Índices**:
- `idx_pagos_venta` - Por venta
- `idx_pagos_venta_fecha` - Para historial completo

---

### Tabla: `cancelaciones_deuda`
**Descripción**: Registro de deudas canceladas/anuladas

| Campo | Tipo | Descripción |
|-------|------|-------------|
| **id** | BIGSERIAL | Identificador único (PK) |
| **venta_id** | BIGINT | Venta cancelada (FK → ventas) |
| **motivo** | VARCHAR(255) | Razón de cancelación |
| saldo_perdonado | NUMERIC(10,2) | Monto no cobrado |
| usuario_id | BIGINT | Quién canceló (FK → usuarios) |
| fecha_hora | TIMESTAMP | Cuándo se canceló |
| created_at | TIMESTAMP | Creación del registro |

---

## 📊 VISTAS ÚTILES

### Vista: `deudas_pendientes`
```sql
SELECT venta_id, fecha_venta, cliente_id, cliente_nombre, cliente_email, 
       cliente_telefono, monto_total, monto_pagado, saldo_pendiente, 
       estado_pago, metodo_pago, propietario_id, dias_pendiente, estado_calculado
```

### Vista: `historial_pagos_venta`
```sql
SELECT pago_id, venta_id, monto, metodo_pago, fecha_hora, 
       es_pago_inicial, usuario_registra, venta_total, monto_pagado_acumulado
```

---

## 💡 INFORMACIÓN PARA MODAL DE PAGO

### Datos disponibles para mostrar en el modal:

#### **Información del Cliente**:
- `cliente_nombre` - Nombre del cliente
- `cliente_email` - Email del contacto
- `cliente_telefono` - Teléfono

#### **Información del Propietario**:
- `propietario_id` - ID del dueño
- `propietario_nombre` - Nombre del propietario
- Se obtiene vía JOIN con tabla `usuarios`

#### **Resumen de la Venta**:
- `total` - Monto total
- `monto_pagado` - Ya pagado
- `saldo_pendiente` - Pendiente de cobrar
- `estado_pago` - Estado actual
- `fecha_hora` - Cuándo se realizó

#### **Detalles de Productos** (requiere JOIN con detalles_venta):
```sql
SELECT 
  nombre_producto,    -- Nombre del producto
  cantidad,           -- Cantidad vendida
  precio_unitario,    -- Precio unitario
  subtotal            -- Total del item
FROM detalles_venta
WHERE venta_id = ?
```

#### **Historial de Pagos** (desde tabla pagos):
```sql
SELECT 
  monto,
  metodo_pago,
  fecha_hora,
  es_pago_inicial,
  usuario_registra
FROM historial_pagos_venta
WHERE venta_id = ?
ORDER BY fecha_hora ASC
```

---

## 🔗 QUERY RECOMENDADA PARA MODAL

Para obtener TODA la información necesaria en un modal de pago:

```sql
-- Información de la deuda
SELECT 
  v.id as venta_id,
  v.fecha_hora,
  v.cliente_nombre,
  v.cliente_email,
  v.cliente_telefono,
  v.total,
  v.monto_pagado,
  v.saldo_pendiente,
  v.estado_pago,
  v.metodo_pago,
  pr.nombres as propietario_nombre,
  pr.correo as propietario_email,
  pr.telefono as propietario_telefono,
  -- Detalles de productos
  dv.nombre_producto,
  dv.cantidad,
  dv.precio_unitario,
  dv.subtotal
FROM public.ventas v
LEFT JOIN public.usuarios pr ON v.propietario_id = pr.id
LEFT JOIN public.detalles_venta dv ON v.id = dv.venta_id
WHERE v.id = ?
ORDER BY dv.id ASC;
```

---

## 🔐 Enumeraciones

### `metodo_pago_enum`:
- EFECTIVO
- YAPE
- PLIN
- TRANSFERENCIA
- OTRO

### Estados de Pago:
- **PENDIENTE** - Sin pago alguno
- **PARCIAL** - Pagado parcialmente
- **PAGADO** - Completamente pagado
- **CANCELADO** - Deuda anulada

---

## ⚠️ NOTAS IMPORTANTES

1. **Clientes Anónimos**: `cliente_id` puede ser NULL. En ese caso usar `cliente_nombre`, `cliente_email`, `cliente_telefono` directamente.

2. **Saldo Calculado**: `saldo_pendiente = total - monto_pagado`

3. **Estado Automático**: El `estado_pago` se calcula automáticamente según:
   - Si `saldo_pendiente = 0` → `PAGADO`
   - Si `saldo_pendiente = total` → `PENDIENTE`
   - En otro caso → `PARCIAL`

4. **Auditoría**: Cada pago es un evento inmutable que registra:
   - Quién pagó (`usuario_id`)
   - Cuándo (`fecha_hora`)
   - Cuánto (`monto`)
   - Cómo (`metodo_pago`)

5. **Historial Completo**: La tabla `pagos` mantiene el historial completo, permitiendo trazabilidad total.

---

## 🎯 Casos de Uso

### Caso 1: Mostrar modal de deuda
1. Llamar a `/api/deudas?clienteId=123` para obtener deudas
2. Para cada deuda, hacer query para obtener `detalles_venta`
3. Mostrar: nombre cliente, propietario, monto total, saldo, productos

### Caso 2: Registrar pago
1. Usuario completa formulario de pago en modal
2. POST `/api/deudas/registrar-pago` con `ventaId`, `monto`, `metodoPago`
3. Sistema actualiza automáticamente `monto_pagado`, `saldo_pendiente`, `estado_pago`
4. Crear registro en tabla `pagos` para auditoría

### Caso 3: Ver historial de pagos de una deuda
1. Usar vista `historial_pagos_venta` filtrando por `venta_id`
2. Mostrar cronología de todos los pagos realizados
3. Mostrar monto acumulado

