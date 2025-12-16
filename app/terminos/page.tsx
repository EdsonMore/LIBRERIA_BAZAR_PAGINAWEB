"use client"

import Navbar from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"

export default function TerminosPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-8 text-gray-900">Términos y Condiciones</h1>
          
          <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">1. Introducción</h2>
              <p className="text-gray-700 leading-relaxed">
                Bienvenido a nuestro sitio web. Estos Términos y Condiciones regulan el uso de nuestros servicios 
                en línea. Al acceder y utilizar este sitio, usted acepta estar vinculado por estos términos. Si no 
                está de acuerdo con alguno de los términos aquí establecidos, por favor no use nuestros servicios.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">2. Uso Aceptable</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Al usar nuestro sitio web, usted acepta no:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Violar ninguna ley o regulación aplicable</li>
                <li>Infringir los derechos de terceros (incluyendo propiedad intelectual)</li>
                <li>Enviar contenido obsceno, ofensivo o ilegal</li>
                <li>Realizar actividades de piratería o interferencia no autorizada</li>
                <li>Usar software de scraping o automático sin permiso</li>
                <li>Intentar obtener acceso no autorizado a nuestros sistemas</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">3. Cuentas de Usuario</h2>
              <p className="text-gray-700 leading-relaxed">
                Si crea una cuenta en nuestro sitio, usted es responsable de mantener la confidencialidad de su 
                contraseña y de toda la actividad que ocurra bajo su cuenta. Usted acepta notificarnos inmediatamente 
                de cualquier uso no autorizado de su cuenta.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">4. Productos y Servicios</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Ofrecemos diversos productos y servicios a través de nuestro sitio. Nos reservamos el derecho de:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Modificar o descontinuar productos sin previo aviso</li>
                <li>Rechazar o cancelar pedidos por cualquier razón</li>
                <li>Corregir errores de precio o descripción</li>
                <li>Limitar cantidades de compra</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">5. Precios y Pago</h2>
              <p className="text-gray-700 leading-relaxed">
                Los precios están sujetos a cambios sin previo aviso. Los impuestos y gastos de envío se agregarán 
                según corresponda. Aceptamos varios métodos de pago. Usted es responsable de proporcionar información 
                de pago exacta y actualizada.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">6. Envíos y Devoluciones</h2>
              <p className="text-gray-700 leading-relaxed">
                Los productos se enviarán a la dirección que usted especifique. Consulte nuestra política de 
                devoluciones en la sección correspondiente del sitio para más detalles sobre devoluciones, cambios 
                e intercambios.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">7. Renuncia de Garantías</h2>
              <p className="text-gray-700 leading-relaxed">
                Este sitio se proporciona "tal como está" sin garantías de ningún tipo, ni expresas ni implícitas. 
                No garantizamos que el sitio sea ininterrumpido, seguro o libre de errores. Usted usa el sitio bajo 
                su propio riesgo.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">8. Limitación de Responsabilidad</h2>
              <p className="text-gray-700 leading-relaxed">
                En ningún caso seremos responsables por daños indirectos, incidentales, especiales, consecuentes o 
                punitivos resultantes de su uso del sitio o servicios, incluso si hemos sido advertidos de la 
                posibilidad de tales daños.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">9. Propiedad Intelectual</h2>
              <p className="text-gray-700 leading-relaxed">
                Todo el contenido en nuestro sitio, incluyendo texto, gráficos, logotipos, imágenes y software, 
                es propiedad de nuestra empresa o de terceros que nos han licenciado el contenido. No puede 
                reproducir, distribuir o transmitir este contenido sin permiso previo por escrito.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">10. Enlaces Externos</h2>
              <p className="text-gray-700 leading-relaxed">
                Nuestro sitio puede contener enlaces a sitios web de terceros. No nos hacemos responsables del 
                contenido, precisión o prácticas de estos sitios. El acceso a estos sitios es bajo su propio riesgo.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">11. Privacidad</h2>
              <p className="text-gray-700 leading-relaxed">
                Su uso de nuestro sitio está sujeto a nuestra Política de Privacidad. Por favor, revísela para 
                comprender nuestras prácticas de recopilación y uso de información.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">12. Modificaciones de Términos</h2>
              <p className="text-gray-700 leading-relaxed">
                Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entrarán 
                en vigor inmediatamente después de su publicación. Su uso continuado del sitio constituye su 
                aceptación de los términos modificados.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">13. Ley Aplicable</h2>
              <p className="text-gray-700 leading-relaxed">
                Estos Términos y Condiciones se rigen e interpretan de acuerdo con las leyes de la jurisdicción 
                donde se encuentra nuestra empresa, y usted se somete irrevocablemente a la jurisdicción exclusiva 
                de los tribunales en esa ubicación.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">14. Contacto</h2>
              <p className="text-gray-700 leading-relaxed">
                Si tiene preguntas sobre estos Términos y Condiciones, por favor contáctenos a través de nuestro 
                formulario de contacto o dirección de correo electrónico proporcionada en el sitio.
              </p>
            </section>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-gray-600 text-sm">
                Última actualización: {new Date().toLocaleDateString("es-ES")}
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
