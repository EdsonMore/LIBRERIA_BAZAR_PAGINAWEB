'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Filter, Plus, X } from 'lucide-react'

export default function DeudasPage() {
  const [deudas, setDeudas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalDeudasPendientes, setTotalDeudasPendientes] = useState(0)

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
  const [montoPago, setMontoPago] = useState(0)
  const [metodoPago, setMetodoPago] = useState('EFECTIVO')
  const [motivoCancelacion, setMotivoCancelacion] = useState('')
  const [cargandoAccion, setCargandoAccion] = useState(false)
  const [mensajeAccion, setMensajeAccion] = useState('')

  // Cargar deudas
  useEffect(() => {
    cargarDeudas()
  }, [page, filtros])

  const cargarDeudas = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      })

      if (filtros.busqueda) params.append('busqueda', filtros.busqueda)
      if (filtros.estado) params.append('estadoPago', filtros.estado)
      if (filtros.fechaInicio) params.append('fechaInicio', filtros.fechaInicio)
      if (filtros.fechaFin) params.append('fechaFin', filtros.fechaFin)

      const response = await fetch(`/api/deudas?${params.toString()}`)
      const data = await response.json()

      setDeudas(data.deudas)
      setTotalPages(data.pagination.totalPages)
      setTotalDeudasPendientes(Number(data.resumen?.totalDeudasPendientes) || 0)
    } catch (error) {
      console.error('Error al cargar deudas:', error)
    } finally {
      setLoading(false)
    }
  }

  const abrirModalPago = (deuda: any) => {
    setDeudaSeleccionada(deuda)
    setMontoPago(deuda.saldo_pendiente)
    setModalPago(true)
  }

  const abrirModalCancelacion = (deuda: any) => {
    setDeudaSeleccionada(deuda)
    setModalCancelacion(true)
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
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">💳 Gestión de Deudas</h1>
        <p className="text-gray-600 mb-8">Administra pagos y deudas de ventas</p>

        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
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

              {/* Estado */}
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
            <CardTitle>Deudas Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
                <p className="mt-2 text-gray-600">Cargando deudas...</p>
              </div>
            ) : deudas.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No hay deudas pendientes</p>
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
                      <th className="px-4 py-3 text-right font-semibold">Saldo</th>
                      <th className="px-4 py-3 text-center font-semibold">Estado</th>
                      <th className="px-4 py-3 text-center font-semibold">Acciones</th>
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
                        <td className="px-4 py-3 text-right text-xs md:text-sm text-red-600 font-semibold">
                          S/. {Number(deuda.saldo_pendiente).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getColorEstado(deuda.estado_pago)}`}>
                            {deuda.estado_pago === 'PENDIENTE' && '⚪'}
                            {deuda.estado_pago === 'PARCIAL' && '🟡'}
                            {deuda.estado_pago === 'PAGADO' && '💚'}
                            {' '}
                            {deuda.estado_pago}
                          </span>
                        </td>
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-lg md:text-xl">Registrar Pago</CardTitle>
                <button
                  onClick={() => setModalPago(false)}
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
                  <p className="text-sm">
                    <span className="font-semibold">Total:</span> S/. {Number(deudaSeleccionada.total).toFixed(2)}
                  </p>
                  <p className="text-sm">
                    <span className="font-semibold">Pagado:</span> S/. {Number(deudaSeleccionada.monto_pagado).toFixed(2)}
                  </p>
                  <p className="text-sm font-bold text-red-600">
                    <span>Saldo:</span> S/. {Number(deudaSeleccionada.saldo_pendiente).toFixed(2)}
                  </p>
                </div>

                {/* Formulario de pago */}
                <div>
                  <Label htmlFor="monto-pago" className="text-sm">Monto a Pagar (S/.) *</Label>
                  <Input
                    id="monto-pago"
                    type="number"
                    step="0.01"
                    min="0"
                    max={Number(deudaSeleccionada.saldo_pendiente)}
                    value={montoPago}
                    onChange={(e) => setMontoPago(Number(e.target.value))}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Máximo: S/. {Number(deudaSeleccionada.saldo_pendiente).toFixed(2)}
                  </p>
                </div>

                <div>
                  <Label htmlFor="metodo-pago" className="text-sm">Método de Pago *</Label>
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
                    onClick={() => setModalPago(false)}
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
                    {cargandoAccion ? 'Registrando...' : 'Registrar Pago'}
                  </Button>
                </div>
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
