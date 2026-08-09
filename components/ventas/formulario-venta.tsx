'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScanLine } from 'lucide-react'
import { EscanerCodigo } from '@/components/ui/escaner-codigo'
import { CrearProductoRapido } from '@/components/ventas/crear-producto-rapido'
import { MetodoPago, Producto } from '@/lib/types'
import { useState as useStateCallback } from 'react'

interface DetalleVentaLocal {
  id: string
  productoId?: number
  nombreProducto: string
  cantidad: number
  precioUnitario: number
}

interface FormularioVentaProps {
  vendedorId: number
  usuarioId: number
  propietarios: any[] // Lista de usuarios propietarios
  onVentaRegistrada?: (ventaId: number) => void
}

export function FormularioVenta({
  vendedorId,
  usuarioId,
  propietarios,
  onVentaRegistrada,
}: FormularioVentaProps) {
  // Estados del formulario principal
  const [propietarioId, setPropietarioId] = useState<number | null>(null)
  const [propietarioManual, setPropietarioManual] = useState('')
  const [tipoPropietario, setTipoPropietario] = useState<'existente' | 'manual'>('existente')
  const [metodoPago, setMetodoPago] = useState<MetodoPago | ''>(MetodoPago.EFECTIVO)
  const [descripcionMetodo, setDescripcionMetodo] = useState('')
  const [clienteNombre, setClienteNombre] = useState('')
  const [clienteEmail, setClienteEmail] = useState('')
  const [clienteTelefono, setClienteTelefono] = useState('')

  // Estado para detalles de productos
  const [detalles, setDetalles] = useState<DetalleVentaLocal[]>([])
  const [tabActual, setTabActual] = useState('existing')

  // Estados para agregar producto
  const [productoSeleccionado, setProductoSeleccionado] = useState<number | null>(null)
  const [cantidadProductoExistente, setCantidadProductoExistente] = useState(1)
  const [productos, setProductos] = useState<Producto[]>([])
  const [cargandoProductos, setCargandoProductos] = useState(false)
  const [busquedaProducto, setBusquedaProducto] = useState('')

  // Estados para producto manual
  const [nombreProductoManual, setNombreProductoManual] = useState('')
  const [cantidadManual, setCantidadManual] = useState(1)
  const [precioManual, setPrecioManual] = useState(0)

  // Estados para enviar a lista de compra
  const [productoListaCompra, setProductoListaCompra] = useState('')
  const [cargandoLista, setCargandoLista] = useState(false)

  // Estados para pago inicial
  const [montoPagado, setMontoPagado] = useState(0)
  const [descuento, setDescuento] = useState(0)

  // Estados de carga y errores
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState<string | null>(null)

  // Estados del escáner de código de barras
  const [escanerAbierto, setEscanerAbierto] = useState(false)
  const [crearAbierto, setCrearAbierto] = useState(false)
  const [codigoPendiente, setCodigoPendiente] = useState('')
  const [buscandoCodigo, setBuscandoCodigo] = useState(false)

  // Cargar productos
  useEffect(() => {
    const cargarProductos = async () => {
      try {
        setCargandoProductos(true)
        const response = await fetch('/api/productos?limit=1000')
        const data = await response.json()
        setProductos(data.productos || [])
      } catch (err) {
        console.error('Error al cargar productos:', err)
      } finally {
        setCargandoProductos(false)
      }
    }

    cargarProductos()
  }, [])

  // Filtrar productos según búsqueda
  const productosFiltrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase()) ||
    p.id.toString().includes(busquedaProducto)
  )

  // Agregar producto existente
  const agregarProductoExistente = () => {
    if (!productoSeleccionado) {
      setError('Debe seleccionar un producto')
      return
    }

    if (cantidadProductoExistente <= 0) {
      setError('La cantidad debe ser mayor a 0')
      return
    }

    const producto = productos.find((p) => p.id === productoSeleccionado)
    if (!producto) {
      setError('Producto no encontrado')
      return
    }

    const nuevoDetalle: DetalleVentaLocal = {
      id: Math.random().toString(),
      productoId: productoSeleccionado,
      nombreProducto: producto.nombre,
      cantidad: cantidadProductoExistente,
      precioUnitario: producto.precio,
    }

    setDetalles([...detalles, nuevoDetalle])
    setProductoSeleccionado(null)
    setCantidadProductoExistente(1)
    setError(null)
  }

  // Agregar producto manual
  const agregarProductoManual = () => {
    if (!nombreProductoManual.trim()) {
      setError('El nombre del producto es requerido')
      return
    }

    if (cantidadManual <= 0) {
      setError('La cantidad debe ser mayor a 0')
      return
    }

    if (precioManual <= 0) {
      setError('El precio debe ser mayor a 0')
      return
    }

    const nuevoDetalle: DetalleVentaLocal = {
      id: Math.random().toString(),
      nombreProducto: nombreProductoManual,
      cantidad: cantidadManual,
      precioUnitario: precioManual,
    }

    setDetalles([...detalles, nuevoDetalle])
    setNombreProductoManual('')
    setCantidadManual(1)
    setPrecioManual(0)
    setError(null)
  }

  // Agregar producto directo (usado por el escáner) sin tocar el estado de selección
  const agregarProductoDirecto = (producto: Producto, cantidad: number = 1) => {
    const existente = detalles.find((d) => d.productoId === producto.id)
    if (existente) {
      setDetalles(
        detalles.map((d) =>
          d.id === existente.id ? { ...d, cantidad: d.cantidad + cantidad } : d,
        ),
      )
    } else {
      setDetalles([
        ...detalles,
        {
          id: Math.random().toString(),
          productoId: producto.id,
          nombreProducto: producto.nombre,
          cantidad,
          precioUnitario: producto.precio,
        },
      ])
    }
    setError(null)
  }

  // Manejar código de barras escaneado o ingresado manualmente
  const manejarCodigoLeido = async (codigo: string) => {
    const codigoLimpio = codigo.trim()
    if (!codigoLimpio) return

    setBuscandoCodigo(true)
    setError(null)
    try {
      const response = await fetch(`/api/productos/codigo/${encodeURIComponent(codigoLimpio)}`)
      if (!response.ok) {
        setError('Error al buscar el producto por código')
        return
      }
      const data = await response.json()

      if (data?.producto) {
        agregarProductoDirecto(data.producto)
        setExito(`✅ "${data.producto.nombre}" agregado a la venta`)
        setTimeout(() => setExito(null), 3000)
      } else {
        setCodigoPendiente(codigoLimpio)
        setCrearAbierto(true)
      }
    } catch (err: any) {
      setError(err.message || 'Error al buscar el producto')
    } finally {
      setBuscandoCodigo(false)
      setEscanerAbierto(false)
    }
  }

  // Cuando se crea un producto rápido desde el escáner
  const manejarProductoCreado = (producto: { id: number; nombre: string; precio: number }) => {
    agregarProductoDirecto({ ...producto, stock: 0, disponible: true } as Producto)
    setExito(`✅ "${producto.nombre}" creado y agregado a la venta`)
    setTimeout(() => setExito(null), 4000)
  }

  // Enviar producto a lista de compra
  const enviarAListaCompra = async () => {
    if (!productoListaCompra.trim()) {
      setError('Debe ingresar el nombre del producto')
      return
    }

    try {
      setCargandoLista(true)
      const response = await fetch('/api/productos-buscados-lista', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: productoListaCompra.trim(),
          usuarioId,
          clienteNombre: clienteNombre || 'Desconocido',
          clienteEmail: clienteEmail || undefined,
          clienteTelefono: clienteTelefono || undefined,
        }),
      })

      if (!response.ok) {
        throw new Error('Error al enviar a lista de compra')
      }

      setExito(`✅ "${productoListaCompra}" agregado a la lista de compra`)
      setProductoListaCompra('')
      setTimeout(() => setExito(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Error al enviar a lista de compra')
    } finally {
      setCargandoLista(false)
    }
  }

  // Remover detalle
  const removerDetalle = (id: string) => {
    setDetalles(detalles.filter((d) => d.id !== id))
  }

  // Calcular totales
  const subtotal = detalles.reduce((sum, d) => sum + d.cantidad * d.precioUnitario, 0)
  const total = subtotal - descuento

  // Registrar venta
  const registrarVenta = async () => {
    // Validaciones
    if (tipoPropietario === 'existente' && !propietarioId) {
      setError('Debe seleccionar un propietario')
      return
    }

    if (tipoPropietario === 'manual' && !propietarioManual.trim()) {
      setError('Debe ingresar el nombre del propietario')
      return
    }

    if (!metodoPago) {
      setError('Debe seleccionar un método de pago')
      return
    }

    if (metodoPago === MetodoPago.OTRO && !descripcionMetodo.trim()) {
      setError('Debe describir el método de pago OTRO')
      return
    }

    if (detalles.length === 0) {
      setError('Debe agregar al menos un producto a la venta')
      return
    }

    try {
      setCargando(true)
      setError(null)

      const payload = {
        vendedorId,
        propietarioId: tipoPropietario === 'existente' ? propietarioId : null,
        propietarioNombre: tipoPropietario === 'manual' ? propietarioManual : undefined,
        metodoPago,
        descripcionMetodoOtro: descripcionMetodo || undefined,
        clienteNombre: clienteNombre || undefined,
        clienteEmail: clienteEmail || undefined,
        clienteTelefono: clienteTelefono || undefined,
        subtotal,
        descuento: descuento || 0,
        montoPagado: montoPagado || 0,
        detalles: detalles.map((d) => ({
          productoId: d.productoId || undefined,
          nombreProducto: d.nombreProducto,
          cantidad: d.cantidad,
          precioUnitario: d.precioUnitario,
        })),
      }

      const response = await fetch('/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Error al registrar la venta')
        return
      }

      const data = await response.json()
      setExito(`¡Venta registrada exitosamente! ID: ${data.ventaId}`)

      // Limpiar formulario
      setDetalles([])
      setPropietarioId(null)
      setPropietarioManual('')
      setTipoPropietario('existente')
      setClienteNombre('')
      setClienteEmail('')
      setClienteTelefono('')
      setMetodoPago(MetodoPago.EFECTIVO)
      setBusquedaProducto('')
      setProductoSeleccionado(null)
      setMontoPagado(0)
      setDescuento(0)
      setCantidadProductoExistente(1)

      if (onVentaRegistrada) {
        onVentaRegistrada(data.ventaId)
      }

      // Limpiar mensaje después de 5 segundos
      setTimeout(() => setExito(null), 5000)
    } catch (err: any) {
      setError(err.message || 'Error al registrar la venta')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Registrar Venta</CardTitle>
          <CardDescription>Formulario rápido para registrar nuevas ventas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mensajes */}
          {error && (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          {exito && (
            <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              {exito}
            </div>
          )}

          {/* Sección 1: Información básica */}
          <div className="space-y-4 border-b pb-6">
            <h3 className="text-lg md:text-xl font-semibold">Información de la Venta</h3>

            <div className="space-y-4">
              {/* Selección de tipo de propietario */}
              <div>
                <Label className="text-sm md:text-base mb-2 block">Propietario del Producto *</Label>
                <Tabs value={tipoPropietario} onValueChange={(v) => setTipoPropietario(v as 'existente' | 'manual')}>
                  <TabsList className="grid w-full grid-cols-2 text-xs md:text-sm">
                    <TabsTrigger value="existente">Del Sistema</TabsTrigger>
                    <TabsTrigger value="manual">Ingresa Otro</TabsTrigger>
                  </TabsList>

                  {/* Tab: Propietario Existente */}
                  <TabsContent value="existente" className="space-y-3 mt-3">
                    <Select value={propietarioId?.toString() || ''} onValueChange={(v) => setPropietarioId(Number(v))}>
                      <SelectTrigger className="text-sm md:text-base h-10 md:h-11">
                        <SelectValue placeholder="Seleccionar propietario" />
                      </SelectTrigger>
                      <SelectContent>
                        {propietarios.map((p) => (
                          <SelectItem key={p.id} value={p.id.toString()}>
                            {p.nombres}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TabsContent>

                  {/* Tab: Propietario Manual */}
                  <TabsContent value="manual" className="space-y-3 mt-3">
                    <Input
                      placeholder="Nombre del propietario"
                      value={propietarioManual}
                      onChange={(e) => setPropietarioManual(e.target.value)}
                      className="text-sm md:text-base h-10 md:h-11"
                    />
                  </TabsContent>
                </Tabs>
              </div>

              {/* Método de pago */}
              <div>
                <Label htmlFor="metodo-pago" className="text-sm md:text-base">Método de Pago *</Label>
                <Select value={metodoPago} onValueChange={(v) => setMetodoPago(v as MetodoPago)}>
                  <SelectTrigger id="metodo-pago" className="text-sm md:text-base h-10 md:h-11">
                    <SelectValue placeholder="Seleccionar método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={MetodoPago.EFECTIVO}>Efectivo</SelectItem>
                    <SelectItem value={MetodoPago.YAPE}>Yape</SelectItem>
                    <SelectItem value={MetodoPago.PLIN}>Plin</SelectItem>
                    <SelectItem value={MetodoPago.TRANSFERENCIA}>Transferencia</SelectItem>
                    <SelectItem value={MetodoPago.OTRO}>Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {metodoPago === MetodoPago.OTRO && (
              <div>
                <Label htmlFor="descripcion-metodo">Descripción del Método</Label>
                <Input
                  id="descripcion-metodo"
                  placeholder="Ej: Cheque, deposito en banco, etc"
                  value={descripcionMetodo}
                  onChange={(e) => setDescripcionMetodo(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Sección 2: Información del cliente (opcional) */}
          <div className="space-y-4 border-b pb-6">
            <h3 className="text-lg md:text-xl font-semibold">Información del Cliente (Opcional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="cliente-nombre" className="text-sm md:text-base">Nombre</Label>
                <Input
                  id="cliente-nombre"
                  placeholder="Nombre del cliente"
                  value={clienteNombre}
                  onChange={(e) => setClienteNombre(e.target.value)}
                  className="text-sm md:text-base h-10 md:h-11"
                />
              </div>
              <div>
                <Label htmlFor="cliente-email" className="text-sm md:text-base">Email</Label>
                <Input
                  id="cliente-email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={clienteEmail}
                  onChange={(e) => setClienteEmail(e.target.value)}
                  className="text-sm md:text-base h-10 md:h-11"
                />
              </div>
              <div>
                <Label htmlFor="cliente-telefono" className="text-sm md:text-base">Teléfono</Label>
                <Input
                  id="cliente-telefono"
                  placeholder="+51 999 999 999"
                  value={clienteTelefono}
                  onChange={(e) => setClienteTelefono(e.target.value)}
                  className="text-sm md:text-base h-10 md:h-11"
                />
              </div>
            </div>
          </div>

          {/* Sección 3: Agregar productos */}
          <div className="space-y-4 border-b pb-6">
            <h3 className="text-lg md:text-xl font-semibold">Agregar Productos *</h3>

            <Tabs value={tabActual} onValueChange={setTabActual}>
              <TabsList className="flex flex-col md:grid w-full md:grid-cols-3 gap-2 md:gap-0 text-xs md:text-sm h-auto md:h-auto p-0 bg-transparent">
                <TabsTrigger value="existing" className="flex-1 py-2 md:py-0">Producto Existente</TabsTrigger>
                <TabsTrigger value="manual" className="flex-1 py-2 md:py-0">Producto Manual</TabsTrigger>
                <TabsTrigger value="lista" className="flex-1 py-2 md:py-0">📋 Lista</TabsTrigger>
              </TabsList>

              {/* Tab: Producto Existente */}
              <TabsContent value="existing" className="space-y-4 mt-4">
                {/* Escáner de código de barras */}
                <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center sm:justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="text-sm text-purple-900">
                    <p className="font-semibold">📷 Escanear producto</p>
                    <p className="text-xs text-purple-800">
                      Escanea el código de barras para agregarlo rápido a la venta
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => setEscanerAbierto(true)}
                    disabled={buscandoCodigo}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-sm h-9"
                  >
                    <ScanLine className="w-4 h-4 mr-1" />
                    {buscandoCodigo ? 'Buscando...' : 'Escanear'}
                  </Button>
                </div>

                {/* Buscador de productos */}
                <div>
                  <Label htmlFor="busqueda-producto" className="text-sm md:text-base">🔍 Buscar Producto</Label>
                  <Input
                    id="busqueda-producto"
                    placeholder="Escribe el nombre o código..."
                    value={busquedaProducto}
                    onChange={(e) => setBusquedaProducto(e.target.value)}
                    className="text-sm md:text-base h-10 md:h-11"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Mostrando {productosFiltrados.length} de {productos.length} productos
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="producto" className="text-sm md:text-base">Producto</Label>
                    <Select
                      value={productoSeleccionado?.toString() || ''}
                      onValueChange={(v) => setProductoSeleccionado(Number(v))}
                      disabled={cargandoProductos || productosFiltrados.length === 0}
                    >
                      <SelectTrigger id="producto" className="text-sm md:text-base h-10 md:h-11">
                        <SelectValue
                          placeholder={cargandoProductos ? 'Cargando...' : 'Seleccionar producto'}
                        />
                      </SelectTrigger>
                      <SelectContent className="max-h-64">
                        {productosFiltrados.length === 0 ? (
                          <div className="p-4 text-sm text-gray-500 text-center">
                            No se encontraron productos
                          </div>
                        ) : (
                          productosFiltrados.map((p) => (
                            <SelectItem key={p.id} value={p.id.toString()} className="text-sm">
                              {p.nombre} - S/. {Number(p.precio).toFixed(2)}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="cantidad-existente" className="text-sm md:text-base">Cantidad</Label>
                    <Input
                      id="cantidad-existente"
                      type="number"
                      min="1"
                      value={cantidadProductoExistente}
                      onChange={(e) => setCantidadProductoExistente(Number(e.target.value))}
                      className="text-sm md:text-base h-10 md:h-11"
                    />
                  </div>
                </div>
                <Button onClick={agregarProductoExistente} className="w-full text-sm md:text-base h-10 md:h-11">
                  Agregar Producto
                </Button>
              </TabsContent>

              {/* Tab: Producto Manual */}
              <TabsContent value="manual" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nombre-manual" className="text-sm md:text-base">Nombre del Producto</Label>
                    <Input
                      id="nombre-manual"
                      placeholder="Ej: Vino especial, licor importado, etc"
                      value={nombreProductoManual}
                      onChange={(e) => setNombreProductoManual(e.target.value)}
                      className="text-sm md:text-base h-10 md:h-11"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cantidad-manual" className="text-sm md:text-base">Cantidad</Label>
                      <Input
                        id="cantidad-manual"
                        type="number"
                        min="1"
                        value={cantidadManual}
                        onChange={(e) => setCantidadManual(Number(e.target.value))}
                        className="text-sm md:text-base h-10 md:h-11"
                      />
                    </div>
                    <div>
                      <Label htmlFor="precio-manual" className="text-sm md:text-base">Precio (S/.)</Label>
                      <Input
                        id="precio-manual"
                        type="number"
                        min="0"
                        step="0.01"
                        value={precioManual}
                        onChange={(e) => setPrecioManual(Number(e.target.value))}
                        className="text-sm md:text-base h-10 md:h-11"
                      />
                    </div>
                  </div>
                </div>
                <Button onClick={agregarProductoManual} className="w-full text-sm md:text-base h-10 md:h-11">
                  Agregar Producto Manual
                </Button>
              </TabsContent>

              {/* Tab: Enviar a Lista de Compra */}
              <TabsContent value="lista" className="space-y-4 mt-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-blue-900 mb-2">
                      📋 Enviar producto a la Lista de Compra
                    </p>
                    <p className="text-xs text-blue-800 mb-3">
                      Si no encuentras un producto, indícalo aquí para que lo revisemos y agreguemos al inventario
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="producto-lista" className="text-sm md:text-base">
                        Nombre del producto que no encuentras *
                      </Label>
                      <Input
                        id="producto-lista"
                        placeholder="Ej: Pisco Acholado Premium, Vino Tinto Reserva..."
                        value={productoListaCompra}
                        onChange={(e) => setProductoListaCompra(e.target.value)}
                        disabled={cargandoLista}
                        className="text-sm md:text-base h-10 md:h-11"
                      />
                    </div>

                    <Button
                      onClick={enviarAListaCompra}
                      disabled={cargandoLista || !productoListaCompra.trim()}
                      className="w-full text-sm md:text-base h-10 md:h-11 bg-blue-600 hover:bg-blue-700"
                    >
                      {cargandoLista ? 'Enviando...' : '📋 Agregar a Lista de Compra'}
                    </Button>

                    {exito && (
                      <div className="p-3 bg-green-100 border border-green-300 text-green-800 text-sm rounded-lg">
                        {exito}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sección 4: Detalle de productos agregados */}
          {detalles.length > 0 && (
            <div className="space-y-4 border-b pb-6">
              <h3 className="text-lg md:text-xl font-semibold">Productos en la Venta</h3>
              <div className="space-y-2">
                {detalles.map((detalle) => (
                  <div key={detalle.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4 p-3 bg-gray-50 rounded border text-sm md:text-base">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{detalle.nombreProducto}</p>
                      <p className="text-xs md:text-sm text-gray-600 mt-1">
                        {detalle.cantidad} x S/. {Number(detalle.precioUnitario).toFixed(2)} = S/.{' '}
                        {(detalle.cantidad * Number(detalle.precioUnitario)).toFixed(2)}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removerDetalle(detalle.id)}
                      className="text-xs md:text-sm h-8 md:h-9"
                    >
                      Remover
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sección 5: Pago Inicial y Descuento */}
          <div className="space-y-4 border-b pb-6">
            <h3 className="text-lg md:text-xl font-semibold">Pago Inicial (Opcional)</h3>
            <p className="text-xs md:text-sm text-gray-600">
              Puedes registrar un pago inicial ahora o dejar la venta como pendiente de pago
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="descuento" className="text-sm md:text-base">Descuento (S/.)</Label>
                <Input
                  id="descuento"
                  type="number"
                  min="0"
                  step="0.01"
                  value={descuento}
                  onChange={(e) => setDescuento(Number(e.target.value))}
                  className="text-sm md:text-base h-10 md:h-11"
                />
              </div>
              <div>
                <Label htmlFor="monto-pagado" className="text-sm md:text-base">Monto Pagado (S/.)</Label>
                <Input
                  id="monto-pagado"
                  type="number"
                  min="0"
                  step="0.01"
                  value={montoPagado}
                  onChange={(e) => setMontoPagado(Number(e.target.value))}
                  className="text-sm md:text-base h-10 md:h-11"
                />
              </div>
            </div>

            {montoPagado > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900">
                  ✓ Estado de Pago: {
                    montoPagado === (subtotal - descuento) ? '💚 PAGADO' :
                    montoPagado > 0 ? '🟡 PARCIAL' :
                    '⚪ PENDIENTE'
                  }
                </p>
                <p className="text-xs text-blue-800 mt-1">
                  Total: S/. {(subtotal - descuento).toFixed(2)} | Pagado: S/. {montoPagado.toFixed(2)} | 
                  Saldo: S/. {Math.max(0, (subtotal - descuento) - montoPagado).toFixed(2)}
                </p>
              </div>
            )}
          </div>

          {/* Resumen de totales */}
          <div className="space-y-2 p-4 bg-slate-100 rounded border text-sm md:text-base">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-semibold">S/. {subtotal.toFixed(2)}</span>
            </div>
            {descuento > 0 && (
              <div className="flex justify-between text-orange-600">
                <span>Descuento:</span>
                <span className="font-semibold">-S/. {descuento.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-base md:text-lg border-t pt-2">
              <span className="font-semibold">Total:</span>
              <span className="font-bold text-primary">S/. {total.toFixed(2)}</span>
            </div>
            {montoPagado > 0 && (
              <>
                <div className="flex justify-between text-sm text-green-600 border-t pt-2">
                  <span>Monto Pagado:</span>
                  <span className="font-semibold">+S/. {montoPagado.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-red-600">
                  <span>Saldo Pendiente:</span>
                  <span>S/. {Math.max(0, total - montoPagado).toFixed(2)}</span>
                </div>
              </>
            )}
          </div>

          {/* Botón registrar */}
          <Button
            onClick={registrarVenta}
            disabled={cargando || detalles.length === 0}
            size="lg"
            className="w-full text-base md:text-lg h-11 md:h-12 font-semibold"
          >
            {cargando ? 'Registrando...' : '✅ Registrar Venta'}
          </Button>
        </CardContent>
      </Card>

      {/* Escáner de código de barras */}
      <EscanerCodigo
        open={escanerAbierto}
        onOpenChange={setEscanerAbierto}
        onCodigoLeido={manejarCodigoLeido}
        titulo="Escanear producto para la venta"
      />

      {/* Crear producto rápido cuando el código no existe */}
      <CrearProductoRapido
        open={crearAbierto}
        onOpenChange={setCrearAbierto}
        codigoInicial={codigoPendiente}
        onProductoCreado={manejarProductoCreado}
      />
    </div>
  )
}
