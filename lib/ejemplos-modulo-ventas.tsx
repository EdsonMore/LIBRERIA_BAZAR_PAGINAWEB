/**
 * EJEMPLOS DE USO - MÓDULO DE VENTAS
 * Casos de uso comunes y cómo implementarlos
 */

'use client'

import { useState } from 'react'
import React from 'react'

// =========================================================
// EJEMPLO 1: REGISTRAR UNA VENTA SIMPLE
// =========================================================

async function ejemplo1_VentaSimple() {
  const response = await fetch('/api/ventas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      vendedorId: 1,                    // Juan (vendedor)
      propietarioId: 2,                 // Mamá (propietaria)
      metodoPago: 'EFECTIVO',
      subtotal: 100,
      descuento: 0,
      detalles: [
        {
          productoId: 5,                // Producto existente
          nombreProducto: 'Vino Tinto',
          cantidad: 2,
          precioUnitario: 50,
        },
      ],
    }),
  })

  const data = await response.json()
  console.log(`Venta registrada: ${data.ventaId}`)
  // Output: Venta registrada: 123
}

// =========================================================
// EJEMPLO 2: REGISTRAR VENTA CON PRODUCTOS MANUALES
// =========================================================

async function ejemplo2_VentaProductoManual() {
  const response = await fetch('/api/ventas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      vendedorId: 2,                    // Mamá (vendedora)
      propietarioId: 1,                 // Papá (propietario)
      metodoPago: 'YAPE',
      descripcionMetodoOtro: null,
      clienteNombre: 'Carlos López',    // Cliente opcional
      clienteEmail: 'carlos@email.com',
      clienteTelefono: '+51999888777',
      subtotal: 250,
      descuento: 0,
      detalles: [
        {
          // Producto NO existente - ingresado manualmente
          nombreProducto: 'Whisky Premium Importado',
          cantidad: 1,
          precioUnitario: 250,
        },
      ],
    }),
  })

  const data = await response.json()
  console.log(`Venta registrada: ${data.ventaId}`)
  // Sistema automáticamente registra "Whisky Premium Importado" 
  // en productos_solicitados con contador = 1
}

// =========================================================
// EJEMPLO 3: REGISTRAR VENTA CON MÚLTIPLES PRODUCTOS
// =========================================================

async function ejemplo3_VentaMultipleProductos() {
  const response = await fetch('/api/ventas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      vendedorId: 1,
      propietarioId: 3,                 // Papá
      metodoPago: 'TRANSFERENCIA',
      subtotal: 450,
      descuento: 0,
      detalles: [
        {
          productoId: 5,
          nombreProducto: 'Vino Tinto',
          cantidad: 3,
          precioUnitario: 80,            // Total: 240
        },
        {
          productoId: 12,
          nombreProducto: 'Cerveza Premium',
          cantidad: 2,
          precioUnitario: 35,            // Total: 70
        },
        {
          nombreProducto: 'Ron Especial',  // Producto manual
          cantidad: 1,
          precioUnitario: 140,            // Total: 140
        },
      ],
    }),
  })

  const data = await response.json()
  console.log(`Venta registrada: ${data.ventaId} - Total: ${data.total}`)
  // Output: Venta registrada: 124 - Total: 450
}

// =========================================================
// EJEMPLO 4: REGISTRAR VENTA CON MÉTODO "OTRO"
// =========================================================

async function ejemplo4_VentaMetodoOtro() {
  const response = await fetch('/api/ventas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      vendedorId: 1,
      propietarioId: 2,
      metodoPago: 'OTRO',
      descripcionMetodoOtro: 'Depósito en cuenta BCP 12345678', // REQUERIDO
      subtotal: 200,
      descuento: 0,
      detalles: [
        {
          productoId: 7,
          nombreProducto: 'Licor',
          cantidad: 2,
          precioUnitario: 100,
        },
      ],
    }),
  })

  const data = await response.json()
  console.log(`Venta registrada con método OTRO: ${data.ventaId}`)
}

