// detalles-productos.js
// Gestión de detalles de producto y funcionalidades de compartir en redes sociales

/**
 * Obtiene el token CSRF de los meta tags
 */
function obtenerTokenCSRF() {
  const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  const header = document.querySelector('meta[name="csrf-header"]')?.getAttribute('content') || 'X-CSRF-TOKEN';
  return { token, header };
}

/**
 * Agrega el token CSRF a los headers si está disponible
 */
function agregarHeadersCSRF(headers = {}) {
  const { token, header } = obtenerTokenCSRF();
  if (token) {
    headers[header] = token;
  }
  return headers;
}

document.addEventListener("DOMContentLoaded", function () {
  console.log("detalles-productos.js cargado correctamente");

  // Inicializar todas las funcionalidades
  inicializarEfectosVisuales();
  inicializarBotonesAgregarCarrito();
});

// ============================================================================
// SECCIÓN EFECTOS VISUALES
// ============================================================================

/**
 * Inicializa todos los efectos visuales interactivos para el producto
 */
function inicializarEfectosVisuales() {
  configurarHoverTarjetasProductos();
  configurarHoverImagenPrincipal();
}

/**
 * Configura los efectos hover para las tarjetas de productos relacionados
 */
function configurarHoverTarjetasProductos() {
  const productCards = document.querySelectorAll(".producto-card");

  productCards.forEach((card) => {
    // Efecto al entrar el mouse
    card.addEventListener("mouseenter", function () {
      this.style.transform = "translateY(-8px)";
      this.style.boxShadow = "0 10px 25px rgba(0,0,0,0.15)";

      const img = this.querySelector(".card-img-top");
      if (img) {
        img.style.transition = "transform 0.3s ease";
        img.style.transform = "scale(1.05)";
      }
    });

    // Efecto al salir el mouse
    card.addEventListener("mouseleave", function () {
      this.style.transform = "translateY(0)";
      this.style.boxShadow = "";

      const img = this.querySelector(".card-img-top");
      if (img) {
        img.style.transform = "scale(1)";
      }
    });
  });
}

/**
 * Configura el efecto hover para la imagen principal del producto
 */
function configurarHoverImagenPrincipal() {
  const mainImage = document.querySelector(".main-image-wrapper img");

  if (mainImage) {
    mainImage.addEventListener("mouseenter", function () {
      this.style.transition = "transform 0.3s ease";
      this.style.transform = "scale(1.02)";
    });

    mainImage.addEventListener("mouseleave", function () {
      this.style.transform = "scale(1)";
    });
  }
}

// ============================================================================
// SECCIÓN AGREGAR AL CARRITO
// ============================================================================

/**
 * Inicializa los botones de agregar al carrito con sus event listeners
 */
function inicializarBotonesAgregarCarrito() {
  const addToCartButtons = document.querySelectorAll(".add-to-cart");

  addToCartButtons.forEach((button) => {
    // Prevenir duplicación de event listeners
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);

    newButton.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();

      const productId = this.getAttribute("data-id");

      // Verificar si el producto está disponible
      if (this.disabled) {
        mostrarToast("Este producto no está disponible", "warning");
        return;
      }

      // Usar función global si existe, sino usar la local
      if (typeof window.agregarAlCarrito === 'function') {
        window.agregarAlCarrito(productId, 1);
      } else {
        agregarAlCarritoDesdeDetalle(productId);
      }
    });
  });
}

/**
 * Agrega un producto al carrito desde la página de detalle
 * @param {string} productId - ID del producto a agregar
 */
async function agregarAlCarritoDesdeDetalle(productId) {
  try {
    const productoData = obtenerDatosProducto();

    // Verificar autenticación del usuario
    const userDropdown = document.getElementById("userDropdown");

    if (!userDropdown) {
      // Usuario NO autenticado - carrito local
      manejarCarritoAnonimo(productoData);
    } else {
      // Usuario autenticado - carrito en backend
      await manejarCarritoAutenticado(productoData);
    }
  } catch (error) {
    console.error("Error al agregar al carrito:", error);
    mostrarToast("Error de conexión. Intenta nuevamente", "error");
  }
}

