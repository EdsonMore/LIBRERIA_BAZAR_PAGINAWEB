"use client"

import type React from "react"

import { useState, useEffect } from "react"

interface Config {
  aplicarIGV: boolean
  porcentajeIGV: number
  aplicarEnvio: boolean
  costoEnvio: number
}

export default function SuperAdminConfiguracionPage() {
  const [config, setConfig] = useState<Config>({
    aplicarIGV: true,
    porcentajeIGV: 18,
    aplicarEnvio: true,
    costoEnvio: 15,
  })
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState("")

  useEffect(() => {
    cargarConfiguracion()
  }, [])

  const cargarConfiguracion = async () => {
    try {
      const res = await fetch("/api/configuracion")
      if (res.ok) {
        const data = await res.json()
        setConfig(data)
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardando(true)
    setMensaje("")

    try {
      const res = await fetch("/api/admin/configuracion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })

      if (res.ok) {
        setMensaje("Configuración actualizada exitosamente")
      } else {
        setMensaje("Error al actualizar la configuración")
      }
    } catch (error) {
      console.error("Error:", error)
      setMensaje("Error al actualizar la configuración")
    } finally {
      setGuardando(false)
    }
  }

  if (loading) {
    return <div className="p-4 md:p-8">Cargando configuración...</div>
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl space-y-6">
      <h1 className="text-xl md:text-2xl font-bold">Configuración del Sistema</h1>

      {mensaje && (
        <div
          className={`p-4 rounded text-sm md:text-base ${mensaje.includes("Error") ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`}
        >
          {mensaje}
        </div>
      )}

      <form onSubmit={handleGuardar} className="bg-white rounded-lg shadow p-4 md:p-6 space-y-6">
        <div className="border-b pb-4">
          <h2 className="text-base md:text-lg font-semibold mb-4">IGV</h2>
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="aplicarIGV"
              checked={config.aplicarIGV}
              onChange={(e) => setConfig({ ...config, aplicarIGV: e.target.checked })}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <label htmlFor="aplicarIGV" className="ml-2 text-sm md:text-base font-medium text-gray-700">
              Aplicar IGV a las compras
            </label>
          </div>
          {config.aplicarIGV && (
            <div>
              <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">Porcentaje de IGV (%)</label>
              <input
                type="number"
                step="0.01"
                value={config.porcentajeIGV}
                onChange={(e) => setConfig({ ...config, porcentajeIGV: Number.parseFloat(e.target.value) })}
                className="px-4 py-2 border rounded w-full max-w-xs text-sm md:text-base"
              />
            </div>
          )}
        </div>

        <div className="border-b pb-4">
          <h2 className="text-base md:text-lg font-semibold mb-4">Envío</h2>
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="aplicarEnvio"
              checked={config.aplicarEnvio}
              onChange={(e) => setConfig({ ...config, aplicarEnvio: e.target.checked })}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <label htmlFor="aplicarEnvio" className="ml-2 text-sm md:text-base font-medium text-gray-700">
              Aplicar costo de envío
            </label>
          </div>
          {config.aplicarEnvio && (
            <div>
              <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">Costo de Envío (S/)</label>
              <input
                type="number"
                step="0.01"
                value={config.costoEnvio}
                onChange={(e) => setConfig({ ...config, costoEnvio: Number.parseFloat(e.target.value) })}
                className="px-4 py-2 border rounded w-full max-w-xs text-sm md:text-base"
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={guardando}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg disabled:bg-gray-400 text-sm md:text-base"
        >
          {guardando ? "Guardando..." : "Guardar Configuración"}
        </button>
      </form>
    </div>
  )
}
