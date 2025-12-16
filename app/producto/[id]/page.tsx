import { notFound } from "next/navigation"
import Navbar from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"
import ProductoDetalle from "@/components/producto-detalle"

async function getProducto(id: string) {
  try {
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/productos/${id}`
    console.log("Fetching from:", apiUrl)
    const res = await fetch(apiUrl, {
      cache: "no-store",
    })
    console.log("Response status:", res.status)
    if (!res.ok) {
      console.error("API error response:", res.status)
      return null
    }
    const data = await res.json()
    console.log("API data received:", data)
    return data
  } catch (error) {
    console.error("Error al obtener producto:", error)
    return null
  }
}

export default async function ProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  console.log("Página de producto ID:", id)
  const data = await getProducto(id)

  if (!data || !data.id) {
    console.log("Producto no encontrado, data:", data)
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
