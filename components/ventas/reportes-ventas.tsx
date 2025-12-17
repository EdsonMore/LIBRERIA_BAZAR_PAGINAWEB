'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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

export function ReportesVentas({ fechaInicio, fechaFin }: ReportesProps) {
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [ventasPorVendedor, setVentasPorVendedor] = useState<any[]>([])
  const [ingresosPorPropietario, setIngresosPorPropietario] = useState<any[]>([])
  const [productosMasVendidos, setProductosMasVendidos] = useState<any[]>([])
  const [productosSolicitados, setProductosSolicitados] = useState<any[]>([])
  const [resumenMetodoPago, setResumenMetodoPago] = useState<any[]>([])
  const [listaCompra, setListaCompra] = useState<any[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    } catch (err: any) {
      setError(err.message || 'Error al cargar reportes')
    } finally {
      setCargando(false)
    }
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
      <Tabs defaultValue="vendedor" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1 text-xs md:text-sm">
          <TabsTrigger value="vendedor" className="px-1 md:px-2 py-1 md:py-2">Vendedor</TabsTrigger>
          <TabsTrigger value="propietario" className="px-1 md:px-2 py-1 md:py-2">Propietario</TabsTrigger>
          <TabsTrigger value="productos" className="px-1 md:px-2 py-1 md:py-2 hidden md:flex md:col-span-1">Productos</TabsTrigger>
          <TabsTrigger value="solicitados" className="px-1 md:px-2 py-1 md:py-2">Solicitados</TabsTrigger>
          <TabsTrigger value="lista" className="px-1 md:px-2 py-1 md:py-2">📋</TabsTrigger>
          <TabsTrigger value="metodos" className="px-1 md:px-2 py-1 md:py-2 hidden lg:flex">Pagos</TabsTrigger>
        </TabsList>

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
