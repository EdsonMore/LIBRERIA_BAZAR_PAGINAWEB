'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Filter, Plus, X, FileText, MessageCircle } from 'lucide-react'

export default function DeudasPage() {
  const [pestaña, setPestaña] = useState<'pendientes' | 'historial'>('pendientes')
  const [deudas, setDeudas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalDeudasPendientes, setTotalDeudasPendientes] = useState(0)
  const [totalIngresosPagados, setTotalIngresosPagados] = useState(0)

  // Filtros
  const [filtros, setFiltros] = useState({
    busqueda: '',
    estado: '',
    fechaInicio: '',
    fechaFin: '',
  })

  // Modal de pago
  const [modalPago, setModalPago] = useState(false)
  const [modalCancelacion, setModalCancelacion] = useState(false)
  const [deudaSeleccionada, setDeudaSeleccionada] = useState<any | null>(null)
  const [detallesDeuda, setDetallesDeuda] = useState<any | null>(null)
  const [cargandoDetalles, setCargandoDetalles] = useState(false)
  const [montoPago, setMontoPago] = useState(0)
  const [metodoPago, setMetodoPago] = useState('EFECTIVO')
  const [motivoCancelacion, setMotivoCancelacion] = useState('')
  const [cargandoAccion, setCargandoAccion] = useState(false)
  const [mensajeAccion, setMensajeAccion] = useState('')

  // Cargar deudas
  useEffect(() => {
    cargarDeudas()
  }, [page, filtros, pestaña])

  const cargarDeudas = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      })

      if (filtros.busqueda) params.append('busqueda', filtros.busqueda)
      if (filtros.fechaInicio) params.append('fechaInicio', filtros.fechaInicio)
      if (filtros.fechaFin) params.append('fechaFin', filtros.fechaFin)

      let url = ''
      if (pestaña === 'pendientes') {
        url = `/api/deudas?${params.toString()}`
        if (filtros.estado) params.append('estadoPago', filtros.estado)
      } else {
        url = `/api/deudas/historial?${params.toString()}`
      }

      const response = await fetch(url)
      const data = await response.json()

      setDeudas(data.deudas)
      setTotalPages(data.pagination.totalPages)
      setTotalDeudasPendientes(Number(data.resumen?.totalDeudasPendientes) || 0)
      setTotalIngresosPagados(Number(data.resumen?.totalIngresosPagados) || 0)
    } catch (error) {
      console.error('Error al cargar deudas:', error)
    } finally {
      setLoading(false)
    }
  }

  const abrirModalPago = async (deuda: any) => {
    setDeudaSeleccionada(deuda)
    setMontoPago(deuda.saldo_pendiente)
    setCargandoDetalles(true)
    
    try {
      // Cargar detalles de la deuda (productos, propietario, etc)
      const response = await fetch(`/api/deudas/${deuda.venta_id}/detalles`)
      if (response.ok) {
        const data = await response.json()
        setDetallesDeuda(data.venta)
      }
    } catch (error) {
      console.error('Error al cargar detalles:', error)
    } finally {
      setCargandoDetalles(false)
    }
    
    setModalPago(true)
  }

  const abrirModalCancelacion = (deuda: any) => {
    setDeudaSeleccionada(deuda)
    setModalCancelacion(true)
  }

  // Agrupar deudas por cliente para exportación
  const agruparPorCliente = (deudas: any[]) => {
    const agrupadas: { [key: string]: any[] } = {}
    
    deudas.forEach(deuda => {
      const cliente = deuda.cliente_nombre || 'Cliente sin nombre'
      if (!agrupadas[cliente]) {
        agrupadas[cliente] = []
      }
      agrupadas[cliente].push(deuda)
    })
    
    return agrupadas
  }

  // Exportar a PDF
  const exportarAPDF = async () => {
    try {
      setLoading(true)
      
      // Cargar detalles de todas las deudas para obtener productos
      const deudasConDetalles = await Promise.all(
        deudas.map(async (deuda) => {
          try {
            const response = await fetch(`/api/deudas/${deuda.venta_id}/detalles`)
            if (response.ok) {
              const data = await response.json()
              return { ...deuda, productos: data.venta.productos }
            }
          } catch (error) {
            console.error(`Error cargando productos para venta ${deuda.venta_id}:`, error)
          }
          return deuda
        })
      )

      const deudasAgrupadas = agruparPorCliente(deudasConDetalles)
      let contenidoHTML = `
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .cliente-section { margin-bottom: 30px; page-break-inside: avoid; }
              .cliente-nombre { font-size: 16px; font-weight: bold; margin-bottom: 10px; border-bottom: 2px solid #333; padding-bottom: 5px; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 11px; }
              th { background-color: #f0f0f0; padding: 8px; text-align: left; border: 1px solid #ddd; font-weight: bold; }
              td { padding: 8px; border: 1px solid #ddd; }
              .total-row { background-color: #ffffcc; font-weight: bold; }
              .encabezado { text-align: center; margin-bottom: 20px; }
              .encabezado h1 { margin: 0; }
              .resumen { margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #007bff; }
              .productos-venta { background-color: #f5f5f5; padding: 8px; margin: 5px 0; border-radius: 3px; font-size: 10px; }
              .producto-item { margin: 3px 0; }
            </style>
          </head>
          <body>
            <div class="encabezado">
              <h1>📋 Reporte de Deudas Agrupadas por Cliente</h1>
              <p>Generado: ${new Date().toLocaleDateString('es-PE')} ${new Date().toLocaleTimeString('es-PE')}</p>
            </div>
      `

      let totalGeneral = 0
      let totalPagado = 0
      let totalPendiente = 0

      Object.entries(deudasAgrupadas).forEach(([cliente, deudas]) => {
        contenidoHTML += `
          <div class="cliente-section">
            <div class="cliente-nombre">👤 ${cliente}</div>
            <table>
              <thead>
                <tr>
                  <th>Fecha/Hora</th>
                  <th>Productos</th>
                  <th>Total</th>
                  <th>Pagado</th>
                  <th>Pendiente</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
        `

        let subtotalCliente = 0
        let subtotalPagado = 0
        let subtotalPendiente = 0

        deudas.forEach((deuda: any) => {
          const total = Number(deuda.total)
          const pagado = Number(deuda.monto_pagado)
          const pendiente = Number(deuda.saldo_pendiente || total - pagado)

          subtotalCliente += total
          subtotalPagado += pagado
          subtotalPendiente += pendiente
          totalGeneral += total
          totalPagado += pagado
          totalPendiente += pendiente

          // Generar lista de productos
          let productosHTML = ''
          if (deuda.productos && deuda.productos.length > 0) {
            productosHTML = deuda.productos
              .map((prod: any) => `• ${prod.producto_nombre} (${prod.cantidad}x ${prod.precio_unitario})`)
              .join('<br>')
          } else {
            productosHTML = '<em>Sin productos registrados</em>'
          }

          contenidoHTML += `
            <tr>
              <td>${new Date(deuda.fecha_hora).toLocaleDateString('es-PE')} ${new Date(deuda.fecha_hora).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
              <td><div class="productos-venta">${productosHTML}</div></td>
              <td>S/. ${total.toFixed(2)}</td>
              <td>S/. ${pagado.toFixed(2)}</td>
              <td>S/. ${pendiente.toFixed(2)}</td>
              <td>${deuda.estado_pago}</td>
            </tr>
          `
        })

        contenidoHTML += `
                <tr class="total-row">
                  <td colspan="2"><strong>Subtotal</strong></td>
                  <td><strong>S/. ${subtotalCliente.toFixed(2)}</strong></td>
                  <td><strong>S/. ${subtotalPagado.toFixed(2)}</strong></td>
                  <td><strong>S/. ${subtotalPendiente.toFixed(2)}</strong></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        `
      })

      contenidoHTML += `
            <div class="resumen">
              <h3>📊 Resumen General</h3>
              <p><strong>Total Deudas:</strong> S/. ${totalGeneral.toFixed(2)}</p>
              <p><strong>Total Pagado:</strong> S/. ${totalPagado.toFixed(2)}</p>
              <p><strong>Total Pendiente:</strong> S/. ${totalPendiente.toFixed(2)}</p>
            </div>
          </body>
        </html>
      `

      const ventana = window.open('', '', 'width=900,height=600')
      ventana?.document.write(contenidoHTML)
      ventana?.document.close()
      ventana?.print()
    } catch (error) {
      console.error('Error al exportar a PDF:', error)
      alert('Error al exportar a PDF')
    } finally {
      setLoading(false)
    }
  }

  // Exportar a WhatsApp
  const exportarAWhatsApp = async () => {
    try {
      setLoading(true)
      
      // Cargar detalles de todas las deudas para obtener productos
      const deudasConDetalles = await Promise.all(
        deudas.map(async (deuda) => {
          try {
            const response = await fetch(`/api/deudas/${deuda.venta_id}/detalles`)
            if (response.ok) {
              const data = await response.json()
              return { ...deuda, productos: data.venta.productos }
            }
          } catch (error) {
            console.error(`Error cargando productos para venta ${deuda.venta_id}:`, error)
          }
          return deuda
        })
      )

      const deudasAgrupadas = agruparPorCliente(deudasConDetalles)
      let mensaje = `*📋 Reporte de Deudas Agrupadas*\n`
      mensaje += `Generado: ${new Date().toLocaleDateString('es-PE')} ${new Date().toLocaleTimeString('es-PE')}\n\n`

      Object.entries(deudasAgrupadas).forEach(([cliente, deudas]) => {
        mensaje += `*👤 ${cliente}*\n`
        
        let subtotalCliente = 0
        let subtotalPendiente = 0

        deudas.forEach((deuda: any) => {
          const total = Number(deuda.total)
          const pendiente = Number(deuda.saldo_pendiente || total - Number(deuda.monto_pagado))
          
          subtotalCliente += total
          subtotalPendiente += pendiente
          
          const fechaHora = new Date(deuda.fecha_hora).toLocaleDateString('es-PE') + ' ' + 
                           new Date(deuda.fecha_hora).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          
          mensaje += `📅 ${fechaHora}\n`
          
          // Agregar productos
          if (deuda.productos && deuda.productos.length > 0) {
            deuda.productos.forEach((prod: any) => {
              mensaje += `  • ${prod.producto_nombre} (${prod.cantidad}x S/. ${Number(prod.precio_unitario).toFixed(2)})\n`
            })
          }
          
          mensaje += `  💰 Total: S/. ${total.toFixed(2)} | Estado: ${deuda.estado_pago}\n\n`
        })

        mensaje += `*Subtotal ${cliente}:* S/. ${subtotalCliente.toFixed(2)}\n`
        mensaje += `*Pendiente:* S/. ${subtotalPendiente.toFixed(2)}\n\n`
      })

      const urlWhatsApp = `https://wa.me/?text=${encodeURIComponent(mensaje)}`
      window.open(urlWhatsApp, '_blank')
    } catch (error) {
      console.error('Error al exportar a WhatsApp:', error)
      alert('Error al exportar a WhatsApp')
    } finally {
      setLoading(false)
    }
  }

  const registrarPago = async () => {
    if (montoPago <= 0) {
      alert('Ingrese un monto válido')
      return
    }

    if (montoPago > deudaSeleccionada.saldo_pendiente) {
      alert('El monto no puede exceder el saldo pendiente')
      return
    }

    try {
      setCargandoAccion(true)
      setMensajeAccion('')

      const response = await fetch('/api/deudas/registrar-pago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ventaId: deudaSeleccionada.venta_id,
          monto: montoPago,
          metodoPago,
          usuarioId: 1, // TODO: obtener del usuario logueado
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setMensajeAccion(`Error: ${data.error}`)
        return
      }

      setMensajeAccion('Pago registrado exitosamente')
      setTimeout(() => {
        setModalPago(false)
        cargarDeudas()
        setMensajeAccion('')
        setDeudaSeleccionada(null)
      }, 1500)
    } catch (error: any) {
      setMensajeAccion(`Error: ${error.message}`)
    } finally {
      setCargandoAccion(false)
    }
  }

  const cancelarDeuda = async () => {
    if (!motivoCancelacion.trim()) {
      alert('Ingrese el motivo de cancelación')
      return
    }

    try {
      setCargandoAccion(true)
      setMensajeAccion('')

      const response = await fetch('/api/deudas/cancelar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ventaId: deudaSeleccionada.venta_id,
          motivo: motivoCancelacion,
          usuarioId: 1, // TODO: obtener del usuario logueado
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setMensajeAccion(`Error: ${data.error}`)
        return
      }

      setMensajeAccion('Deuda cancelada exitosamente')
      setTimeout(() => {
        setModalCancelacion(false)
        cargarDeudas()
        setMensajeAccion('')
        setDeudaSeleccionada(null)
      }, 1500)
    } catch (error: any) {
      setMensajeAccion(`Error: ${error.message}`)
    } finally {
      setCargandoAccion(false)
    }
  }

  const getColorEstado = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'PARCIAL':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'PAGADO':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'CANCELADO':
        return 'bg-orange-100 text-orange-800 border-orange-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">💳 Gestión de Deudas</h1>
            <p className="text-gray-600">Administra pagos y deudas de ventas</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <Button
              onClick={exportarAPDF}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Exportar PDF
            </Button>
            <Button
              onClick={exportarAWhatsApp}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 text-green-600"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </Button>
          </div>
        </div>

        {/* Pestañas */}
        <div className="flex gap-2 mb-8 border-b">
          <button
            onClick={() => {
              setPestaña('pendientes')
              setPage(1)
            }}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
              pestaña === 'pendientes'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            📋 Pendientes ({pestaña === 'pendientes' ? deudas.length : '?'})
          </button>
          <button
            onClick={() => {
              setPestaña('historial')
              setPage(1)
            }}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
              pestaña === 'historial'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            ✅ Historial (Pagadas/Canceladas)
          </button>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {pestaña === 'pendientes' ? (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Deudas Pendientes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl md:text-3xl font-bold text-red-600">
                    S/. {totalDeudasPendientes.toFixed(2)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Monto total a cobrar</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Cantidad de Deudas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl md:text-3xl font-bold text-orange-600">
                    {deudas.length}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Deudas activas en el sistema</p>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="md:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Ingresos Pagados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl md:text-3xl font-bold text-green-600">
                  S/. {totalIngresosPagados.toFixed(2)}
                </div>
                <p className="text-xs text-gray-500 mt-1">Monto total cobrado en esta sesión</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Filtros */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Búsqueda */}
              <div>
                <Label htmlFor="busqueda" className="text-sm">Buscar (Nombre, Email, Teléfono)</Label>
                <Input
                  id="busqueda"
                  placeholder="Buscar..."
                  value={filtros.busqueda}
                  onChange={(e) => {
                    setFiltros({ ...filtros, busqueda: e.target.value })
                    setPage(1)
                  }}
                  className="mt-1"
                />
              </div>

              {/* Estado (solo en pestaña de pendientes) */}
              {pestaña === 'pendientes' && (
                <div>
                  <Label htmlFor="estado" className="text-sm">Estado</Label>
                  <Select
                    value={filtros.estado || "todos"}
                    onValueChange={(v) => {
                      setFiltros({ ...filtros, estado: v === "todos" ? "" : v })
                      setPage(1)
                    }}
                  >
                    <SelectTrigger id="estado" className="mt-1">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                      <SelectItem value="PARCIAL">Parcial</SelectItem>
                      <SelectItem value="PAGADO">Pagado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Fecha Inicio */}
              <div>
                <Label htmlFor="fecha-inicio" className="text-sm">Desde</Label>
                <Input
                  id="fecha-inicio"
                  type="date"
                  value={filtros.fechaInicio}
                  onChange={(e) => {
                    setFiltros({ ...filtros, fechaInicio: e.target.value })
                    setPage(1)
                  }}
                  className="mt-1"
                />
              </div>

              {/* Fecha Fin */}
              <div>
                <Label htmlFor="fecha-fin" className="text-sm">Hasta</Label>
                <Input
                  id="fecha-fin"
                  type="date"
                  value={filtros.fechaFin}
                  onChange={(e) => {
                    setFiltros({ ...filtros, fechaFin: e.target.value })
                    setPage(1)
                  }}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Deudas */}
        <Card>
          <CardHeader>
            <CardTitle>{pestaña === 'pendientes' ? 'Deudas Pendientes' : 'Historial de Deudas (Pagadas/Canceladas)'}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
                <p className="mt-2 text-gray-600">Cargando deudas...</p>
              </div>
            ) : deudas.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">
                  {pestaña === 'pendientes' ? 'No hay deudas pendientes' : 'No hay deudas pagadas o canceladas'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm md:text-base">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                      <th className="px-4 py-3 text-left font-semibold">Cliente</th>
                      <th className="px-4 py-3 text-left font-semibold">Contacto</th>
                      <th className="px-4 py-3 text-right font-semibold">Total</th>
                      <th className="px-4 py-3 text-right font-semibold">Pagado</th>
                      {pestaña === 'pendientes' && (
                        <th className="px-4 py-3 text-right font-semibold">Saldo</th>
                      )}
                      <th className="px-4 py-3 text-center font-semibold">Estado</th>
                      {pestaña === 'historial' && (
                        <th className="px-4 py-3 text-left font-semibold">Detalles</th>
                      )}
                      {pestaña === 'pendientes' && (
                        <th className="px-4 py-3 text-center font-semibold">Acciones</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {deudas.map((deuda) => (
                      <tr key={deuda.venta_id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 text-xs md:text-sm">
                          {new Date(deuda.fecha_hora).toLocaleDateString('es-PE')}
                        </td>
                        <td className="px-4 py-3 text-xs md:text-sm font-medium truncate max-w-xs">
                          {deuda.cliente_nombre || 'Sin nombre'}
                        </td>
                        <td className="px-4 py-3 text-xs md:text-sm truncate max-w-xs">
                          {deuda.cliente_telefono || deuda.cliente_email || '-'}
                        </td>
                        <td className="px-4 py-3 text-right text-xs md:text-sm font-semibold">
                          S/. {Number(deuda.total).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right text-xs md:text-sm text-green-600 font-semibold">
                          S/. {Number(deuda.monto_pagado).toFixed(2)}
                        </td>
                        {pestaña === 'pendientes' && (
                          <td className="px-4 py-3 text-right text-xs md:text-sm text-red-600 font-semibold">
                            S/. {Number(deuda.saldo_pendiente).toFixed(2)}
                          </td>
                        )}
                        <td className="px-4 py-3 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getColorEstado(deuda.estado_pago)}`}>
                            {deuda.estado_pago === 'PENDIENTE' && '⚪'}
                            {deuda.estado_pago === 'PARCIAL' && '🟡'}
                            {deuda.estado_pago === 'PAGADO' && '💚'}
                            {deuda.estado_pago === 'CANCELADO' && '❌'}
                            {' '}
                            {deuda.estado_pago}
                          </span>
                        </td>
                        {pestaña === 'historial' && (
                          <td className="px-4 py-3 text-xs md:text-sm">
                            {deuda.estado_pago === 'CANCELADO' && deuda.cancelacion_motivo ? (
                              <div className="space-y-1">
                                <p className="font-semibold text-orange-600">Cancelada</p>
                                <p className="text-gray-600">Motivo: {deuda.cancelacion_motivo}</p>
                                {deuda.saldo_perdonado && (
                                  <p className="text-gray-600">Saldo perdonado: S/. {Number(deuda.saldo_perdonado).toFixed(2)}</p>
                                )}
                              </div>
                            ) : (
                              <p className="text-green-600 font-semibold">Pagada completamente</p>
                            )}
                          </td>
                        )}
                        {pestaña === 'pendientes' && (
                          <td className="px-4 py-3 text-center">
                            <div className="flex flex-col sm:flex-row gap-2 justify-center">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => abrirModalPago(deuda)}
                                className="text-xs h-8"
                              >
                                Pagar
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => abrirModalCancelacion(deuda)}
                                className="text-xs h-8"
                              >
                                Cancelar
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  Anterior
                </Button>
                <span className="text-sm text-gray-600">
                  Página {page} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                >
                  Siguiente
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de Pago */}
        {modalPago && deudaSeleccionada && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <Card className="w-full max-w-2xl my-8">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-lg md:text-xl">💳 Registrar Pago</CardTitle>
                <button
                  onClick={() => {
                    setModalPago(false)
                    setDetallesDeuda(null)
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </CardHeader>
              <CardContent className="space-y-4 max-h-[70vh] overflow-y-auto">
                {cargandoDetalles ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600"></div>
                    <p className="mt-2 text-sm text-gray-600">Cargando detalles...</p>
                  </div>
                ) : (
                  <>
                    {/* Información del Cliente y Propietario */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-3 border-b">
                      <div className="p-3 bg-blue-50 rounded">
                        <h4 className="font-semibold text-sm mb-2">👤 Cliente</h4>
                        <div className="space-y-1 text-xs">
                          <p><strong>Nombre:</strong> {detallesDeuda?.cliente_nombre}</p>
                          <p><strong>Email:</strong> {detallesDeuda?.cliente_email || 'N/A'}</p>
                          <p><strong>Teléfono:</strong> {detallesDeuda?.cliente_telefono || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="p-3 bg-green-50 rounded">
                        <h4 className="font-semibold text-sm mb-2">🏢 Propietario</h4>
                        <div className="space-y-1 text-xs">
                          <p><strong>Nombre:</strong> {detallesDeuda?.propietario_nombre || 'N/A'}</p>
                          <p><strong>Vendedor:</strong> {detallesDeuda?.vendedor_nombre || 'N/A'}</p>
                          <p><strong>Fecha Venta:</strong> {detallesDeuda?.fecha_hora ? `${new Date(detallesDeuda.fecha_hora).toLocaleDateString('es-PE')} ${new Date(detallesDeuda.fecha_hora).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Tabla de Productos Vendidos */}
                    {detallesDeuda?.productos && detallesDeuda.productos.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">📦 Productos Vendidos</h4>
                        <div className="overflow-x-auto border rounded">
                          <table className="w-full text-xs">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="px-2 py-2 text-left">Producto</th>
                                <th className="px-2 py-2 text-center">Cant.</th>
                                <th className="px-2 py-2 text-right">P. Unit.</th>
                                <th className="px-2 py-2 text-right">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {detallesDeuda.productos.map((prod: any) => (
                                <tr key={prod.detalle_id} className="border-b hover:bg-gray-50">
                                  <td className="px-2 py-2 font-medium">{prod.producto_nombre}</td>
                                  <td className="px-2 py-2 text-center">{prod.cantidad}</td>
                                  <td className="px-2 py-2 text-right">S/. {Number(prod.precio_unitario).toFixed(2)}</td>
                                  <td className="px-2 py-2 text-right font-semibold text-green-600">
                                    S/. {Number(prod.subtotal).toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Resumen Financiero */}
                    <div className="p-3 bg-gray-50 rounded space-y-2 border-l-4 border-blue-500">
                      <p className="text-sm">
                        <span className="font-semibold">Total Venta:</span> 
                        <span className="ml-2 font-bold">S/. {Number(detallesDeuda?.total).toFixed(2)}</span>
                      </p>
                      <p className="text-sm">
                        <span className="font-semibold">Pagado:</span> 
                        <span className="ml-2 font-bold text-green-600">S/. {Number(detallesDeuda?.monto_pagado).toFixed(2)}</span>
                      </p>
                      <p className="text-sm font-bold text-red-600">
                        <span>Saldo Pendiente:</span> 
                        <span className="ml-2">S/. {Number(detallesDeuda?.saldo_pendiente).toFixed(2)}</span>
                      </p>
                    </div>

                    {/* Historial de Pagos */}
                    {detallesDeuda?.pagos_realizados && detallesDeuda.pagos_realizados.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">📊 Historial de Pagos</h4>
                        <div className="bg-gray-50 rounded p-3 space-y-2">
                          {detallesDeuda.pagos_realizados.map((pago: any) => (
                            <div key={pago.pago_id} className="flex justify-between text-xs border-b pb-2">
                              <span>
                                {new Date(pago.fecha_hora).toLocaleDateString('es-PE')} - {pago.metodo_pago}
                              </span>
                              <span className="font-semibold">S/. {Number(pago.monto).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Formulario de pago */}
                    <div className="pt-2 border-t">
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="monto-pago" className="text-sm font-semibold">Monto a Pagar (S/.) *</Label>
                          <Input
                            id="monto-pago"
                            type="number"
                            step="0.01"
                            min="0"
                            max={Number(detallesDeuda?.saldo_pendiente)}
                            value={montoPago}
                            onChange={(e) => setMontoPago(Number(e.target.value))}
                            className="mt-1 text-base font-semibold"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Máximo: S/. {Number(detallesDeuda?.saldo_pendiente).toFixed(2)}
                          </p>
                        </div>

                        <div>
                          <Label htmlFor="metodo-pago" className="text-sm font-semibold">Método de Pago *</Label>
                          <Select value={metodoPago} onValueChange={setMetodoPago}>
                            <SelectTrigger id="metodo-pago" className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="EFECTIVO">💵 Efectivo</SelectItem>
                              <SelectItem value="YAPE">📱 Yape</SelectItem>
                              <SelectItem value="PLIN">📱 Plin</SelectItem>
                              <SelectItem value="TRANSFERENCIA">🏦 Transferencia</SelectItem>
                              <SelectItem value="OTRO">📝 Otro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {mensajeAccion && (
                          <div className={`p-3 rounded text-sm ${mensajeAccion.includes('Error') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                            {mensajeAccion}
                          </div>
                        )}

                        <div className="flex gap-3 pt-4">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setModalPago(false)
                              setDetallesDeuda(null)
                            }}
                            disabled={cargandoAccion}
                            className="flex-1"
                          >
                            Cancelar
                          </Button>
                          <Button
                            onClick={registrarPago}
                            disabled={cargandoAccion}
                            className="flex-1"
                          >
                            {cargandoAccion ? 'Registrando...' : '✓ Registrar Pago'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal de Cancelación */}
        {modalCancelacion && deudaSeleccionada && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-lg md:text-xl">Cancelar Deuda</CardTitle>
                <button
                  onClick={() => setModalCancelacion(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Info de la deuda */}
                <div className="p-3 bg-gray-50 rounded space-y-2">
                  <p className="text-sm">
                    <span className="font-semibold">Cliente:</span> {deudaSeleccionada.cliente_nombre}
                  </p>
                  <p className="text-sm text-red-600 font-bold">
                    <span>Saldo a Cancelar:</span> S/. {Number(deudaSeleccionada.saldo_pendiente).toFixed(2)}
                  </p>
                </div>

                {/* Formulario de cancelación */}
                <div>
                  <Label htmlFor="motivo" className="text-sm">Motivo de Cancelación *</Label>
                  <Input
                    id="motivo"
                    placeholder="Ej: Cliente desistió, acuerdo especial, etc"
                    value={motivoCancelacion}
                    onChange={(e) => setMotivoCancelacion(e.target.value)}
                    className="mt-1"
                  />
                </div>

                {mensajeAccion && (
                  <div className={`p-3 rounded text-sm ${mensajeAccion.includes('Error') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    {mensajeAccion}
                  </div>
                )}

                <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                  <p className="text-xs text-yellow-800">
                    ⚠️ Esta acción anulará la deuda y quedará registrada como cancelada en el sistema.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setModalCancelacion(false)}
                    disabled={cargandoAccion}
                    className="flex-1"
                  >
                    No Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={cancelarDeuda}
                    disabled={cargandoAccion}
                    className="flex-1"
                  >
                    {cargandoAccion ? 'Cancelando...' : 'Confirmar Cancelación'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  )
}
