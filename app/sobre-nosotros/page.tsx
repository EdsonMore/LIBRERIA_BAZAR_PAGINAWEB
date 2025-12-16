"use client"

import Link from "next/link"
import Navbar from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"

export default function SobreNosotros() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <div className="container mx-auto px-4 py-12">
          {/* Hero Section */}
          <section className="mb-16">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
                Sobre Nosotros
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Somos una tienda bazar con más de una década de experiencia en el mercado,
                comprometidos con ofrecer los mejores productos y servicio al cliente.
              </p>
            </div>
          </section>

          {/* Misión, Visión y Valores */}
          <section className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">🎯</div>
              <h2 className="text-2xl font-bold mb-4 text-gray-900">Nuestra Misión</h2>
              <p className="text-gray-600">
                Proporcionar una experiencia de compra única, ofreciendo productos de calidad premium
                a precios accesibles, con atención al cliente excepcional en cada interacción.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">🌟</div>
              <h2 className="text-2xl font-bold mb-4 text-gray-900">Nuestra Visión</h2>
              <p className="text-gray-600">
                Ser la tienda bazar preferida de nuestros clientes, reconocida por nuestra variedad de
                productos, precios competitivos y servicio de primera calidad a nivel nacional.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">💎</div>
              <h2 className="text-2xl font-bold mb-4 text-gray-900">Nuestros Valores</h2>
              <p className="text-gray-600">
                Confianza, calidad, transparencia e integridad son los pilares que guían nuestras
                operaciones y relaciones con nuestros clientes y proveedores.
              </p>
            </div>
          </section>

          {/* Historia */}
          <section className="mb-16 bg-gray-50 rounded-lg p-12">
            <h2 className="text-3xl font-bold mb-8 text-gray-900 text-center">Nuestra Historia</h2>
            <div className="max-w-3xl mx-auto space-y-6 text-gray-600 leading-relaxed">
              <p>
                Fundada en 2010, nuestra tienda bazar comenzó como un pequeño negocio familiar con la
                visión de revolucionar el mercado de productos diversos en nuestra región. Lo que
                comenzó como un sueño modesto se ha convertido en una empresa consolidada.
              </p>
              <p>
                A lo largo de los años, hemos expandido significativamente nuestro inventario,
                incorporando productos internacionales de alta calidad y marcas reconocidas mundialmente.
                Nuestro compromiso con la excelencia nos ha permitido ganar la confianza de miles de clientes.
              </p>
              <p>
                En 2024, hemos dado un salto importante al mundo digital con nuestra plataforma de
                e-commerce, permitiendo a nuestros clientes disfrutar de la conveniencia de comprar desde
                casa con la misma calidad de servicio que nos caracteriza.
              </p>
            </div>
          </section>

          {/* Por qué elegir */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-12 text-gray-900 text-center">¿Por qué elegirnos?</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="flex gap-4">
                <div className="text-3xl">✓</div>
                <div>
                  <h3 className="text-xl font-bold mb-2 text-gray-900">Amplio Catálogo</h3>
                  <p className="text-gray-600">
                    Contamos con miles de productos de todas las categorías y precios.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="text-3xl">✓</div>
                <div>
                  <h3 className="text-xl font-bold mb-2 text-gray-900">Precios Competitivos</h3>
                  <p className="text-gray-600">
                    Garantizamos los mejores precios del mercado sin comprometer la calidad.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="text-3xl">✓</div>
                <div>
                  <h3 className="text-xl font-bold mb-2 text-gray-900">Entrega Rápida</h3>
                  <p className="text-gray-600">
                    Procesamos y entregamos tus pedidos en el menor tiempo posible.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="text-3xl">✓</div>
                <div>
                  <h3 className="text-xl font-bold mb-2 text-gray-900">Atención 24/7</h3>
                  <p className="text-gray-600">
                    Nuestro equipo está disponible para resolver tus dudas en cualquier momento.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="text-3xl">✓</div>
                <div>
                  <h3 className="text-xl font-bold mb-2 text-gray-900">Seguridad Garantizada</h3>
                  <p className="text-gray-600">
                    Tus transacciones y datos personales están completamente protegidos.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="text-3xl">✓</div>
                <div>
                  <h3 className="text-xl font-bold mb-2 text-gray-900">Satisfacción Garantizada</h3>
                  <p className="text-gray-600">
                    Si no estás satisfecho, tenemos una política de devolución sin preguntas.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Estadísticas */}
          <section className="bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-lg p-12 text-white mb-16">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold mb-2">14+</div>
                <p className="text-lg">Años de Experiencia</p>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">10,000+</div>
                <p className="text-lg">Clientes Satisfechos</p>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">5,000+</div>
                <p className="text-lg">Productos Disponibles</p>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">100%</div>
                <p className="text-lg">Satisfacción Garantizada</p>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-6 text-gray-900">
              Únete a nuestros miles de clientes satisfechos
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Descubre nuestra variedad de productos y disfruta de la mejor experiencia de compra
              en línea. ¡Te esperamos!
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                href="/productos"
                className="bg-[#667eea] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#5568d3] transition-colors"
              >
                Ver Productos
              </Link>
              <Link
                href="/contacto"
                className="border-2 border-[#667eea] text-[#667eea] px-8 py-3 rounded-lg font-semibold hover:bg-[#667eea] hover:text-white transition-colors"
              >
                Contactanos
              </Link>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}
