// Tipos de datos replicados de los modelos Java

export enum TipoDoc {
  DNI = "DNI",
  CARNET_EXTRANJERIA = "CARNET_EXTRANJERIA",
  PASAPORTE = "PASAPORTE",
}

export enum EstadoCompra {
  PENDIENTE = "PENDIENTE",
  CONFIRMADA = "CONFIRMADA",
  PREPARANDO = "PREPARANDO",
  ENVIADA = "ENVIADA",
  DESPACHADO = "DESPACHADO",
  ENTREGADA = "ENTREGADA",
  CANCELADA = "CANCELADA",
}

export interface Usuario {
  id: number
  user: string
  password: string
  correo: string
  nombres?: string
  apellidoPaterno?: string
  apellidoMaterno?: string
  direccion1?: string
  direccion2?: string
  numero?: string
  genero?: string
  dni?: string
  fechaNacimiento?: Date
  fechaRegistro: Date
  tipoDoc?: TipoDoc
  activo: boolean
  roles: Rol[]
}

export interface Rol {
  id: number
  nombre: string
  descripcion?: string
  activo?: boolean
}

export interface Categoria {
  id: number
  nombre: string
  descripcion?: string
  activa: boolean
}

export interface Producto {
  id: number
  nombre: string
  categoria: Categoria
  precio: number
  stock: number
  disponible: boolean
  imagen?: string
  descripcion?: string
}

export interface ItemCarrito {
  id: number
  usuarioId: number
  productoId: number
  cantidad: number
  producto?: Producto
}

export interface Compra {
  id: number
  usuarioId: number
  fecha: Date
  total: number
  estado: EstadoCompra
  direccionEnvio: string
  numeroSeguimiento?: string
  detalles: DetalleCompra[]
}

export interface DetalleCompra {
  id: number
  compraId: number
  productoId: number
  cantidad: number
  precioUnitario: number
  subtotal: number
  producto?: Producto
}

export interface Resena {
  id: number
  usuarioId: number
  productoId: number
  calificacion: number
  comentario?: string
  fecha: Date
  aprobada: boolean
}

export interface Notificacion {
  id: number
  usuarioId: number
  mensaje: string
  leida: boolean
  fecha: Date
  tipo: string
}

export interface ConfiguracionSistema {
  id: number
  aplicarIGV: boolean
  porcentajeIGV: number
  aplicarEnvio: boolean
  costoEnvio: number
}

export interface Ruta {
  id: number
  ruta: string
  metodo: string
  descripcion?: string
  esPublica: boolean
  categoria: string
  activa: boolean
  rolesPermitidos: Rol[]
}

export interface Permiso {
  id: number
  rolId: number
  recurso: string
  accion: string
}
