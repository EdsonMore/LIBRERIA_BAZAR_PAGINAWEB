"use client"

import { useState, useEffect } from "react"
import { Edit2, Trash2, CheckCircle, XCircle } from "lucide-react"

interface Usuario {
  id: number
  user?: string
  nombres: string
  apellidoPaterno: string
  apellidoMaterno: string
  correo: string
  numero: string
  dni?: string
  genero?: string
  fechaNacimiento?: string
  direccion1?: string
  direccion2?: string
  activo: boolean
  roles: string[]
  ultima_conexion?: string | null
}

interface Rol {
  id: number
  nombre: string
}

type ModalType = "roles" | "editar" | "eliminar" | null

export default function SuperAdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [roles, setRoles] = useState<Rol[]>([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState<Usuario | null>(null)
  const [modalType, setModalType] = useState<ModalType>(null)
  const [formData, setFormData] = useState<Partial<Usuario>>({})
  const [loadingAction, setLoadingAction] = useState(false)
  const [messageSuccess, setMessageSuccess] = useState("")
  const [usuarioAEliminar, setUsuarioAEliminar] = useState<Usuario | null>(null)
  const [confirmacionEliminar, setConfirmacionEliminar] = useState("")
  const [usuarioActual, setUsuarioActual] = useState<Usuario | null>(null)

  // Función para formatear fecha relativa
  const formatFechaRelativa = (fecha: string | null | undefined) => {
    if (!fecha) return "Nunca"

    const ahora = new Date()
    const fecha_obj = new Date(fecha)
    const diferencia = ahora.getTime() - fecha_obj.getTime()
    const minutos = Math.floor(diferencia / (1000 * 60))
    const horas = Math.floor(diferencia / (1000 * 60 * 60))
    const días = Math.floor(diferencia / (1000 * 60 * 60 * 24))
    const semanas = Math.floor(días / 7)
    const meses = Math.floor(días / 30)

    if (minutos < 1) return "Hace unos segundos"
    if (minutos < 60) return `Hace ${minutos} min${minutos > 1 ? "s" : ""}`
    if (horas < 24) return `Hace ${horas} h${horas > 1 ? "a" : ""}`
    if (días < 7) return `Hace ${días} día${días > 1 ? "s" : ""}`
    if (semanas < 4) return `Hace ${semanas} semana${semanas > 1 ? "s" : ""}`
    if (meses < 12) return `Hace ${meses} mes${meses > 1 ? "es" : ""}`

    return fecha_obj.toLocaleDateString("es-PE", { year: "numeric", month: "short", day: "numeric" })
  }

  useEffect(() => {
    cargarDatos()
    cargarUsuarioActual()
  }, [])

  const cargarUsuarioActual = async () => {
    try {
      const res = await fetch("/api/auth/me")
      if (res.ok) {
        const data = await res.json()
        setUsuarioActual(data.usuario)
      }
    } catch (error) {
      console.error("Error al cargar usuario actual:", error)
    }
  }

  const cargarDatos = async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([fetch("/api/admin/usuarios"), fetch("/api/admin/roles")])

      if (usersRes.ok) {
        const data = await usersRes.json()
        setUsuarios(data)
      }
      if (rolesRes.ok) {
        const data = await rolesRes.json()
        setRoles(data)
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAsignarRoles = async (usuarioId: number, roleIds: number[]) => {
    try {
      setLoadingAction(true)
      const res = await fetch("/api/admin/usuarios/asignar-roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuarioId, roleIds }),
      })

      if (res.ok) {
        setModalType(null)
        setEditando(null)
        cargarDatos()
      } else {
        alert("Error al asignar roles")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al asignar roles")
    } finally {
      setLoadingAction(false)
    }
  }

  const handleActualizarUsuario = async () => {
    try {
      if (!editando) return
      setLoadingAction(true)

      const res = await fetch(`/api/admin/usuarios/${editando.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombres: formData.nombres,
          apellidoPaterno: formData.apellidoPaterno,
          apellidoMaterno: formData.apellidoMaterno,
          correo: formData.correo,
          numero: formData.numero,
          dni: formData.dni,
          genero: formData.genero,
          fechaNacimiento: formData.fechaNacimiento,
          direccion1: formData.direccion1,
          direccion2: formData.direccion2,
        }),
      })

      if (res.ok) {
        setMessageSuccess(`✓ ¡Usuario ${formData.nombres} actualizado exitosamente!`)
        setModalType(null)
        setEditando(null)
        cargarDatos()
        // Auto-limpiar mensaje después de 3 segundos
        setTimeout(() => setMessageSuccess(""), 3000)
      } else {
        const error = await res.json()
        alert(error.error || "Error al actualizar usuario")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al actualizar usuario")
    } finally {
      setLoadingAction(false)
    }
  }

  const toggleActivo = async (id: number, activo: boolean) => {
    try {
      const res = await fetch("/api/admin/usuarios/toggle", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, activo: !activo }),
      })

      if (res.ok) {
        cargarDatos()
      }
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const puedeEliminar = (usuario: Usuario): { puede: boolean; razon: string } => {
    if (!usuarioActual) return { puede: false, razon: "Cargando información..." }

    // No puede eliminar a sí mismo
    if (usuarioActual.id === usuario.id) {
      return { puede: false, razon: "No puedes eliminar tu propia cuenta" }
    }

    // No puede eliminar a otros SUPER_ADMIN
    const esOtroAdmin = usuario.roles?.includes("ROLE_SUPER_ADMIN")
    if (esOtroAdmin) {
      return { puede: false, razon: "No puedes eliminar a otros administradores" }
    }

    return { puede: true, razon: "Eliminar usuario" }
  }

  const handleEliminarUsuario = async () => {
    try {
      if (!usuarioAEliminar) {
        console.error("❌ usuarioAEliminar es null")
        return
      }

      console.log("🗑️ Intentando eliminar usuario:", usuarioAEliminar.id, usuarioAEliminar.user)
      setLoadingAction(true)

      const res = await fetch("/api/admin/usuarios/eliminar", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuarioId: usuarioAEliminar.id }),
      })

      const data = await res.json()

      console.log("📡 Respuesta del servidor:", res.status, data)

      if (res.ok) {
        setMessageSuccess(`✓ ${data.message}`)
        setModalType(null)
        setUsuarioAEliminar(null)
        setConfirmacionEliminar("")
        cargarDatos()
        setTimeout(() => setMessageSuccess(""), 4000)
      } else {
        alert(`Error: ${data.error || "No se pudo eliminar el usuario"}`)
      }
    } catch (error) {
      console.error("Error al eliminar:", error)
      alert("Error al eliminar usuario")
    } finally {
      setLoadingAction(false)
    }
  }

  if (loading) {
    return <div className="p-8">Cargando usuarios...</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Gestión de Usuarios - SuperAdmin</h1>

      {messageSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center justify-between">
          <span>{messageSuccess}</span>
          <button
            onClick={() => setMessageSuccess("")}
            className="text-green-700 hover:text-green-900 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Correo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roles</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Última Conexión</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {usuarios.map((usuario) => (
              <tr key={usuario.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">
                    {usuario.nombres} {usuario.apellidoPaterno}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{usuario.correo}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{usuario.numero || "N/A"}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-wrap gap-1">
                    {usuario.roles.map((rol, idx) => (
                      <span key={idx} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                        {rol}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {formatFechaRelativa(usuario.ultima_conexion)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${usuario.activo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                  >
                    {usuario.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditando(usuario)
                        setFormData({
                          nombres: usuario.nombres || "",
                          apellidoPaterno: usuario.apellidoPaterno || "",
                          apellidoMaterno: usuario.apellidoMaterno || "",
                          correo: usuario.correo || "",
                          numero: usuario.numero || "",
                          dni: usuario.dni || "",
                          genero: usuario.genero || "",
                          fechaNacimiento: usuario.fechaNacimiento || "",
                          direccion1: usuario.direccion1 || "",
                          direccion2: usuario.direccion2 || "",
                        })
                        setModalType("editar")
                      }}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded"
                      title="Editar información"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span className="text-xs">Editar</span>
                    </button>
                    <button
                      onClick={() => {
                        setEditando(usuario)
                        setModalType("roles")
                      }}
                      className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-800 hover:bg-purple-50 px-2 py-1 rounded"
                      title="Asignar roles"
                    >
                      <span className="text-xs">Roles</span>
                    </button>
                    <button
                      onClick={() => toggleActivo(usuario.id, usuario.activo)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded ${
                        usuario.activo
                          ? "text-red-600 hover:text-red-800 hover:bg-red-50"
                          : "text-green-600 hover:text-green-800 hover:bg-green-50"
                      }`}
                      title={usuario.activo ? "Desactivar" : "Activar"}
                    >
                      {usuario.activo ? (
                        <>
                          <XCircle className="w-4 h-4" />
                          <span className="text-xs">Desact.</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-xs">Activ.</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        const resultado = puedeEliminar(usuario)
                        if (!resultado.puede) {
                          alert(resultado.razon)
                          return
                        }
                        setUsuarioAEliminar(usuario)
                        setModalType("eliminar")
                      }}
                      disabled={!puedeEliminar(usuario).puede}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded ${
                        puedeEliminar(usuario).puede
                          ? "text-red-600 hover:text-red-800 hover:bg-red-50 cursor-pointer"
                          : "text-gray-400 cursor-not-allowed opacity-50"
                      }`}
                      title={puedeEliminar(usuario).razon || "Eliminar usuario"}
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-xs">Eliminar</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalType === "editar" && editando && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Editar Usuario</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>ID:</strong> {editando.id} | <strong>Estado:</strong>{" "}
                <span className={editando.activo ? "text-green-600" : "text-red-600"}>
                  {editando.activo ? "Activo" : "Inactivo"}
                </span>
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleActualizarUsuario()
              }}
              className="space-y-5"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nombres <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nombres || ""}
                    onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    placeholder="Juan"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Apellido Paterno <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.apellidoPaterno || ""}
                    onChange={(e) => setFormData({ ...formData, apellidoPaterno: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    placeholder="Pérez"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Apellido Materno
                  </label>
                  <input
                    type="text"
                    value={formData.apellidoMaterno || ""}
                    onChange={(e) => setFormData({ ...formData, apellidoMaterno: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="García"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Correo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.correo || ""}
                    onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    placeholder="juan@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Teléfono</label>
                  <input
                    type="tel"
                    value={formData.numero || ""}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="987654321"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">DNI</label>
                  <input
                    type="text"
                    value={formData.dni || ""}
                    onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="12345678"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Género</label>
                  <select
                    value={formData.genero || ""}
                    onChange={(e) => setFormData({ ...formData, genero: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha de Nacimiento</label>
                  <input
                    type="date"
                    value={formData.fechaNacimiento ? new Date(formData.fechaNacimiento).toISOString().split('T')[0] : ""}
                    onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Estado</label>
                  <div className="flex gap-2 h-10 items-center">
                    <span
                      className={`px-3 py-2 text-sm font-medium rounded-lg ${
                        editando.activo
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {editando.activo ? "✓ Activo" : "✗ Inactivo"}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleActivo(editando.id, editando.activo)}
                      className="ml-auto px-3 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg transition"
                    >
                      Cambiar
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-700 mb-3">Roles Asignados</h3>
                <div className="flex flex-wrap gap-2">
                  {editando.roles && editando.roles.length > 0 ? (
                    editando.roles.map((rol, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-full font-medium"
                      >
                        {rol}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">Sin roles asignados</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setModalType("roles")
                  }}
                  className="mt-3 px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                >
                  Editar Roles
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 border-t pt-5">
                <div className="md:col-span-2">
                  <h3 className="font-semibold text-gray-700 mb-3">Direcciones</h3>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Dirección Principal</label>
                  <input
                    type="text"
                    value={formData.direccion1 || ""}
                    onChange={(e) => setFormData({ ...formData, direccion1: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Calle Principal 123, Apto 4B"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Dirección Secundaria</label>
                  <input
                    type="text"
                    value={formData.direccion2 || ""}
                    onChange={(e) => setFormData({ ...formData, direccion2: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Calle Secundaria 456"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-6 border-t">
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {loadingAction ? "Guardando..." : "Guardar Cambios"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModalType(null)
                    setEditando(null)
                  }}
                  className="flex-1 px-4 py-2.5 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400 transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalType === "roles" && editando && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Asignar Roles</h2>
              <p className="text-gray-600 text-sm mt-1">
                {editando.nombres} {editando.apellidoPaterno}
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700">
                Selecciona los roles que tendrá este usuario. Estos permisos determinan qué acciones
                puede realizar en el sistema.
              </p>
            </div>

            <div className="space-y-3 mb-6">
              {roles && roles.length > 0 ? (
                roles.map((rol) => (
                  <div key={rol.id} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                    <input
                      type="checkbox"
                      id={`rol-${rol.id}`}
                      defaultChecked={editando.roles.includes(rol.nombre)}
                      className="h-5 w-5 text-blue-600 rounded cursor-pointer"
                      data-rol-id={rol.id}
                    />
                    <label
                      htmlFor={`rol-${rol.id}`}
                      className="ml-3 text-sm font-medium text-gray-700 cursor-pointer flex-1"
                    >
                      {rol.nombre}
                    </label>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No hay roles disponibles</p>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-3 mb-6">
              <p className="text-xs font-semibold text-gray-600 mb-2">Roles Actuales:</p>
              <div className="flex flex-wrap gap-2">
                {editando.roles && editando.roles.length > 0 ? (
                  editando.roles.map((rol, idx) => (
                    <span key={idx} className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      {rol}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-gray-500">Sin roles asignados</p>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked')
                  const roleIds = Array.from(checkboxes).map((cb) =>
                    Number.parseInt((cb as HTMLInputElement).getAttribute("data-rol-id") || "0"),
                  )
                  handleAsignarRoles(editando.id, roleIds)
                }}
                disabled={loadingAction}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loadingAction ? "Guardando..." : "Guardar Roles"}
              </button>
              <button
                onClick={() => {
                  setModalType("editar")
                }}
                className="flex-1 px-4 py-2.5 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400 transition"
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      )}

      {modalType === "eliminar" && usuarioAEliminar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-red-600 mb-2">⚠️ ELIMINAR USUARIO</h2>
              <p className="text-gray-600 text-sm">
                Esta acción <span className="font-bold text-red-600">eliminará permanentemente</span> la cuenta del usuario {usuarioAEliminar.nombres} {usuarioAEliminar.apellidoPaterno}
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-700 font-semibold mb-2">⚠️ ADVERTENCIA - ACCIÓN IRREVERSIBLE:</p>
              <ul className="text-xs text-red-600 space-y-1 list-disc list-inside">
                <li>El usuario será eliminado completamente del sistema</li>
                <li>No podrá recuperar su cuenta ni sus datos</li>
                <li>Se eliminarán todos sus registros y relaciones</li>
                <li>Esta acción será registrada en la auditoría</li>
              </ul>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirma escribiendo el usuario: <span className="text-red-600 font-bold">@{usuarioAEliminar.user}</span>
              </label>
              <input
                type="text"
                value={confirmacionEliminar}
                onChange={(e) => setConfirmacionEliminar(e.target.value)}
                placeholder={`Escribe @${usuarioAEliminar.user}`}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono"
              />
              <p className="text-xs text-gray-500 mt-2">
                Confirma el usuario exactamente para proceder con la eliminación
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  handleEliminarUsuario()
                }}
                disabled={loadingAction || confirmacionEliminar !== `@${usuarioAEliminar.user}`}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loadingAction ? "Eliminando..." : "Confirmar Eliminación"}
              </button>
              <button
                onClick={() => {
                  setModalType(null)
                  setUsuarioAEliminar(null)
                  setConfirmacionEliminar("")
                }}
                disabled={loadingAction}
                className="flex-1 px-4 py-2.5 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400 transition disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
