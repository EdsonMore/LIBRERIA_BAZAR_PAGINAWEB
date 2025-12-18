import Link from "next/link"
import { query } from "@/lib/db"
import Navbar from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"
import { ProductosNavidad } from "@/components/productos-navidad"
import { Wine, Truck, Shield, CreditCard } from "lucide-react"

async function getCategorias() {
  try {
    const categorias = await query<any>(
      "SELECT id, nombre, descripcion FROM categorias WHERE activa = true ORDER BY nombre ASC"
    )
    return categorias || []
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
      <section className="hero-section bg-gradient-to-r from-[#C8D800] to-[#A4CC00] text-[#2B2E4A] py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">Bienvenido a Tienda Bazar</h1>
          <p className="text-xl md:text-2xl mb-8 text-[#2B2E4A] max-w-2xl mx-auto opacity-90">
            Descubre nuestra amplia selección de productos de calidad a los mejores precios
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/productos" className="px-8 py-4 bg-[#E91E63] hover:bg-[#c2185b] text-white font-bold rounded-lg transition-colors duration-300">
              🛍️ Ver Productos
            </Link>
            <Link
              href="/contacto"
              className="px-8 py-4 bg-white text-[#C8D800] font-bold rounded-lg hover:bg-gray-100 transition-colors duration-300"
            >
              📞 Contáctanos
            </Link>
          </div>
        </div>
      </section>

      {/* Características */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 bg-gray-50 rounded-lg hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#C8D800] flex items-center justify-center">
                <Wine className="w-8 h-8 text-[#2B2E4A]" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-[#1a1a1a]">Productos Premium</h3>
              <p className="text-gray-600">Selección exclusiva de las mejores marcas</p>
            </div>

            <div className="text-center p-6 bg-gray-50 rounded-lg hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#14a085] flex items-center justify-center">
                <Truck className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-[#1a1a1a]">Envío Rápido</h3>
              <p className="text-gray-600">Entrega a domicilio en 24-48 horas</p>
            </div>

            <div className="text-center p-6 bg-gray-50 rounded-lg hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#C8D800] flex items-center justify-center">
                <Shield className="w-8 h-8 text-[#2B2E4A]" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-[#1a1a1a]">Compra Segura</h3>
              <p className="text-gray-600">Transacciones 100% seguras</p>
            </div>

            <div className="text-center p-6 bg-gray-50 rounded-lg hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#E91E63] flex items-center justify-center">
                <CreditCard className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-[#1a1a1a]">Pagos Flexibles</h3>
              <p className="text-gray-600">Múltiples métodos de pago</p>
            </div>
          </div>
        </div>
      </section>

      {/* Productos Especial Navidad */}
      <ProductosNavidad />

      {/* Categorías */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-[#1a1a1a]">Explora por Categoría</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categorias.map((categoria: any) => (
              <Link
                href={`/productos?categoria=${categoria.id}`}
                key={categoria.id}
                className="bg-white p-6 text-center rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-100"
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
                  {categoria.nombre === "Decoraciones Navideñas" && "🎄"}
                  {categoria.nombre === "Juguetes" && "🎁"}
                  {categoria.nombre === "Útiles Escolares" && "📚"}
                  {categoria.nombre === "Abarrotes" && "🛒"}
                  {categoria.nombre === "Artículos de Cocina" && "🍳"}
                  {categoria.nombre === "Decoración del Hogar" && "🏠"}
                  {categoria.nombre === "Artículos de Limpieza" && "🧹"}
                  {categoria.nombre === "Otros" && "📦"}
                </div>
                <h5 className="text-lg font-bold mb-2 text-[#1a1a1a]">{categoria.nombre}</h5>
                <p className="text-gray-600 text-sm">{categoria.descripcion}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-[#C8D800] to-[#A4CC00] text-[#2B2E4A]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">¿Listo para disfrutar?</h2>
          <p className="text-xl mb-8 text-[#2B2E4A] opacity-90">Explora nuestra colección y encuentra exactamente lo que necesitas</p>
          <Link
            href="/productos"
            className="inline-block px-10 py-4 bg-[#E91E63] hover:bg-[#c2185b] text-white font-bold rounded-lg transition-colors duration-300"
          >
            🛍️ Ver Todos los Productos
          </Link>
        </div>
      </section>

      <Footer />
    </>
  )
}
