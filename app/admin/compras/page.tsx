"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"
import { Search, Filter, Edit } from "lucide-react"

export default function AdminComprasPage() {
  const router = useRouter()
  const [compras, setCompras] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState("")
  const [busqueda, setBusqueda] = useState("")

  useEffect(() => {
    cargarCompras()
  }, [filtroEstado])

  const cargarCompras = async () => {
    try {
      const params = new URLSearchParams()
      if (filtroEstado) params.set("estado", filtroEstado)

      const res = await fetch(`/api/admin/compras?${params}`)
      if (!res.ok) {
        if (res.status === 403 || res.status === 401) {
          router.push("/acceso-denegado")
        }
        return
      }
      const data = await res.json()
      setCompras(data.compras || [])
      setLoading(false)
    } catch (error) {
      console.error(error)
      setLoading(false)
    }
  }

  const actualizarEstado = async (compraId: number, nuevoEstado: string) => {
    try {
      const res = await fetch("/api/admin/compras/actualizar-estado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ compraId, estado: nuevoEstado }),
      })

      if (res.ok) {
        alert("Estado actualizado")
        cargarCompras()
      } else {
        alert("Error al actualizar estado")
      }
    } catch (error) {
      alert("Error de conexión")
    }
  }

  const comprasFiltradas = compras.filter((c) => {
    if (!busqueda) return true
    return (
      c.id.toString().includes(busqueda) ||
      c.usuario_nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.usuario_correo?.toLowerCase().includes(busqueda.toLowerCase())
    )
  })

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#667eea] border-t-transparent"></div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Gestión de Compras</h1>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por ID, cliente..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#667eea] focus:border-transparent appearance-none"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
              >
                <option value="">Todos los estados</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="CONFIRMADA">Confirmada</option>
                <option value="PREPARANDO">Preparando</option>
                <option value="ENVIADA">Enviada</option>
                <option value="DESPACHADO">Despachado</option>
                <option value="ENTREGADA">Entregada</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
            </div>

            <button
              onClick={() => {
                setFiltroEstado("")
                setBusqueda("")
              }}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>

        {/* Tabla de compras */}
        <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {comprasFiltradas.map((compra) => (
                <tr key={compra.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{compra.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{compra.usuario_nombre}</div>
                    <div className="text-sm text-gray-500">{compra.usuario_correo}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-[#667eea]">
                    S/ {compra.total.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={compra.estado}
                      onChange={(e) => actualizarEstado(compra.id, e.target.value)}
                      className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
                    >
                      <option value="PENDIENTE">Pendiente</option>
                      <option value="CONFIRMADA">Confirmada</option>
                      <option value="PREPARANDO">Preparando</option>
                      <option value="ENVIADA">Enviada</option>
                      <option value="DESPACHADO">Despachado</option>
                      <option value="ENTREGADA">Entregada</option>
                      <option value="CANCELADA">Cancelada</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(compra.fechaCompra).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button className="text-[#667eea] hover:text-[#764ba2] flex items-center gap-1">
                      <Edit className="w-4 h-4" />
                      Ver Detalles
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Footer />
    </>
  )
}
