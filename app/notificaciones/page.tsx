"use client"

import { useState, useEffect } from "react"
import { Bell, Check } from "lucide-react"
import Navbar from "@/components/layout/navbar"

interface Notificacion {
  id: number
  mensaje: string
  leida: boolean
  fecha: string
}

export default function NotificacionesPage() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarNotificaciones()
  }, [])

  const cargarNotificaciones = async () => {
    try {
      const res = await fetch("/api/notificaciones")
      if (res.ok) {
        const data = await res.json()
        setNotificaciones(data)
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const marcarComoLeida = async (id: number) => {
    try {
      const res = await fetch(`/api/notificaciones/${id}/marcar-leida`, {
        method: "POST",
      })

      if (res.ok) {
        setNotificaciones(notificaciones.map((n) => (n.id === id ? { ...n, leida: true } : n)))
      }
    } catch (error) {
      console.error("Error:", error)
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="pt-16 p-8">Cargando notificaciones...</div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="pt-16 container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Notificaciones</h1>

      {notificaciones.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          <Bell className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p>No tienes notificaciones</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notificaciones.map((notif) => (
            <div
              key={notif.id}
              className={`bg-white rounded-lg shadow p-6 flex items-start justify-between ${!notif.leida ? "border-l-4 border-blue-500" : ""}`}
            >
              <div className="flex-1">
                <p className={`${!notif.leida ? "font-semibold" : ""} mb-2`}>{notif.mensaje}</p>
                <p className="text-sm text-gray-500">{new Date(notif.fecha).toLocaleString("es-PE")}</p>
              </div>
              {!notif.leida && (
                <button
                  onClick={() => marcarComoLeida(notif.id)}
                  className="ml-4 p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                  title="Marcar como leída"
                >
                  <Check className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      </div>
    </>
  )
}