/**
 * Extrae los datos del producto desde la página actual
 * @returns {Object} Datos del producto
 */
function obtenerDatosProducto() {
  return {
    id: parseInt(document.querySelector(".add-to-cart")?.getAttribute("data-id") || 0),
    nombre: document.querySelector("h1")?.textContent?.trim() || "Producto",
    precio: parseFloat(
      document.querySelector(".text-success h2 span")?.textContent || 0
    ),
    imagen: document.querySelector(".main-image-wrapper img")?.src || "/img/placeholder.jpg",
    descripcion: document.querySelector(".card-body .text-muted")?.textContent?.trim() || "",
    disponible: true,
    stock: 100,
  };
}

/**
 * Maneja el carrito para usuarios no autenticados (localStorage)
 * @param {Object} productoData - Datos del producto a agregar
 */
function manejarCarritoAnonimo(productoData) {
  try {
    const raw = localStorage.getItem("carritoAnonimo");
    const carrito = raw ? JSON.parse(raw) : [];
    const existing = carrito.find(p => parseInt(p.id) === parseInt(productoData.id));

    if (existing) {
      existing.cantidad = (existing.cantidad || 0) + 1;
    } else {
      carrito.push({ ...productoData, cantidad: 1 });
    }

    localStorage.setItem("carritoAnonimo", JSON.stringify(carrito));
    mostrarToast("✓ Producto agregado al carrito", "success");
    window.dispatchEvent(new Event("carritoActualizado"));
  } catch (e) {
    console.error("Error guardando carrito anónimo:", e);
    mostrarToast("No se pudo agregar al carrito", "error");
  }
}

/**
 * Maneja el carrito para usuarios autenticados (backend)
 * @param {Object} productoData - Datos del producto a agregar
 */
async function manejarCarritoAutenticado(productoData) {
  const headers = agregarHeadersCSRF({
    "Content-Type": "application/json",
  });

  const response = await fetch(`/api/carrito/agregar?cantidad=1&productoId=${productoData.id}`, {
    method: "POST",
    credentials: "same-origin",
    headers: headers,
  });

  if (response.status === 401) {
    // Fallback a carrito local si hay error de autenticación
    manejarCarritoAnonimo(productoData);
    return;
  }

  if (response.ok) {
    mostrarToast("✓ Producto agregado al carrito", "success");
    window.dispatchEvent(new Event("carritoActualizado"));
  } else {
    const errorText = await response.text();
    mostrarToast("Error: " + errorText, "error");
  }
}

// ============================================================================
// SECCIÓN COMPARTIR EN REDES SOCIALES
// ============================================================================

/**
 * Comparte el producto actual a través de WhatsApp
 */
function compartirWhatsApp() {
  const producto = document.querySelector("h1")?.textContent?.trim() || "Producto";
  const precioElement = document.querySelector(".text-success h2 span");
  const precio = precioElement ? precioElement.textContent : "0.00";
  const url = window.location.href;

  const texto = `¡Mira este producto en Tu Bazar Plus!\n\n${producto}\nS/ ${precio}\n${url}\n\n¡Encuentra todo lo que necesitas!`;

  window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank");
}

/**
 * Comparte el producto actual en Facebook
 */
function compartirFacebook() {
  const url = window.location.href;
  const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  window.open(shareUrl, "_blank", "width=600,height=400");
}

/**
 * Copia el enlace del producto al portapapeles
 */
function copiarEnlace() {
  navigator.clipboard
    .writeText(window.location.href)
    .then(() => {
      mostrarToast("¡Enlace copiado al portapapeles!", "success");
    })
    .catch(() => {
      mostrarToast("Error al copiar el enlace", "error");
    });
}

// ============================================================================
// EXPORTACIÓN DE FUNCIONES GLOBALES
// ============================================================================

// Hacer funciones disponibles globalmente para uso en HTML
window.compartirWhatsApp = compartirWhatsApp;
window.compartirFacebook = compartirFacebook;
window.copiarEnlace = copiarEnlace;