// navbar.js - Gestión y comportamiento del navbar

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

/**
 * Inicialización cuando el DOM está listo
 */
document.addEventListener("DOMContentLoaded", function () {
  console.log("✅ navbar.js cargado correctamente");

  // Escuchar eventos de actualización del carrito
  window.addEventListener("carritoActualizado", function () {
    console.log("🛒 Carrito actualizado - evento recibido en navbar");
  });

  // Inicializar efectos visuales del navbar
  initNavbarEffects();
});

/**
 * Configura los efectos visuales y comportamientos del navbar
 */
function initNavbarEffects() {
  const navbar = document.querySelector('.navbar');

  // Efecto de sombra al hacer scroll
  if (navbar) {
    window.addEventListener('scroll', function () {
      navbar.classList.toggle('shadow-lg', window.scrollY > 50);
    });
  }

  // Cerrar menú móvil al hacer click en un enlace
  const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
  const navbarToggler = document.querySelector('.navbar-toggler');
  const navbarCollapse = document.querySelector('.navbar-collapse');

  navLinks.forEach(link => {
    link.addEventListener('click', function () {
      // Solo cerrar en vista móvil si el menú está abierto
      if (window.innerWidth < 992 && navbarCollapse.classList.contains('show')) {
        navbarToggler.click();
      }
    });
  });
}

/**
 * Sincroniza el carrito local con la sesión del servidor y redirige al carrito
 * Maneja tanto usuarios autenticados como anónimos
 */
async function syncAndOpenCarrito() {
  const userDropdown = document.getElementById("userDropdown");

  // Usuario autenticado - redirigir directamente
  if (userDropdown) {
    window.location.href = "/carrito";
    return;
  }

  // Usuario anónimo - verificar items en localStorage
  const carrito = obtenerCarritoLocal();

  // Si no hay items, redirigir directamente
  if (!carrito || carrito.length === 0) {
    window.location.href = "/carrito";
    return;
  }

  // Hay items locales - sincronizar con el servidor
  try {
    const btnCarrito = document.querySelector('[onclick="syncAndOpenCarrito()"]');
    const iconOriginal = btnCarrito ? btnCarrito.innerHTML : '';

    // Mostrar estado de carga
    if (btnCarrito) {
      btnCarrito.disabled = true;
      btnCarrito.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
    }

    // Sincronizar cada item con la sesión del servidor
    for (const item of carrito) {
      const headers = agregarHeadersCSRF({
        "Content-Type": "application/json",
      });

      await fetch(`/api/carrito/agregar?cantidad=${item.cantidad || 1}&productoId=${parseInt(item.id)}`, {
        method: "POST",
        credentials: "same-origin",
        headers: headers,
      });
    }

    // Restaurar estado normal del botón
    if (btnCarrito) {
      btnCarrito.innerHTML = iconOriginal;
      btnCarrito.disabled = false;
    }

    // Redirigir al carrito
    window.location.href = "/carrito";

  } catch (error) {
    console.error("❌ Error sincronizando carrito:", error);
    // En caso de error, intentar abrir el carrito de todas formas
    window.location.href = "/carrito";
  }
}

/**
 * Obtiene el carrito almacenado en localStorage
 * @returns {Array} Array de items del carrito o array vacío si hay error
 */
function obtenerCarritoLocal() {
  try {
    const raw = localStorage.getItem("carritoAnonimo");
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error("❌ Error parseando carrito local:", error);
    return [];
  }
}

// Hacer función disponible globalmente
window.syncAndOpenCarrito = syncAndOpenCarrito;