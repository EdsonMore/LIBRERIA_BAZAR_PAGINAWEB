'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FileText, Calendar, Download, Eye } from 'lucide-react'
import Navbar from '@/components/layout/navbar'
import Footer from '@/components/layout/footer'

interface Cotizacion {
  id: number
  titulo: string
  cliente_nombre: string
  cliente_correo: string
  estado: string
  cantidad_items: number
  total_final?: number | string
  pdf_url?: string
  fecha_generacion?: string
  fecha_actualizacion: string
}

export default function HistorialCotizacionesPage() {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    cargarHistorial()
  }, [])

  const cargarHistorial = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/cotizaciones/historial-superadmin')
      const data = await res.json()
      
      if (data.success) {
        setCotizaciones(data.cotizaciones)
      } else {
        setError('Error al cargar el historial')
      }
    } catch (err) {
      setError('Error al conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">⏳ Pendiente</span>
      case 'EN_COTIZACION':
        return <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">⚙️ En cotización</span>
      case 'COTIZADO':
        return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">✅ Cotizado</span>
      case 'ENVIADO':
        return <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">📤 Enviado</span>
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">{estado}</span>
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">📋 Historial de Cotizaciones</h1>
            <p className="text-gray-600">Todas las cotizaciones que has realizado</p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Cargando...</p>
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          ) : cotizaciones.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-600 mb-4">No tienes cotizaciones aún</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Título</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Cliente</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Items</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Total</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Estado</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Fecha</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cotizaciones.map((cot) => (
                      <tr key={cot.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-gray-900">{cot.titulo}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{cot.cliente_nombre}</p>
                            <p className="text-xs text-gray-600">{cot.cliente_correo}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 bg-[#667eea] text-white rounded-full text-sm font-semibold">
                            {cot.cantidad_items}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {cot.total_final ? (
                            <span className="font-semibold text-gray-900">
                              S/. {(Number(cot.total_final) || 0).toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {getEstadoBadge(cot.estado)}
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-gray-600">
                          {new Date(cot.fecha_actualizacion).toLocaleDateString('es-PE')}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center gap-2">
                            <Link
                              href={`/superadmin/cotizaciones?id=${cot.id}`}
                              className="inline-flex items-center justify-center w-8 h-8 text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
                              title="Ver detalles"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            {cot.pdf_url && (
                              <a
                                href={cot.pdf_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center w-8 h-8 text-[#667eea] hover:bg-blue-100 rounded-full transition-colors"
                                title="Descargar PDF"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t">
                <p className="text-sm text-gray-600">
                  Total de cotizaciones: <strong>{cotizaciones.length}</strong>
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
