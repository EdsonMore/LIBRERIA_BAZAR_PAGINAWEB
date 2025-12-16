import Link from "next/link"
import { getApiUrl } from "@/lib/api-url"
import Navbar from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"
import { Wine, Truck, Shield, CreditCard } from "lucide-react"

async function getCategorias() {
  try {
    // Usar URL completa para SSR en Vercel
    const res = await fetch(getApiUrl("/api/categorias/activas"), {
      cache: "no-store",
    })
    if (!res.ok) return []
    const data = await res.json()
    return data
  } catch (error) {
    console.error("Error al obtener categorías:", error)
    return []
  }
}

export default async function HomePage() {
  const categorias = await getCategorias()

  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="container mx-auto px-4 text-center">
          <h1 className="hero-section h1">Bienvenido a Tienda Bazar</h1>
          <p className="lead mt-4 max-w-2xl mx-auto">
            Descubre nuestra amplia selección de productos de calidad a los mejores precios.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/productos" className="btn-primary">
              Ver Productos
            </Link>
            <Link
              href="/contacto"
              className="px-8 py-3 bg-white text-[#667eea] font-semibold rounded-full hover:shadow-lg transition-all"
            >
              Contáctanos
            </Link>
          </div>
        </div>
      </section>

      {/* Características */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-[#667eea] to-[#764ba2] flex items-center justify-center">
                <Wine className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Productos Premium</h3>
              <p className="text-gray-600">Selección exclusiva de las mejores marcas</p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-[#667eea] to-[#764ba2] flex items-center justify-center">
                <Truck className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Envío Rápido</h3>
              <p className="text-gray-600">Entrega a domicilio en 24-48 horas</p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-[#667eea] to-[#764ba2] flex items-center justify-center">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Compra Segura</h3>
              <p className="text-gray-600">Transacciones 100% seguras</p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-[#667eea] to-[#764ba2] flex items-center justify-center">
                <CreditCard className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Pagos Flexibles</h3>
              <p className="text-gray-600">Múltiples métodos de pago</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categorías */}
      <section className="py-16 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Explora por Categoría</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categorias.map((categoria: any) => (
              <Link
                href={`/productos?categoria=${categoria.id}`}
                key={categoria.id}
                className="category-card bg-white p-6 text-center"
              >
                <div className="text-5xl mb-4">
                  {categoria.nombre === "Whisky" && "🥃"}
                  {categoria.nombre === "Ron" && "🍹"}
                  {categoria.nombre === "Vodka" && "🍸"}
                  {categoria.nombre === "Vino" && "🍷"}
                  {categoria.nombre === "Cerveza" && "🍺"}
                  {categoria.nombre === "Pisco" && "🥃"}
                  {categoria.nombre === "Tequila" && "🥃"}
                  {categoria.nombre === "Licores" && "🍾"}
                </div>
                <h5 className="text-xl font-bold mb-2">{categoria.nombre}</h5>
                <p className="text-gray-600 text-sm">{categoria.descripcion}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">¿Listo para disfrutar?</h2>
          <p className="text-xl mb-8 text-[#e8d5f5]">Explora nuestra colección y encuentra tus bebidas favoritas</p>
          <Link
            href="/productos"
            className="inline-block px-8 py-3 bg-white text-[#667eea] font-bold rounded-full hover:shadow-2xl transition-all"
          >
            Ver Todos los Productos
          </Link>
        </div>
      </section>

      <Footer />
    </>
  )
}
