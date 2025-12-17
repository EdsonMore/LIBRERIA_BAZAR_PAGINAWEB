'use client'

import { ReportesVentas } from '@/components/ventas/reportes-ventas'
import Footer from '@/components/layout/footer'

export default function VentasReportesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 py-4 md:py-6 lg:py-8 px-3 md:px-4 lg:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold">📈 Reportes de Ventas</h1>
            <p className="text-gray-600 text-sm md:text-base mt-1">Análisis completo de ventas y desempeño</p>
          </div>
          <ReportesVentas />
        </div>
      </main>
      <Footer />
    </div>
  )
}
