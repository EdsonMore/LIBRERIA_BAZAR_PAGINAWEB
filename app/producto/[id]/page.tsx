import { notFound } from "next/navigation"
import { getApiUrl } from "@/lib/api-url"
import Navbar from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"
import ProductoDetalle from "@/components/producto-detalle"

async function getProducto(id: string) {
  try {
    // Usar URL completa para SSR en Vercel
    const apiUrl = getApiUrl(`/api/productos/${id}`)
    console.log(`🌐 SSR: Fetching producto ${id} from: ${apiUrl}`)
    
    const res = await fetch(apiUrl, {
      cache: "no-store",
      headers: {
        "User-Agent": "NextJS-SSR",
      },
    })
    
    console.log(`📊 SSR: Response status ${res.status} para producto ${id}`)
    
    if (!res.ok) {
      console.error(`❌ SSR: API error ${res.status} para producto ${id}`)
      const errorData = await res.text()
      console.error(`📋 SSR: Error response: ${errorData}`)
      return null
    }
    
    const data = await res.json()
    console.log(`✅ SSR: Producto ${id} cargado exitosamente`)
    return data
  } catch (error) {
    console.error(`❌ SSR: Error fetching producto ${id}:`, error)
    return null
  }
}

export default async function ProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  console.log(`📄 SSR: Renderizando página de producto ${id}`)
  
  const data = await getProducto(id)

  if (!data || !data.id) {
    console.log(`⚠️ SSR: Producto ${id} no encontrado, mostrando 404`)
    notFound()
  }

  return (
    <>
      <Navbar />
      <ProductoDetalle producto={data} relacionados={data.relacionados} resenas={data.resenas} />
      <Footer />
    </>
  )
}