// =========================================================
// EJEMPLO 5: OBTENER LISTADO DE VENTAS CON FILTROS
// =========================================================

async function ejemplo5_ListarVentasConFiltros() {
  // Filtrar ventas de vendedor específico en un período
  const params = new URLSearchParams({
    vendedorId: '1',
    fechaInicio: new Date('2024-12-01').toISOString(),
    fechaFin: new Date('2024-12-31').toISOString(),
    page: '1',
    limit: '20',
  })

  const response = await fetch(`/api/ventas?${params.toString()}`)
  const data = await response.json()

  console.log(`Ventas encontradas: ${data.total}`)
  console.log(`Página: ${data.page} de ${Math.ceil(data.total / data.limit)}`)

  data.ventas.forEach((venta: any) => {
    console.log(`- Venta #${venta.id}: $${venta.total} (${venta.metodo_pago})`)
  })
}

// =========================================================
// EJEMPLO 6: OBTENER DETALLES DE UNA VENTA ESPECÍFICA
// =========================================================

async function ejemplo6_ObtenerDetallesVenta(ventaId: number) {
  const response = await fetch(`/api/ventas/${ventaId}/detalles`)
  const data = await response.json()

  const { venta } = data
  console.log(`Venta #${venta.id}`)
  console.log(`Vendedor: ${venta.vendedor_nombre}`)
  console.log(`Propietario: ${venta.propietario_nombre}`)
  console.log(`Total: S/. ${venta.total}`)
  console.log(`\nProductos:`)

  venta.detalles.forEach((detalle: any) => {
    console.log(
      `- ${detalle.nombre_producto}: ${detalle.cantidad} x S/. ${detalle.precio_unitario} = S/. ${detalle.subtotal}`
    )
  })
}

// =========================================================
// EJEMPLO 7: OBTENER REPORTES - RESUMEN GENERAL
// =========================================================

async function ejemplo7_ReportesResumen() {
  const params = new URLSearchParams({
    tipo: 'resumen',
    fechaInicio: new Date('2024-12-01').toISOString(),
    fechaFin: new Date('2024-12-31').toISOString(),
  })

  const response = await fetch(`/api/ventas/reportes?${params.toString()}`)
  const data = await response.json()

  const { resumen } = data
  console.log('=== RESUMEN GENERAL ===')
  console.log(`Total de Ventas: ${resumen.total_ventas}`)
  console.log(`Ingreso Total: S/. ${resumen.total_ingreso.toFixed(2)}`)
  console.log(`Promedio por Venta: S/. ${resumen.promedio_venta.toFixed(2)}`)
  console.log(`Primera Venta: ${new Date(resumen.primera_venta).toLocaleDateString()}`)
  console.log(`Última Venta: ${new Date(resumen.ultima_venta).toLocaleDateString()}`)
}

// =========================================================
// EJEMPLO 8: REPORTES - VENTAS POR VENDEDOR
// =========================================================

async function ejemplo8_ReportesPorVendedor() {
  const response = await fetch('/api/ventas/reportes?tipo=vendedor')
  const data = await response.json()

  console.log('=== VENTAS POR VENDEDOR ===')
  data.ventasPorVendedor.forEach((vendedor: any) => {
    console.log(`${vendedor.vendedor_nombre}:`)
    console.log(`  Total Ventas: ${vendedor.total_ventas}`)
    console.log(`  Ingreso: S/. ${vendedor.total_ingreso.toFixed(2)}`)
    console.log(`  Promedio: S/. ${vendedor.promedio_venta.toFixed(2)}`)
  })
}

// =========================================================
// EJEMPLO 9: REPORTES - INGRESOS POR PROPIETARIO
// =========================================================

