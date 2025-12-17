'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface ReportesProps {
  fechaInicio?: Date
  fechaFin?: Date
}

interface Resumen {
  total_ventas: number
  total_ingreso: number
  promedio_venta: number
  primera_venta?: string
  ultima_venta?: string
}

interface DetalleVenta {
  detalle_id: number
  producto_id: number
  producto_nombre: string
  cantidad: number
  precio_unitario: number
  subtotal: number
  es_producto_existente: boolean
}

interface Venta {
  venta_id: number
  fecha_hora: string
  metodo_pago: string
  total_venta: number
  estado_pago: string
  vendedor_id: number
  vendedor_nombre: string
  cliente_nombre: string
  cliente_email: string
  cliente_telefono: string
  propietario_id: number
  propietario_nombre: string
  detalles: DetalleVenta[]
  created_at: string
  updated_at: string
}

export function ReportesVentas({ fechaInicio, fechaFin }: ReportesProps) {
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [ventasPorVendedor, setVentasPorVendedor] = useState<any[]>([])
  const [ingresosPorPropietario, setIngresosPorPropietario] = useState<any[]>([])
  const [productosMasVendidos, setProductosMasVendidos] = useState<any[]>([])
  const [productosSolicitados, setProductosSolicitados] = useState<any[]>([])
  const [resumenMetodoPago, setResumenMetodoPago] = useState<any[]>([])
  const [listaCompra, setListaCompra] = useState<any[]>([])
  const [detallesVentas, setDetallesVentas] = useState<Venta[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ventasExpandidas, setVentasExpandidas] = useState<Set<number>>(new Set())

  // Filtros
  const [filtroFechaInicio, setFiltroFechaInicio] = useState(
    fechaInicio ? fechaInicio.toISOString().split('T')[0] : ''
  )
  const [filtroFechaFin, setFiltroFechaFin] = useState(
    fechaFin ? fechaFin.toISOString().split('T')[0] : ''
  )

  // Cargar reportes
  const cargarReportes = async () => {
    try {
      setCargando(true)
      setError(null)

      const params = new URLSearchParams({
        tipo: 'todos',
      })

      if (filtroFechaInicio) {
        params.append('fechaInicio', new Date(filtroFechaInicio).toISOString())
      }
      if (filtroFechaFin) {
        params.append('fechaFin', new Date(filtroFechaFin).toISOString())
      }

      const response = await fetch(`/api/ventas/reportes?${params.toString()}`)
      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Error al cargar reportes')
        return
      }

      const data = await response.json()
      setResumen(data.resumen || null)
      setVentasPorVendedor(data.ventasPorVendedor || [])
      setIngresosPorPropietario(data.ingresosPorPropietario || [])
      setProductosMasVendidos(data.productosMasVendidos || [])
      setProductosSolicitados(data.productosSolicitados || [])
      setResumenMetodoPago(data.resumenPorMetodoPago || [])

      // Cargar lista de compra
      cargarListaCompra()
      
      // Cargar detalles de ventas
      cargarDetallesVentas()
    } catch (err: any) {
      setError(err.message || 'Error al cargar reportes')
    } finally {
      setCargando(false)
    }
  }

  // Cargar detalles de ventas para auditoría
  const cargarDetallesVentas = async () => {
    try {
      const params = new URLSearchParams()

      if (filtroFechaInicio) {
        params.append('fechaInicio', new Date(filtroFechaInicio).toISOString())
      }
      if (filtroFechaFin) {
        params.append('fechaFin', new Date(filtroFechaFin).toISOString())
      }

      const response = await fetch(`/api/ventas/reportes/detalles?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setDetallesVentas(data.ventas || [])
      }
    } catch (err) {
      console.error('Error al cargar detalles de ventas:', err)
    }
  }

  // Toggle para expandir/contraer detalle de venta
  const toggleVentaExpandida = (ventaId: number) => {
    const nuevasExpandidas = new Set(ventasExpandidas)
    if (nuevasExpandidas.has(ventaId)) {
      nuevasExpandidas.delete(ventaId)
    } else {
      nuevasExpandidas.add(ventaId)
    }
    setVentasExpandidas(nuevasExpandidas)
  }

  // Cargar lista de compra
  const cargarListaCompra = async () => {
    try {
      const response = await fetch('/api/productos-buscados-lista?limit=100&ordenar=veces')
      if (response.ok) {
        const data = await response.json()
        setListaCompra(data.productos || [])
      }
    } catch (err) {
      console.error('Error al cargar lista de compra:', err)
    }
  }

  useEffect(() => {
    cargarReportes()
  }, [])

  // Formatear moneda
  const formatoMoneda = (monto: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(monto)
  }

  return (
    <div className="w-full space-y-4 md:space-y-6">
      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Filtros de Reportes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <div>
              <Label htmlFor="fecha-inicio" className="text-sm md:text-base">Fecha Inicio</Label>
              <Input
                id="fecha-inicio"
                type="date"
                value={filtroFechaInicio}
                onChange={(e) => setFiltroFechaInicio(e.target.value)}
                className="text-sm h-10 md:h-11"
              />
            </div>
            <div>
              <Label htmlFor="fecha-fin" className="text-sm md:text-base">Fecha Fin</Label>
              <Input
                id="fecha-fin"
                type="date"
                value={filtroFechaFin}
                onChange={(e) => setFiltroFechaFin(e.target.value)}
                className="text-sm h-10 md:h-11"
              />
            </div>
            <div className="flex flex-col md:flex-col justify-end">
              <Button onClick={cargarReportes} disabled={cargando} className="w-full text-sm md:text-base h-10 md:h-11">
                {cargando ? 'Cargando...' : '🔄 Aplicar'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded mb-6">
          {error}
        </div>
      )}

      {/* Resumen General */}
      {resumen && (
        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Resumen General</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="space-y-1">
              <p className="text-xs md:text-sm text-gray-600">Total de Ventas</p>
              <p className="text-xl md:text-2xl font-bold">{resumen.total_ventas || 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs md:text-sm text-gray-600">Total Ingreso</p>
              <p className="text-xl md:text-2xl font-bold text-green-600">
                {formatoMoneda(resumen.total_ingreso || 0)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs md:text-sm text-gray-600">Promedio</p>
              <p className="text-xl md:text-2xl font-bold">{formatoMoneda(resumen.promedio_venta || 0)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs md:text-sm text-gray-600">Período</p>
              <p className="text-xs md:text-sm font-medium">
                {filtroFechaInicio && filtroFechaFin
                  ? `${filtroFechaInicio} al ${filtroFechaFin}`
                  : 'Todos'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs con reportes detallados */}
      <Tabs defaultValue="vendedor" className="space-y-4 w-full">
        <div className="overflow-x-auto">
          <TabsList className="inline-flex w-full md:w-auto gap-2 bg-gray-100 p-1 rounded-lg flex-wrap md:flex-nowrap">
            <TabsTrigger value="vendedor" className="text-xs md:text-sm px-2 md:px-3 py-1 md:py-2 whitespace-nowrap">
              Vendedor
            </TabsTrigger>
            <TabsTrigger value="propietario" className="text-xs md:text-sm px-2 md:px-3 py-1 md:py-2 whitespace-nowrap">
              Propietario
            </TabsTrigger>
            <TabsTrigger value="productos" className="text-xs md:text-sm px-2 md:px-3 py-1 md:py-2 whitespace-nowrap">
              Productos
            </TabsTrigger>
            <TabsTrigger value="solicitados" className="text-xs md:text-sm px-2 md:px-3 py-1 md:py-2 whitespace-nowrap">
              Solicitados
            </TabsTrigger>
            <TabsTrigger value="detalles" className="text-xs md:text-sm px-2 md:px-3 py-1 md:py-2 whitespace-nowrap bg-green-100">
              📋 Detalles
            </TabsTrigger>
            <TabsTrigger value="lista" className="text-xs md:text-sm px-2 md:px-3 py-1 md:py-2 whitespace-nowrap">
              📝 Compra
            </TabsTrigger>
            <TabsTrigger value="metodos" className="text-xs md:text-sm px-2 md:px-3 py-1 md:py-2 whitespace-nowrap">
              💳 Pagos
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Ventas por Vendedor */}
        <TabsContent value="vendedor">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Ventas por Vendedor</CardTitle>
              <CardDescription className="text-xs md:text-sm">Análisis de rendimiento de vendedores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0">
                <table className="w-full text-xs md:text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2 md:px-4">Vendedor</th>
                      <th className="text-right py-2 px-2 md:px-4">Ventas</th>
                      <th className="text-right py-2 px-2 md:px-4">Ingreso</th>
                      <th className="text-right py-2 px-2 md:px-4">Promedio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventasPorVendedor.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-4 text-gray-500">
                          Sin datos
                        </td>
                      </tr>
                    ) : (
                      ventasPorVendedor.map((v, idx) => (
                        <tr key={idx} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-2 md:px-4 truncate">{v.vendedor_nombre || 'Vendedor ' + v.vendedor_id}</td>
                          <td className="text-right py-2 px-2 md:px-4 font-medium">{v.total_ventas}</td>
                          <td className="text-right py-2 px-2 md:px-4 font-semibold text-green-600">
                            {formatoMoneda(v.total_ingreso || 0)}
                          </td>
                          <td className="text-right py-2 px-2 md:px-4">{formatoMoneda(v.promedio_venta || 0)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ingresos por Propietario */}
        <TabsContent value="propietario">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Ingresos por Propietario</CardTitle>
              <CardDescription className="text-xs md:text-sm">Distribución de ingresos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0">
                <table className="w-full text-xs md:text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2 md:px-4">Propietario</th>
                      <th className="text-right py-2 px-2 md:px-4">Ventas</th>
                      <th className="text-right py-2 px-2 md:px-4">Ingresos</th>
                      <th className="text-right py-2 px-2 md:px-4">Promedio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ingresosPorPropietario.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-4 text-gray-500">
                          Sin datos
                        </td>
                      </tr>
                    ) : (
                      ingresosPorPropietario.map((p, idx) => (
                        <tr key={idx} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-2 md:px-4 truncate">{p.propietario_nombre || 'Propietario ' + p.propietario_id}</td>
                          <td className="text-right py-2 px-2 md:px-4 font-medium">{p.total_ventas}</td>
                          <td className="text-right py-2 px-2 md:px-4 font-semibold text-green-600">
                            {formatoMoneda(p.total_ingresos || 0)}
                          </td>
                          <td className="text-right py-2 px-2 md:px-4">{formatoMoneda(p.promedio_venta || 0)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Productos Más Vendidos */}
        <TabsContent value="productos">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Productos Más Vendidos</CardTitle>
              <CardDescription className="text-xs md:text-sm">Top productos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0">
                <table className="w-full text-xs md:text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2 md:px-4">Producto</th>
                      <th className="text-right py-2 px-2 md:px-4">Cantidad</th>
                      <th className="text-right py-2 px-2 md:px-4">Vendidas</th>
                      <th className="text-right py-2 px-2 md:px-4">Ingreso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productosMasVendidos.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-4 text-gray-500">
                          Sin datos
                        </td>
                      </tr>
                    ) : (
                      productosMasVendidos.map((p, idx) => (
                        <tr key={idx} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-2 md:px-4 truncate">{p.nombre}</td>
                          <td className="text-right py-2 px-2 md:px-4 font-medium">{p.total_cantidad}</td>
                          <td className="text-right py-2 px-2 md:px-4">{p.veces_vendido}</td>
                          <td className="text-right py-2 px-2 md:px-4 font-semibold text-green-600">
                            {formatoMoneda(p.total_ingreso || 0)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Productos Solicitados */}
        <TabsContent value="solicitados">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Productos Solicitados</CardTitle>
              <CardDescription className="text-xs md:text-sm">No existentes en BD</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0">
                <table className="w-full text-xs md:text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2 md:px-4">Producto</th>
                      <th className="text-right py-2 px-2 md:px-4">Solicitado</th>
                      <th className="text-left py-2 px-2 md:px-4">Última</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productosSolicitados.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center py-4 text-gray-500">
                          Sin datos
                        </td>
                      </tr>
                    ) : (
                      productosSolicitados.map((p, idx) => (
                        <tr key={idx} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-2 md:px-4 font-medium truncate">{p.nombre}</td>
                          <td className="text-right py-2 px-2 md:px-4">
                            <span className="inline-block bg-yellow-200 px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-semibold">
                              {p.cantidad_veces_solicitado}
                            </span>
                          </td>
                          <td className="py-2 px-2 md:px-4 text-xs md:text-sm text-gray-600">
                            {new Date(p.ultima_fecha_solicitud).toLocaleDateString('es-PE')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Métodos de Pago */}
        <TabsContent value="metodos">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Resumen Métodos de Pago</CardTitle>
              <CardDescription className="text-xs md:text-sm">Análisis de métodos utilizados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {resumenMetodoPago.length === 0 ? (
                  <p className="col-span-2 text-center py-4 text-gray-500">Sin datos</p>
                ) : (
                  resumenMetodoPago.map((m, idx) => (
                    <Card key={idx} className="bg-gradient-to-br from-gray-50 to-gray-100">
                      <CardContent className="pt-4 md:pt-6 space-y-2 md:space-y-3">
                        <p className="text-base md:text-lg font-bold text-center">{m.metodo_pago}</p>
                        <div className="space-y-1 text-xs md:text-sm">
                          <p className="text-gray-600">
                            Transacciones: <span className="font-semibold">{m.cantidad_transacciones}</span>
                          </p>
                          <p className="text-gray-600">
                            Total: <span className="font-semibold text-green-600">{formatoMoneda(m.total_monto || 0)}</span>
                          </p>
                          <p className="text-gray-600">
                            Promedio: <span className="font-semibold">{formatoMoneda(m.promedio_transaccion || 0)}</span>
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Detalles de Ventas - Para Auditoría */}
        <TabsContent value="detalles">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">📋 Detalles de Ventas - Auditoría</CardTitle>
              <CardDescription className="text-xs md:text-sm">Información completa de cada venta: productos, cliente, propietario, precio y método de pago</CardDescription>
            </CardHeader>
            <CardContent>
              {detallesVentas.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No hay ventas para auditar</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {detallesVentas.map((venta) => (
                    <div key={venta.venta_id} className="border rounded-lg overflow-hidden">
                      {/* Header de la venta - Resumen */}
                      <button
                        onClick={() => toggleVentaExpandida(venta.venta_id)}
                        className="w-full p-3 md:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-colors flex items-center justify-between"
                      >
                        <div className="flex-1 text-left">
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs md:text-sm">
                            <div>
                              <p className="text-gray-600 text-xs">Vendedor</p>
                              <p className="font-semibold truncate">{venta.vendedor_nombre}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 text-xs">Cliente</p>
                              <p className="font-semibold truncate">{venta.cliente_nombre}</p>
                            </div>
                            <div className="hidden md:block">
                              <p className="text-gray-600 text-xs">Fecha</p>
                              <p className="font-semibold">{new Date(venta.fecha_hora).toLocaleDateString('es-PE')}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 text-xs">Método</p>
                              <p className="font-semibold">{venta.metodo_pago}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-gray-600 text-xs">Total</p>
                              <p className="font-bold text-green-600">{formatoMoneda(venta.total_venta)}</p>
                            </div>
                          </div>
                        </div>
                        <div className="ml-2 flex-shrink-0">
                          {ventasExpandidas.has(venta.venta_id) ? (
                            <ChevronUp className="w-5 h-5 md:w-6 md:h-6" />
                          ) : (
                            <ChevronDown className="w-5 h-5 md:w-6 md:h-6" />
                          )}
                        </div>
                      </button>

                      {/* Detalle expandible */}
                      {ventasExpandidas.has(venta.venta_id) && (
                        <div className="p-3 md:p-4 bg-white border-t space-y-4">
                          {/* Información del cliente y propietario */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b">
                            <div>
                              <h4 className="font-semibold text-sm mb-2">👤 Cliente</h4>
                              <div className="space-y-1 text-xs text-gray-600">
                                <p><strong>Nombre:</strong> {venta.cliente_nombre}</p>
                                <p><strong>Email:</strong> {venta.cliente_email || 'N/A'}</p>
                                <p><strong>Teléfono:</strong> {venta.cliente_telefono || 'N/A'}</p>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-semibold text-sm mb-2">🏢 Propietario</h4>
                              <div className="space-y-1 text-xs text-gray-600">
                                <p><strong>Nombre:</strong> {venta.propietario_nombre}</p>
                                <p><strong>ID:</strong> {venta.propietario_id}</p>
                              </div>
                            </div>
                          </div>

                          {/* Tabla de productos vendidos */}
                          <div>
                            <h4 className="font-semibold text-sm mb-2">📦 Productos</h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs">
                                <thead className="bg-gray-100 border-b">
                                  <tr>
                                    <th className="text-left px-2 py-2">Producto</th>
                                    <th className="text-center px-2 py-2">Cant.</th>
                                    <th className="text-right px-2 py-2">P. Unit.</th>
                                    <th className="text-right px-2 py-2">Subtotal</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {venta.detalles.map((detalle) => (
                                    <tr key={detalle.detalle_id} className="border-b hover:bg-gray-50">
                                      <td className="px-2 py-2 font-medium truncate">{detalle.producto_nombre}</td>
                                      <td className="text-center px-2 py-2">{detalle.cantidad}</td>
                                      <td className="text-right px-2 py-2">{formatoMoneda(detalle.precio_unitario)}</td>
                                      <td className="text-right px-2 py-2 font-semibold text-green-600">
                                        {formatoMoneda(detalle.subtotal)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Resumen de totales */}
                          <div className="flex justify-end pt-2 border-t">
                            <div className="text-right space-y-1 text-sm">
                              <div className="flex gap-4">
                                <span className="font-semibold">Subtotal:</span>
                                <span>{formatoMoneda(venta.detalles.reduce((sum, d) => sum + d.subtotal, 0))}</span>
                              </div>
                              <div className="flex gap-4 text-lg font-bold text-green-600">
                                <span>Total:</span>
                                <span>{formatoMoneda(venta.total_venta)}</span>
                              </div>
                              <div className="flex gap-4 text-xs">
                                <span className="text-gray-600">Estado:</span>
                                <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded">
                                  {venta.estado_pago}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lista de Compra - Productos Buscados */}
        <TabsContent value="lista">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">📋 Lista de Compra</CardTitle>
              <CardDescription className="text-xs md:text-sm">Productos que los clientes buscan pero no encuentran</CardDescription>
            </CardHeader>
            <CardContent>
              {listaCompra.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No hay productos buscados aún</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs md:text-sm">
                    <thead className="bg-gray-100 border-b">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold">Producto</th>
                        <th className="px-3 py-2 text-center font-semibold">Búsquedas</th>
                        <th className="px-3 py-2 text-center font-semibold">Prioridad</th>
                        <th className="px-3 py-2 text-left font-semibold">Última Búsqueda</th>
                      </tr>
                    </thead>
                    <tbody>
                      {listaCompra.map((producto, idx) => {
                        const prioridad = producto.veces_buscado >= 10 ? 'URGENTE' : 
                                        producto.veces_buscado >= 5 ? 'ALTA' :
                                        producto.veces_buscado >= 2 ? 'MEDIA' : 'BAJA'
                        
                        const colorPrioridad = prioridad === 'URGENTE' ? 'bg-red-100 text-red-800' :
                                              prioridad === 'ALTA' ? 'bg-orange-100 text-orange-800' :
                                              prioridad === 'MEDIA' ? 'bg-yellow-100 text-yellow-800' :
                                              'bg-blue-100 text-blue-800'
                        
                        return (
                          <tr key={idx} className="border-b hover:bg-gray-50">
                            <td className="px-3 py-3 font-medium text-gray-900">{producto.nombre}</td>
                            <td className="px-3 py-3 text-center">
                              <span className="inline-block bg-gray-200 text-gray-800 px-2 py-1 rounded text-xs font-semibold">
                                {producto.veces_buscado}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${colorPrioridad}`}>
                                {prioridad}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-gray-600">
                              {new Date(producto.ultima_busqueda).toLocaleDateString('es-PE', {
                                year: 'numeric',
                                month: 'short',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
