## Resumen de Cambios - Sistema de Deudas y Ventas

### 1. STOCK - Reducción automática al registrar venta ✅
**Archivo:** `app/api/ventas/route.ts`

**Cambio:** Cuando se registra una venta con un producto existente (producto_id), el stock se reduce automáticamente en la tabla `productos`.

```typescript
// Si es producto existente, reducir stock
if (esProductoExistente && detalle.productoId) {
  await query(
    `UPDATE public.productos 
     SET stock = stock - ? 
     WHERE id = ? AND stock >= ?`,
    [detalle.cantidad, detalle.productoId, detalle.cantidad]
  )
}
```

**Garantía:** Solo se reduce si el producto existe en BD y hay stock suficiente.

---

### 2. DEUDAS - Clarificación y lógica correcta ✅
**Archivos principales:**
- `app/api/deudas/route.ts` - GET deudas pendientes
- `app/api/deudas/historial/route.ts` - GET deudas pagadas/canceladas (NUEVO)
- `app/api/deudas/registrar-pago/route.ts` - POST registrar pagos
- `app/api/deudas/cancelar/route.ts` - POST cancelar deudas

**Clarificación importante:**
- **saldo_pendiente**: Cantidad de dinero pendiente de cobrar (NO descuento)
- **monto_pagado**: Cantidad de dinero recibido
- **descuento**: Rebaja en la venta (campo separado)
- **estado_pago**: PENDIENTE | PARCIAL | PAGADO | CANCELADO

---

### 3. REPORTES DE VENTAS - Solo cuentan ventas PAGADAS ✅
**Archivo:** `app/api/ventas/reportes/route.ts`

**Cambio:** Todos los reportes ahora filtran por `WHERE v.estado_pago = 'PAGADO'`

**Funciones actualizadas:**
- `getResumen()` - Total de ventas e ingresos
- `getVentasPorVendedor()` - Ingresos por vendedor
- `getIngresosPorPropietario()` - Ingresos por propietario
- `getProductosMasVendidos()` - Productos vendidos (solo de ventas pagadas)
- `getResumenPorMetodoPago()` - Métodos de pago utilizados

**Lógica:**
- Una deuda (venta con saldo_pendiente > 0) NO aparece en reportes de ingresos
- Solo cuando se paga completamente (estado_pago = PAGADO) aparece en reportes

---

### 4. VISTA DE DEUDAS DEL SUPERADMIN - Mejor UX ✅
**Archivo:** `app/superadmin/deudas/page.tsx`

**Cambios:**
1. **Pestañas de navegación:**
   - 📋 Pendientes: Deudas activas con opciones de pago/cancelación
   - ✅ Historial: Deudas pagadas y canceladas (lectura)

2. **Tabla dinámica según pestaña:**
   - Pendientes: Muestra Total, Pagado, Saldo, Estado, Acciones
   - Historial: Muestra Total, Pagado, Estado, Detalles (motivo de cancelación)

3. **Estados con colores:**
   - ⚪ PENDIENTE (Rojo)
   - 🟡 PARCIAL (Amarillo)
   - 💚 PAGADO (Verde)
   - ❌ CANCELADO (Naranja)

4. **Resumen dinámico:**
   - Pendientes: Total de deudas y cantidad
   - Historial: Total de ingresos pagados en la sesión

---

### 5. NUEVO ENDPOINT - Historial de Deudas ✅
**Archivo:** `app/api/deudas/historial/route.ts`

**GET /api/deudas/historial**

Parámetros:
- `tipo`: PAGADO | CANCELADO | TODOS (default)
- `clienteId`: Filtrar por cliente
- `fechaInicio`: Desde fecha
- `fechaFin`: Hasta fecha
- `busqueda`: Buscar por nombre/email/teléfono
- `page`: Número de página
- `limit`: Resultados por página

Respuesta incluye:
- Información completa de la deuda
- Motivo de cancelación (si aplica)
- Saldo perdonado (si aplica)

---

### 6. LÓGICA DE PAGOS PARCIALES ✅
**Archivo:** `app/api/deudas/registrar-pago/route.ts`

**Cálculo de estado:**
```typescript
const nuevoEstadoPago = 
  nuevoSaldoPendiente === 0 ? 'PAGADO' :      // Pagado completamente
  nuevoMontoPagado > 0 ? 'PARCIAL' :          // Pagado parcialmente
  'PENDIENTE'                                  // Sin pagar
```

**Garantías:**
- El saldo_pendiente se resta correctamente
- El monto_pagado se suma correctamente
- El estado se actualiza automáticamente
- Un pago parcial NO aparece en reportes hasta completarse

---

### 7. VERIFICACIONES FINALES ✅

#### Flujo de venta pagada completa:
1. Se registra venta con monto_pagado = total → estado_pago = PAGADO
2. Stock se reduce automáticamente
3. Aparece en reportes de ventas
4. No aparece en vista de deudas

#### Flujo de venta con deuda:
1. Se registra venta con monto_pagado < total → estado_pago = PENDIENTE
2. Stock se reduce automáticamente
3. NO aparece en reportes de ventas
4. Aparece en vista de deudas pendientes
5. Se hace primer pago (monto_pagado > 0) → estado_pago = PARCIAL
6. NO aparece aún en reportes de ventas
7. Se hace pago final (saldo_pendiente = 0) → estado_pago = PAGADO
8. Ahora aparece en reportes de ventas ✓

#### Flujo de deuda cancelada:
1. Deuda se cancela con motivo → estado_pago = CANCELADO
2. Se registra en tabla `cancelaciones_deuda`
3. Aparece en historial con motivo y saldo perdonado
4. NO aparece en reportes de ventas

---

### 8. CAMBIOS NO REALIZADOS (Lo que ya funciona) ✓
- Sistema de autenticación
- Módulo de usuarios
- Carrito de compras
- Procesamiento de pagos externos
- Todo lo demás en el sistema

---

### Archivo: ANTES Y DESPUÉS DE CAMBIOS

#### ANTES:
- Deudas contaban como ingreso en reportes (INCORRECTO)
- Stock no se reducía al vender
- No había distinción entre descuento y monto pagado

#### DESPUÉS:
- Deudas NO cuentan en reportes hasta pagarse completamente (CORRECTO)
- Stock se reduce automáticamente al registrar venta
- Descuento = rebaja, monto_pagado = dinero recibido, saldo_pendiente = deuda

---

**Estado:** ✅ TODAS LAS CORRECCIONES IMPLEMENTADAS Y VALIDADAS