async function ejemplo9_ReportesPorPropietario() {
  const response = await fetch('/api/ventas/reportes?tipo=propietario')
  const data = await response.json()

  console.log('=== INGRESOS POR PROPIETARIO ===')
  data.ingresosPorPropietario.forEach((propietario: any) => {
    console.log(`${propietario.propietario_nombre}:`)
    console.log(`  Total Ventas: ${propietario.total_ventas}`)
    console.log(`  Ingresos: S/. ${propietario.total_ingresos.toFixed(2)}`)
    console.log(`  Promedio: S/. ${propietario.promedio_venta.toFixed(2)}`)
  })
}

// =========================================================
// EJEMPLO 10: REPORTES - PRODUCTOS MÁS VENDIDOS
// =========================================================

async function ejemplo10_ReportesProductosMasVendidos() {
  const response = await fetch('/api/ventas/reportes?tipo=productos&limit=5')
  const data = await response.json()

  console.log('=== TOP 5 PRODUCTOS MÁS VENDIDOS ===')
  data.productosMasVendidos.forEach((producto: any, index: number) => {
    console.log(
      `${index + 1}. ${producto.nombre} - ${producto.total_cantidad} unidades (S/. ${producto.total_ingreso.toFixed(2)})`
    )
  })
}

// =========================================================
// EJEMPLO 11: REPORTES - PRODUCTOS SOLICITADOS
// =========================================================

async function ejemplo11_ProductosSolicitados() {
  const response = await fetch('/api/api/productos-solicitados?limit=10&ordenar=cantidad')
  const data = await response.json()

  console.log('=== PRODUCTOS SOLICITADOS (NO EXISTENTES) ===')
  data.productos.forEach((producto: any, index: number) => {
    console.log(
      `${index + 1}. ${producto.nombre} - Solicitado ${producto.cantidad_veces_solicitado} veces`
    )
    console.log(`   Última solicitud: ${new Date(producto.ultima_fecha_solicitud).toLocaleDateString()}`)
  })

  console.log(`\n💡 Sugerencia: Considerar agregar estos productos al catálogo`)
}

// =========================================================
// EJEMPLO 12: REPORTES - MÉTODOS DE PAGO
// =========================================================

async function ejemplo12_ReportesMetodosPago() {
  const response = await fetch('/api/ventas/reportes?tipo=metodos')
  const data = await response.json()

  console.log('=== RESUMEN POR MÉTODO DE PAGO ===')
  data.resumenPorMetodoPago.forEach((metodo: any) => {
    console.log(`${metodo.metodo_pago}:`)
    console.log(`  Transacciones: ${metodo.cantidad_transacciones}`)
    console.log(`  Monto Total: S/. ${metodo.total_monto.toFixed(2)}`)
    console.log(`  Promedio: S/. ${metodo.promedio_transaccion.toFixed(2)}`)
  })
}

// =========================================================
// EJEMPLO 13: USAR EN COMPONENTE REACT
// =========================================================

export function ComponenteVentasEjemplo() {
  const [ventas, setVentas] = useState<any[]>([])
  const [cargando, setCargando] = useState<boolean>(false)

  const cargarVentasDelMes = async () => {
    setCargando(true)
    try {
      const hoy = new Date()
      const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
      const fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)

      const params = new URLSearchParams({
        fechaInicio: inicio.toISOString(),
        fechaFin: fin.toISOString(),
        limit: '100',
      })

      const response = await fetch(`/api/ventas?${params.toString()}`)
      const data = await response.json()
      setVentas(data.ventas)
    } catch (error) {
      console.error('Error al cargar ventas:', error)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div>
      <button onClick={cargarVentasDelMes} disabled={cargando}>
        {cargando ? 'Cargando...' : 'Cargar Ventas del Mes'}
      </button>
      <ul>
        {ventas.map((venta: any) => (
          <li key={venta.id}>
            Venta #{venta.id}: S/. {venta.total} ({venta.metodo_pago})
          </li>
        ))}
      </ul>
    </div>
  )
}

// =========================================================
// EJEMPLO 14: MANEJO DE ERRORES
// =========================================================

