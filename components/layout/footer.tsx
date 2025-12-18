import Link from "next/link"
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-12 mt-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Información de la empresa */}
          <div>
            <h3 className="text-2xl font-bold mb-4 navbar-brand">Tienda Bazar</h3>
            <p className="text-gray-300 mb-4">Tu tienda de confianza para productos de calidad y variedad.</p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-[#E91E63] transition-colors">
                <Facebook className="w-6 h-6" />
              </a>
              <a href="#" className="hover:text-[#E91E63] transition-colors">
                <Instagram className="w-6 h-6" />
              </a>
              <a href="#" className="hover:text-[#E91E63] transition-colors">
                <Twitter className="w-6 h-6" />
              </a>
            </div>
          </div>

          {/* Enlaces rápidos */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Enlaces Rápidos</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/productos" className="text-gray-300 hover:text-[#E91E63] transition-colors">
                  Productos
                </Link>
              </li>
              <li>
                <Link href="/contacto" className="text-gray-300 hover:text-[#E91E63] transition-colors">
                  Contacto
                </Link>
              </li>
              <li>
                <Link href="/libro-reclamaciones" className="text-gray-300 hover:text-[#E91E63] transition-colors">
                  Libro de Reclamaciones
                </Link>
              </li>
              <li>
                <Link href="/terminos" className="text-gray-300 hover:text-[#E91E63] transition-colors">
                  Términos y Condiciones
                </Link>
              </li>
            </ul>
          </div>

          {/* Categorías */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Categorías</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/productos?categoria=whisky"
                  className="text-gray-300 hover:text-[#E91E63] transition-colors"
                >
                  Whisky
                </Link>
              </li>
              <li>
                <Link href="/productos?categoria=ron" className="text-gray-300 hover:text-[#E91E63] transition-colors">
                  Ron
                </Link>
              </li>
              <li>
                <Link href="/productos?categoria=vino" className="text-gray-300 hover:text-[#E91E63] transition-colors">
                  Vino
                </Link>
              </li>
              <li>
                <Link
                  href="/productos?categoria=cerveza"
                  className="text-gray-300 hover:text-[#E91E63] transition-colors"
                >
                  Cerveza
                </Link>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contacto</h4>
            <ul className="space-y-3">
              <li className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-[#667eea]" />
                <span className="text-gray-300">Av. Principal 123, Lima</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="w-5 h-5 text-[#667eea]" />
                <span className="text-gray-300">+51 987 654 321</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="w-5 h-5 text-[#667eea]" />
                <span className="text-gray-300">info@tiendabazar.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} Tienda Bazar. Todos los derechos reservados.</p>
          <p className="mt-2 text-sm">Para consultas y reclamos, nos puedes contactar en cualquier momento.</p>
        </div>
      </div>
    </footer>
  )
}