async function ejemplo14_ManejErrores() {
  try {
    // Intento registrar venta inválida
    const response = await fetch('/api/ventas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vendedorId: 1,
        propietarioId: 2,
        metodoPago: 'OTRO',
        // Falta: descripcionMetodoOtro cuando metodoPago = OTRO
        detalles: [],
      }),
    })

    if (!response.ok) {
      const data = await response.json()
      console.error(`Error: ${data.error}`)
      // Output: Error: descripcionMetodoOtro es requerido cuando metodoPago es OTRO
    }
  } catch (error) {
    console.error('Error de red:', error)
  }
}

// =========================================================
// EJEMPLO 15: SCRAPBOOK - CASO DE USO COMPLETO
// =========================================================

async function ejemplo15_CasoCompletoFamiliar() {
  console.log('🛒 SIMULACIÓN: Venta familiar en licorería\n')

  // Paso 1: Mamá vende cerveza de su stock
  console.log('1️⃣ Mamá vende cerveza (producto existente)')
  const venta1Response = await fetch('/api/ventas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      vendedorId: 2, // Mamá
      propietarioId: 2, // Es de Mamá
      metodoPago: 'EFECTIVO',
      clienteNombre: 'Juan Pérez',
      subtotal: 100,
      descuento: 0,
      detalles: [
        {
          productoId: 3,
          nombreProducto: 'Cerveza Premium Pack 6',
          cantidad: 2,
          precioUnitario: 50,
        },
      ],
    }),
  })
  const venta1 = await venta1Response.json()
  console.log(`✅ Venta #${venta1.ventaId} registrada: S/. ${venta1.total}\n`)

  // Paso 2: Papá vende producto que no existe (temporal)
  console.log('2️⃣ Papá vende vino que no está en BD')
  const venta2Response = await fetch('/api/ventas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      vendedorId: 3, // Papá
      propietarioId: 3, // Es de Papá
      metodoPago: 'YAPE',
      clienteNombre: 'María García',
      subtotal: 200,
      descuento: 0,
      detalles: [
        {
          nombreProducto: 'Vino Tinto Reserva 2020',
          cantidad: 1,
          precioUnitario: 200,
        },
      ],
    }),
  })
  const venta2 = await venta2Response.json()
  console.log(`✅ Venta #${venta2.ventaId} registrada: S/. ${venta2.total}`)
  console.log(`💾 Producto "Vino Tinto Reserva 2020" agregado a Productos Solicitados\n`)

  // Paso 3: Consultar reportes
  console.log('3️⃣ Consultando reportes del día\n')
  const reportesResponse = await fetch('/api/ventas/reportes?tipo=todos')
  const reportes = await reportesResponse.json()

  console.log('📊 RESUMEN:')
  console.log(`Total Ventas Hoy: ${reportes.resumen.total_ventas}`)
  console.log(`Ingreso Total: S/. ${reportes.resumen.total_ingreso}`)

  console.log('\n👥 Por Vendedor:')
  reportes.ventasPorVendedor.forEach((v: any) => {
    console.log(`${v.vendedor_nombre}: S/. ${v.total_ingreso}`)
  })

  console.log('\n🛍️ Productos Solicitados:')
  reportes.productosSolicitados.forEach((p: any) => {
    console.log(`- ${p.nombre}: ${p.cantidad_veces_solicitado} solicitudes`)
  })
}

// Exportar para uso
export {
  ejemplo1_VentaSimple,
  ejemplo2_VentaProductoManual,
  ejemplo3_VentaMultipleProductos,
  ejemplo4_VentaMetodoOtro,
  ejemplo5_ListarVentasConFiltros,
  ejemplo6_ObtenerDetallesVenta,
  ejemplo7_ReportesResumen,
  ejemplo8_ReportesPorVendedor,
  ejemplo9_ReportesPorPropietario,
  ejemplo10_ReportesProductosMasVendidos,
  ejemplo11_ProductosSolicitados,
  ejemplo12_ReportesMetodosPago,
  ejemplo14_ManejErrores,
  ejemplo15_CasoCompletoFamiliar,
}
