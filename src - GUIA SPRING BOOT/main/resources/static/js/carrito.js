// carrito-mejorado.js - Sistema completo de gestión del carrito con persistencia
// Maneja tanto usuarios autenticados como anónimos con sincronización automática

let TASA_IGV = 0.18;
let COSTO_ENVIO = 15.0;

// Variables para configuración dinámica
let CONFIG_SISTEMA = {
  aplicarIGV: true,
  porcentajeIGV: 18.0,
  aplicarEnvio: true,
  costoEnvio: 15.0
};

/**
 * Carga la configuración del sistema desde el servidor
 */
async function cargarConfiguracionSistema() {
  try {
    const response = await fetch('/api/configuracion-sistema');
    if (response.ok) {
      CONFIG_SISTEMA = await response.json();
      TASA_IGV = CONFIG_SISTEMA.aplicarIGV ? (CONFIG_SISTEMA.porcentajeIGV / 100.0) : 0.0;
      COSTO_ENVIO = CONFIG_SISTEMA.aplicarEnvio ? CONFIG_SISTEMA.costoEnvio : 0.0;
      console.log('✓ Configuración cargada:', CONFIG_SISTEMA);
      
      // Actualizar visualización de IGV y Envío en la página
      actualizarVisualizacionConfiguracion();
    }
  } catch (error) {
    console.log('⚠ No se pudo cargar config, usando valores por defecto');
    TASA_IGV = 0.18;
    COSTO_ENVIO = 15.0;
  }
}

/**
 * Actualiza la visualización de IGV y Envío según la configuración
 */
function actualizarVisualizacionConfiguracion() {
  const rowIGV = document.getElementById('igv-row');
  const rowEnvio = document.getElementById('envio-row');
  const labelIGV = document.getElementById('igv-label');
  
  if (rowIGV) {
    if (CONFIG_SISTEMA.aplicarIGV) {
      rowIGV.style.display = 'flex';
      labelIGV.textContent = `IGV (${CONFIG_SISTEMA.porcentajeIGV}%):`;
    } else {
      rowIGV.style.display = 'none';
    }
  }
  
  if (rowEnvio) {
    rowEnvio.style.display = CONFIG_SISTEMA.aplicarEnvio ? 'flex' : 'none';
  }
}

// ============================================================================
// UTILIDADES CSRF
// ============================================================================

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

// Util: estado de sesión (usa hidden #isLoggedIn si está presente)
function isUserLoggedIn() {
  const el = document.getElementById("isLoggedIn");
  if (el) return String(el.value).toLowerCase() === "true";
  return document.getElementById("userDropdown") !== null;
}

// ============================================================================
// INICIALIZACIÓN
// ============================================================================

document.addEventListener("DOMContentLoaded", function () {
  console.log("🛒 Sistema de carrito iniciado");

  // Cargar configuración del sistema primero
  cargarConfiguracionSistema().then(() => {
    // Verificar si estamos en la página del carrito
    const esVistaCarrito = window.location.pathname === "/carrito";

    if (esVistaCarrito) {
      console.log("📍 Vista de carrito detectada");
      inicializarVistaCarrito();
    }

    // Inicializar controles y eventos
    initCarrito();
    actualizarContadorCarrito();

    // Verificar si venimos de un redirect después del login
    verificarYRestaurarCarrito();
  });
});

// ============================================================================
// GESTIÓN DEL CARRITO LOCAL (LocalStorage)
// ============================================================================

/**
 * Obtiene el carrito guardado en localStorage
 */
function obtenerCarritoLocal() {
  try {
    const raw = localStorage.getItem("carritoAnonimo");
    const carrito = raw ? JSON.parse(raw) : [];
    console.log("📦 Carrito local obtenido:", carrito);
    return carrito;
  } catch (e) {
    console.error("❌ Error parseando carrito local:", e);
    return [];
  }
}

/**
 * Guarda el carrito en localStorage
 */
function guardarCarritoLocal(carrito) {
  try {
    localStorage.setItem("carritoAnonimo", JSON.stringify(carrito));
    console.log("💾 Carrito guardado en localStorage:", carrito);
  } catch (e) {
    console.error("❌ Error guardando carrito local:", e);
  }
}

/**
 * Obtiene la cantidad total de items en el carrito local
 */
function obtenerCantidadCarritoLocal() {
  const carrito = obtenerCarritoLocal();
  return carrito.reduce((acc, it) => acc + (it.cantidad || 0), 0);
}

/**
 * Agrega un item al carrito local
 */
function agregarItemAlCarritoLocal(productoPayload, cantidad) {
  const carrito = obtenerCarritoLocal();
  const existing = carrito.find(
    (p) => parseInt(p.id) === parseInt(productoPayload.id)
  );

  if (existing) {
    existing.cantidad = (existing.cantidad || 0) + cantidad;
  } else {
    carrito.push({ ...productoPayload, cantidad });
  }

  guardarCarritoLocal(carrito);
  actualizarContadorCarrito();

  // Disparar evento para actualizar la vista si está abierta
  window.dispatchEvent(new CustomEvent("carritoLocalActualizado"));
}

/**
 * Elimina un producto del localStorage
 */
function eliminarDeLocalStorage(productoId) {
  const carrito = obtenerCarritoLocal();
  const carritoFiltrado = carrito.filter(
    (item) => parseInt(item.id) !== parseInt(productoId)
  );
  guardarCarritoLocal(carritoFiltrado);
  window.dispatchEvent(new CustomEvent("carritoLocalActualizado"));
}

/**
 * Actualiza la cantidad de un producto en localStorage
 */
function actualizarCantidadLocalStorage(productoId, cantidad) {
  const carrito = obtenerCarritoLocal();
  const producto = carrito.find(
    (item) => parseInt(item.id) === parseInt(productoId)
  );

  if (producto) {
    if (cantidad <= 0) {
      eliminarDeLocalStorage(productoId);
    } else {
      producto.cantidad = cantidad;
      guardarCarritoLocal(carrito);
      window.dispatchEvent(new CustomEvent("carritoLocalActualizado"));
    }
  }
}

// ============================================================================
// INICIALIZACIÓN DE LA VISTA DEL CARRITO
// ============================================================================

/**
 * Inicializa la vista del carrito cuando estamos en /carrito
 */
function inicializarVistaCarrito() {
  const isLoggedIn = isUserLoggedIn();

  console.log(
    "🔐 Estado de autenticación:",
    isLoggedIn ? "Autenticado" : "Anónimo"
  );

  if (!isLoggedIn) {
    // Usuario anónimo: renderizar desde localStorage
    renderizarCarritoAnonimo();

    // Escuchar cambios en el carrito local
    window.addEventListener(
      "carritoLocalActualizado",
      renderizarCarritoAnonimo
    );
  } else {
    // Usuario autenticado: verificar si ya hay items renderizados por Thymeleaf
    const itemsEnDOM = document.querySelectorAll(".cart-item");

    if (itemsEnDOM.length > 0) {
      // Ya hay items renderizados por servidor, solo inicializar controles
      console.log("✅ Items ya renderizados por servidor:", itemsEnDOM.length);
      initCarrito();
      actualizarTodosLosSubtotales();
      actualizarTotalesCarrito();
      actualizarContadorCarrito();
    } else {
      // No hay items en DOM, verificar en el servidor
      console.log("🔍 No hay items en DOM, verificando servidor...");
      fetch("/api/carrito/items", { credentials: "same-origin" })
        .then((resp) => {
          if (!resp.ok) throw new Error("No se pudo obtener items");
          return resp.json();
        })
        .then((items) => {
          console.log("/api/carrito/items ->", items);
          if (items && Array.isArray(items) && items.length > 0) {
            // Renderizar dentro del contenedor existente
            renderItemsIntoSidebar(items);
          } else {
            // No hay items en servidor, verificar localStorage
            const carritoLocal = obtenerCarritoLocal();
            if (carritoLocal.length > 0) {
              console.log("🔄 Carrito local encontrado, sincronizando...");
              sincronizarCarritoLocal(carritoLocal);
            } else {
              // Carrito completamente vacío, mostrar UI vacía
              console.log("🛒 Carrito vacío - mostrando UI vacía");
              mostrarCarritoVacioUI();
            }
          }
        })
        .catch((err) => {
          console.warn("Error obteniendo items del servidor:", err);
          // En caso de error, verificar localStorage
          const carritoLocal = obtenerCarritoLocal();
          if (carritoLocal.length === 0) {
            console.log(
              "🛒 Error en servidor y localStorage vacío - mostrando UI vacía"
            );
            mostrarCarritoVacioUI();
          }
        });
    }
  }

  // Actualizar totales iniciales
  setTimeout(() => {
    actualizarTodosLosSubtotales();
    actualizarTotalesCarrito();
  }, 100);
}

/**
 * Renderiza el carrito completo desde localStorage para usuarios anónimos
 */
function renderizarCarritoAnonimo() {
  const carritoLocal = obtenerCarritoLocal();
  console.log(
    "🎨 Renderizando carrito anónimo con",
    carritoLocal.length,
    "productos"
  );
  console.log("carritoLocal data:", carritoLocal);

  if (carritoLocal.length === 0) {
    mostrarCarritoVacioUI();
    return;
  }

  // Buscar el contenedor de productos
  let productosContainer = document.querySelector(".list-group-flush");

  if (!productosContainer) {
    console.warn(
      "⚠️ No se encontró contenedor de productos, creando estructura..."
    );
    crearEstructuraCarrito(carritoLocal);
    return;
  }

  // Limpiar contenedor
  productosContainer.innerHTML = "";

  // Renderizar cada producto
  carritoLocal.forEach((item) => {
    console.log("🎨 Renderizando item:", item);
    const itemHTML = crearItemHTML(item);
    productosContainer.insertAdjacentHTML("beforeend", itemHTML);
  });

  // Reinicializar controles
  initCarrito();

  // Actualizar totales
  actualizarTotalesCarrito();
  actualizarContadorCarrito();
}

/**
 * Crea la estructura HTML completa del carrito
 */
function crearEstructuraCarrito(items) {
  const carritoContent = document.getElementById("carrito-content");

  if (!carritoContent) {
    console.error("❌ No se pudo encontrar el contenedor del carrito");
    return;
  }

  const subtotal = items.reduce(
    (acc, item) => acc + (item.precio || 0) * (item.cantidad || 0),
    0
  );
  const igv = subtotal * TASA_IGV;
  const total = subtotal + igv + COSTO_ENVIO;

  const html = `
    <div class="col-lg-8">
      <div class="card border-0 shadow-sm">
        <div class="card-header bg-white border-bottom py-3">
          <div class="d-flex justify-content-between align-items-center">
            <h5 class="mb-0">
              <i class="bi bi-bag-check me-2"></i>Productos 
              <span class="badge bg-primary rounded-pill">${items.length}</span>
            </h5>
            <button type="button" onclick="limpiarCarrito()" class="btn btn-sm btn-outline-danger">
              <i class="bi bi-trash me-1"></i>Vaciar carrito
            </button>
          </div>
        </div>
        
        <div class="card-body p-0">
          <div class="list-group list-group-flush">
            ${items.map((item) => crearItemHTML(item)).join("")}
          </div>
        </div>
        
        <div class="card-footer bg-light py-3">
          <div class="d-flex justify-content-between align-items-center">
            <a href="/productos" class="btn btn-outline-primary">
              <i class="bi bi-arrow-left me-2"></i>Seguir Comprando
            </a>
            <div class="text-end">
              <small class="text-muted d-block">Subtotal de productos:</small>
              <strong class="fs-5 text-success">
                S/. <span id="subtotal-productos">${subtotal.toFixed(2)}</span>
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="col-lg-4">
      <div class="cart-summary">
        <div class="card border-0 shadow-sm mb-3">
          <div class="card-header bg-dark text-white py-3">
            <h5 class="mb-0">
              <i class="bi bi-calculator me-2"></i>Resumen del Pedido
            </h5>
          </div>
          <div class="card-body p-4">
            <div class="summary-row">
              <span>Subtotal:</span>
              <strong id="subtotal-display">S/. ${subtotal.toFixed(2)}</strong>
            </div>
            <div class="summary-row">
              <span>IGV (18%):</span>
              <strong id="igv-display">S/. ${igv.toFixed(2)}</strong>
            </div>
            <div class="summary-row">
              <span>Costo de envío:</span>
              <strong id="envio-display">S/. ${COSTO_ENVIO.toFixed(2)}</strong>
            </div>
            <div class="summary-row">
              <span class="fs-5">Total a pagar:</span>
              <span id="total-display" class="summary-total">S/. ${total.toFixed(
                2
              )}</span>
            </div>
          </div>
          <div class="card-footer bg-white border-top-0 p-3">
            <div class="d-grid">
              <a href="#" onclick="procederAlPago(event)" class="btn btn-success btn-lg">
                <i class="bi bi-credit-card me-2"></i>Proceder al Pago
              </a>
            </div>
          </div>
        </div>
        
        <div class="card border-0 bg-light mb-3">
          <div class="card-body p-3">
            <div class="d-flex align-items-center mb-3">
              <i class="bi bi-shield-check text-success fs-2 me-3"></i>
              <div>
                <h6 class="mb-1 fw-bold">Compra 100% Segura</h6>
                <small class="text-muted">Tus datos están protegidos</small>
              </div>
            </div>
            <hr class="my-2">
            <div class="d-flex align-items-center mb-2">
              <i class="bi bi-truck text-primary me-2"></i>
              <small>Envío rápido y seguro</small>
            </div>
            <div class="d-flex align-items-center">
              <i class="bi bi-arrow-return-left text-info me-2"></i>
              <small>Devolución en 30 días</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  carritoContent.innerHTML = html;
  initCarrito();
}

// Renderiza únicamente los items dentro del sidebar (mantiene el formulario en la izquierda)
function renderItemsIntoSidebar(items) {
  const productosContainer = document.querySelector(
    ".list-group.list-group-flush"
  );
  if (!productosContainer) {
    // Si no existe el contenedor (plantilla diferente), caer al render completo
    console.warn(
      "contenedor '.list-group-flush' no encontrado, renderizando estructura completa"
    );
    crearEstructuraCarrito(items);
    return;
  }

  productosContainer.innerHTML = "";
  items.forEach((item) => {
    productosContainer.insertAdjacentHTML("beforeend", crearItemHTML(item));
  });

  // Inicializar eventos sobre los elementos recién insertados
  initCarrito();

  // Actualizar totales y contador
  actualizarTodosLosSubtotales();
  actualizarTotalesCarrito();
  actualizarContadorCarrito();
}

// Refresca los items del carrito desde el servidor y actualiza la UI
function refreshCarritoFromServer() {
  // Solo refrescar si estamos en la vista del carrito
  if (window.location.pathname !== "/carrito") {
    return;
  }

  fetch("/api/carrito/items", { credentials: "same-origin" })
    .then((r) => {
      if (!r.ok) throw new Error("Error al obtener items");
      return r.json();
    })
    .then((items) => {
      console.log("🔄 Refrescando carrito con", items.length, "items");
      if (items && items.length > 0) {
        renderItemsIntoSidebar(items);
      }
    })
    .catch((err) => console.warn("No se pudo refrescar carrito:", err));
}

/**
 * Crea el HTML para un item individual del carrito
 */
function crearItemHTML(item) {
  // Normalizar valores y evitar errores con toFixed en strings
  const id = item.id;
  const nombre = item.nombre || "Producto";
  const precio = Number(item.precio) || 0;
  const cantidad = Number(item.cantidad) || 1;
  const imagen = item.imagen || "/img/placeholder.jpg";
  const stock = Number(item.stock) || 999;

  const subtotal = (precio * cantidad).toFixed(2);

  return `
    <div class="list-group-item cart-item p-3" id="carrito-item-${id}">
      <div class="row g-3 align-items-center">
        <div class="col-md-2 col-3">
          <img src="${imagen}" 
               alt="${nombre}"
               class="img-fluid product-image"
               style="width: 100%; height: 80px; object-fit: cover; border-radius: 0.5rem;"
               onerror="this.src='/img/placeholder.jpg'">
        </div>
        
        <div class="col-md-4 col-9">
          <h6 class="mb-1 fw-bold">${nombre}</h6>
          <p class="mb-0 small">
            <span class="text-success fw-semibold">S/. ${precio.toFixed(
              2
            )}</span>
            <span class="text-muted"> por unidad</span>
          </p>
        </div>
        
        <div class="col-md-3 col-7">
          <label class="form-label small mb-2">Cantidad:</label>
          <div class="quantity-controls">
            <button type="button" 
                    class="btn-decrement"
                    data-producto-id="${id}"
                    title="Disminuir cantidad">
              <i class="bi bi-dash"></i>
            </button>
            <input type="number" 
                   min="1"
                   class="cantidad-input"
                   data-producto-id="${id}"
                   data-precio="${precio}"
                   max="${stock}"
                   value="${cantidad}"
                   readonly>
            <button type="button" 
                    class="btn-increment"
                    data-producto-id="${id}"
                    title="Aumentar cantidad">
              <i class="bi bi-plus"></i>
            </button>
          </div>
        </div>
        
        <div class="col-md-3 col-5 text-end">
          <div class="price-tag mb-2">
            S/. <span id="subtotal-item-${id}">${subtotal}</span>
          </div>
          <button type="button" 
                  class="btn btn-sm btn-outline-danger eliminar-item"
                  data-producto-id="${id}"
                  title="Eliminar producto">
            <i class="bi bi-trash me-1"></i>Eliminar
          </button>
        </div>
      </div>
    </div>
  `;
}

// ============================================================================
// INICIALIZACIÓN DE CONTROLES
// ============================================================================

function initCarrito() {
  console.log("🔧 Inicializando controles del carrito");

  // Botones de agregar al carrito
  document.querySelectorAll(".add-to-cart").forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();

      if (this.disabled) {
        mostrarToast("Este producto no está disponible", "warning");
        return;
      }

      const productoId = this.getAttribute("data-id");
      const productoNombre = this.getAttribute("data-nombre") || "Producto";
      const productoPrecio = parseFloat(this.getAttribute("data-precio") || 0);
      const productoImagen =
        this.getAttribute("data-imagen") || "/img/placeholder.jpg";

      agregarAlCarrito(productoId, 1, {
        nombre: productoNombre,
        precio: productoPrecio,
        imagen: productoImagen,
      });
    });
  });

  // Inputs de cantidad
  document.querySelectorAll(".cantidad-input").forEach((input) => {
    input.addEventListener("change", function () {
      const productoId = this.getAttribute("data-producto-id");
      const nuevaCantidad = parseInt(this.value);
      const stockMax = parseInt(this.getAttribute("max"));

      // Obtener el nombre del producto para el mensaje
      const itemElement = document.getElementById(`carrito-item-${productoId}`);
      let nombreProducto = "este producto";
      if (itemElement) {
        const nombreElement = itemElement.querySelector("h6");
        if (nombreElement) {
          nombreProducto = nombreElement.textContent.trim();
        }
      }

      if (nuevaCantidad > stockMax) {
        Swal.fire({
          icon: "warning",
          title: "Stock máximo alcanzado",
          text: `Solo puedes comprar hasta ${stockMax} unidades de ${nombreProducto} según el stock disponible.`,
          confirmButtonText: "Entendido",
          confirmButtonColor: "#0d6efd",
        });
        this.value = stockMax;
        actualizarCantidad(productoId, stockMax);
        return;
      }

      if (nuevaCantidad < 1) {
        this.value = 1;
        actualizarCantidad(productoId, 1);
        return;
      }

      actualizarCantidad(productoId, nuevaCantidad);
    });
  });

  // Botones de incremento
  document.querySelectorAll(".btn-increment").forEach((btn) => {
    btn.addEventListener("click", function () {
      const productoId = this.getAttribute("data-producto-id");
      const input = document.querySelector(
        `.cantidad-input[data-producto-id="${productoId}"]`
      );

      if (input) {
        const max = parseInt(input.getAttribute("max")) || Infinity;
        let val = parseInt(input.value) || 0;

        // Obtener el nombre del producto para el mensaje
        const itemElement = document.getElementById(
          `carrito-item-${productoId}`
        );
        let nombreProducto = "este producto";
        if (itemElement) {
          const nombreElement = itemElement.querySelector("h6");
          if (nombreElement) {
            nombreProducto = nombreElement.textContent.trim();
          }
        }

        if (val < max) {
          val += 1;
          input.value = val;
          actualizarCantidad(productoId, val);
        } else {
          Swal.fire({
            icon: "warning",
            title: "Stock máximo alcanzado",
            text: `Solo puedes comprar hasta ${max} unidades de ${nombreProducto} según el stock disponible.`,
            confirmButtonText: "Entendido",
            confirmButtonColor: "#0d6efd",
          });
        }
      }
    });
  });

  // Botones de decremento
  document.querySelectorAll(".btn-decrement").forEach((btn) => {
    btn.addEventListener("click", function () {
      const productoId = this.getAttribute("data-producto-id");
      const input = document.querySelector(
        `.cantidad-input[data-producto-id="${productoId}"]`
      );

      if (input) {
        let val = parseInt(input.value) || 0;

        if (val > 1) {
          val -= 1;
          input.value = val;
          actualizarCantidad(productoId, val);
        } else {
          eliminarDelCarrito(productoId);
        }
      }
    });
  });

  // Botones de eliminar
  document.querySelectorAll(".eliminar-item").forEach((btn) => {
    btn.addEventListener("click", function () {
      const productoId = this.getAttribute("data-producto-id");
      eliminarDelCarrito(productoId);
    });
  });
}

// ============================================================================
// FUNCIONES DE CARRITO (CRUD)
// ============================================================================

function agregarAlCarrito(productoId, cantidad = 1, datosProducto = {}) {
  const btn = document.querySelector(`[data-id="${productoId}"]`);
  const iconOriginal = btn ? btn.innerHTML : "";

  if (btn) {
    btn.disabled = true;
    btn.innerHTML =
      '<span class="spinner-border spinner-border-sm" role="status"></span>';
  }

  const logged = isUserLoggedIn();

  if (!logged) {
    // Usuario NO autenticado - obtener datos del producto desde el servidor
    const headers = agregarHeadersCSRF({
      "Content-Type": "application/json",
    });

    fetch(
      `/api/carrito/agregar?cantidad=${cantidad}&productoId=${productoId}`,
      {
        method: "POST",
        credentials: "same-origin",
        headers: headers,
      }
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          // Ahora obtener los datos completos del producto para guardar en localStorage
          fetch("/api/carrito/items", { credentials: "same-origin" })
            .then((resp) => resp.json())
            .then((items) => {
              // Buscar el producto que acabamos de agregar
              const productoAgregado = items.find(
                (item) => item.id == productoId
              );

              if (productoAgregado) {
                const productoData = {
                  id: parseInt(productoAgregado.id),
                  nombre: productoAgregado.nombre,
                  precio: productoAgregado.precio,
                  imagen: productoAgregado.imagen,
                  stock: productoAgregado.stock,
                };

                console.log("💾 Guardando en localStorage:", productoData);
                agregarItemAlCarritoLocal(productoData, cantidad);
              }
            })
            .catch((err) =>
              console.warn("No se pudieron obtener detalles del producto:", err)
            );

          mostrarToast("✓ Producto agregado al carrito", "success");

          if (btn) {
            animarBotonExito(btn, iconOriginal);
          }

          actualizarContadorCarrito();
        } else {
          mostrarToast(data.message || "Error al agregar producto", "error");
          if (btn) restaurarBoton(btn, iconOriginal);
        }
      })
      .catch((err) => {
        console.warn("Error al sincronizar con servidor:", err);
        mostrarToast("Error al agregar producto", "error");
        if (btn) restaurarBoton(btn, iconOriginal);
      });

    return;
  }

  // Usuario autenticado
  const headers = agregarHeadersCSRF({
    "Content-Type": "application/json",
  });

  fetch(`/api/carrito/agregar?cantidad=${cantidad}&productoId=${productoId}`, {
    method: "POST",
    credentials: "same-origin",
    headers: headers,
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        mostrarToast("✓ Producto agregado al carrito", "success");

        if (data.cantidad !== undefined) {
          actualizarBadgeLocal(data.cantidad);
        } else {
          actualizarContadorCarrito();
        }

        if (btn) animarBotonExito(btn, iconOriginal);

        // Refrescar la lista visible del carrito para usuarios autenticados
        try {
          refreshCarritoFromServer();
        } catch (e) {
          console.warn("No se pudo refrescar carrito tras agregar:", e);
        }
      } else {
        mostrarToast(data.message || "Error al agregar producto", "error");
        if (btn) restaurarBoton(btn, iconOriginal);
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      mostrarToast("Error al agregar producto", "error");
      if (btn) restaurarBoton(btn, iconOriginal);
    });
}

function actualizarCantidad(productoId, cantidad) {
  const logged = isUserLoggedIn();

  if (!logged) {
    // Usuario anónimo
    actualizarCantidadLocalStorage(productoId, cantidad);
    actualizarSubtotalItem(productoId, cantidad);
    actualizarTotalesCarrito();
    actualizarContadorCarrito();
    return;
  }

  // Usuario autenticado
  const headers = agregarHeadersCSRF({
    "Content-Type": "application/json",
  });

  fetch(
    `/api/carrito/actualizar?productoId=${productoId}&cantidad=${cantidad}`,
    {
      method: "PUT",
      credentials: "same-origin",
      headers: headers,
    }
  )
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        actualizarSubtotalItem(productoId, cantidad);
        actualizarTotalesCarrito();

        if (data.cantidad !== undefined) {
          actualizarBadgeLocal(data.cantidad);
        } else {
          actualizarContadorCarrito();
        }
      } else {
        mostrarToast(data.message || "Error al actualizar cantidad", "error");
        location.reload();
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      mostrarToast("Error al actualizar cantidad", "error");
    });
}

function eliminarDelCarrito(productoId) {
  Swal.fire({
    title: "¿Eliminar producto?",
    text: "Este producto será removido de tu carrito",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#dc3545",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar",
  }).then((result) => {
    if (result.isConfirmed) {
      const logged = isUserLoggedIn();

      if (!logged) {
        // Usuario anónimo
        eliminarDeLocalStorage(productoId);

        const productoElement = document.getElementById(
          `carrito-item-${productoId}`
        );
        if (productoElement) {
          productoElement.classList.add("opacity-0");
          setTimeout(() => {
            productoElement.remove();
            verificarCarritoVacio();
          }, 300);
        }

        actualizarTotalesCarrito();
        actualizarContadorCarrito();
        mostrarToast("Producto eliminado", "success");
        return;
      }

      // Usuario autenticado
      const headers = agregarHeadersCSRF({
        "Content-Type": "application/json",
      });

      fetch(`/api/carrito/eliminar?productoId=${productoId}`, {
        method: "DELETE",
        credentials: "same-origin",
        headers: headers,
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            const productoElement = document.getElementById(
              `carrito-item-${productoId}`
            );
            if (productoElement) {
              productoElement.classList.add("opacity-0");
              setTimeout(() => {
                productoElement.remove();
                verificarCarritoVacio();
              }, 300);
            }

            actualizarTotalesCarrito();

            if (data.cantidad !== undefined) {
              actualizarBadgeLocal(data.cantidad);
            } else {
              actualizarContadorCarrito();
            }

            mostrarToast("Producto eliminado", "success");
          } else {
            mostrarToast(data.message || "Error al eliminar producto", "error");
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          mostrarToast("Error al eliminar producto", "error");
        });
    }
  });
}

function limpiarCarrito() {
  Swal.fire({
    title: "¿Vaciar carrito?",
    text: "Se eliminarán todos los productos del carrito",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#dc3545",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "Sí, vaciar",
    cancelButtonText: "Cancelar",
  }).then((result) => {
    if (result.isConfirmed) {
      const logged = isUserLoggedIn();

      if (!logged) {
        // Usuario anónimo
        localStorage.removeItem("carritoAnonimo");

        Swal.fire({
          title: "¡Carrito limpiado!",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        }).then(() => {
          window.location.reload();
        });

        return;
      }

      // Usuario autenticado
      const headers = agregarHeadersCSRF({
        "Content-Type": "application/json",
      });

      fetch("/api/carrito/limpiar", {
        method: "DELETE",
        credentials: "same-origin",
        headers: headers,
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            Swal.fire({
              title: "¡Carrito limpiado!",
              icon: "success",
              timer: 1500,
              showConfirmButton: false,
            }).then(() => {
              window.location.reload();
            });
          } else {
            mostrarToast(data.message || "Error al limpiar carrito", "error");
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          mostrarToast("Error al limpiar el carrito", "error");
        });
    }
  });
}

// ============================================================================
// SINCRONIZACIÓN Y RESTAURACIÓN
// ============================================================================

/**
 * Verifica si necesitamos restaurar un carrito después del login
 */
function verificarYRestaurarCarrito() {
  const vieneDeLogin = localStorage.getItem("redirigidoDesdeCarrito");
  const carritoGuardado = localStorage.getItem("carritoAnonimo");
  const esUsuarioLogueado = isUserLoggedIn();

  if (vieneDeLogin && carritoGuardado && esUsuarioLogueado) {
    console.log("🔄 Restaurando carrito después del login...");
    localStorage.removeItem("redirigidoDesdeCarrito");

    try {
      const productos = JSON.parse(carritoGuardado);

      if (productos.length === 0) {
        localStorage.removeItem("carritoAnonimo");
        return;
      }

      sincronizarCarritoLocal(productos);
    } catch (error) {
      console.error("❌ Error al procesar carrito guardado:", error);
      localStorage.removeItem("carritoAnonimo");
    }
  }
}

/**
 * Sincroniza el carrito local con el backend
 */
async function sincronizarCarritoLocal(productos) {
  Swal.fire({
    title: "Restaurando carrito...",
    html: "Por favor espera un momento",
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });

  const promesas = productos.map((producto) => {
    const pid = producto.id;
    const cantidad = producto.cantidad || 1;
    return fetch(`/api/carrito/agregar?cantidad=${cantidad}`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: parseInt(pid) }),
    });
  });

  try {
    const responses = await Promise.all(promesas);
    const results = await Promise.all(responses.map((r) => r.json()));

    const exitosos = results.filter((r) => r.success).length;

    Swal.close();

    if (exitosos > 0) {
      mostrarToast(`✓ ${exitosos} producto(s) restaurado(s)`, "success");
      actualizarContadorCarrito();

      setTimeout(() => {
        if (window.location.pathname !== "/carrito") {
          window.location.href = "/carrito";
        } else {
          window.location.reload();
        }
      }, 1500);
    }
  } catch (error) {
    console.error("❌ Error al restaurar carrito:", error);
    Swal.close();
    mostrarToast("Error al restaurar el carrito", "error");
  } finally {
    localStorage.removeItem("carritoAnonimo");
  }
}

// ============================================================================
// ACTUALIZACIÓN DE UI
// ============================================================================

function actualizarContadorCarrito() {
  const logged = isUserLoggedIn();

  if (!logged) {
    const cantidadLocal = obtenerCantidadCarritoLocal();
    actualizarBadgeLocal(cantidadLocal);
    return;
  }

  fetch("/api/carrito/cantidad", { credentials: "same-origin" })
    .then((response) => {
      if (!response.ok) throw new Error("Error al obtener cantidad");
      return response.json();
    })
    .then((cantidad) => {
      actualizarBadgeLocal(cantidad);
    })
    .catch((error) => {
      console.error("❌ Error al actualizar contador:", error);
    });
}

function actualizarBadgeLocal(cantidad) {
  const badge = document.querySelector("#carrito-count");
  if (badge) {
    badge.textContent = cantidad;
    badge.style.display = cantidad > 0 ? "inline-block" : "none";
  }

  const dropdownBadge = document.querySelector(".carrito-dropdown-badge");
  if (dropdownBadge) {
    dropdownBadge.textContent = cantidad;
  }
}

function actualizarSubtotalItem(productoId, cantidad) {
  const input = document.querySelector(
    `.cantidad-input[data-producto-id="${productoId}"]`
  );
  if (!input) return;

  const precio = parseFloat(input.getAttribute("data-precio"));
  const subtotalElement = document.getElementById(
    `subtotal-item-${productoId}`
  );

  if (subtotalElement && precio) {
    const nuevoSubtotal = precio * cantidad;
    subtotalElement.textContent = nuevoSubtotal.toFixed(2);
  }
}

function actualizarTodosLosSubtotales() {
  document.querySelectorAll(".cantidad-input").forEach((input) => {
    const productoId = input.getAttribute("data-producto-id");
    const cantidad = parseInt(input.value) || 0;
    const precio = parseFloat(input.getAttribute("data-precio")) || 0;
    const subtotalElement = document.getElementById(
      `subtotal-item-${productoId}`
    );

    if (subtotalElement && precio > 0) {
      const subtotal = precio * cantidad;
      subtotalElement.textContent = subtotal.toFixed(2);
    }
  });
}

function actualizarTotalesCarrito() {
  let subtotal = 0;

  const logged = isUserLoggedIn();
  const inputsEnDOM = document.querySelectorAll(".cantidad-input");

  if (inputsEnDOM.length > 0) {
    // Calcular desde los inputs visibles
    inputsEnDOM.forEach((input) => {
      const cantidad = parseInt(input.value) || 0;
      const precio = parseFloat(input.getAttribute("data-precio")) || 0;
      subtotal += cantidad * precio;
    });
  } else if (!logged) {
    // Usuario anónimo sin inputs: calcular desde localStorage
    const carrito = obtenerCarritoLocal();
    subtotal = carrito.reduce((acc, item) => {
      return acc + (item.precio || 0) * (item.cantidad || 1);
    }, 0);
  }

  const igv = subtotal * TASA_IGV;
  const total = subtotal + igv + COSTO_ENVIO;

  console.log(
    `💰 Totales - Subtotal: ${subtotal.toFixed(2)}, IGV: ${igv.toFixed(
      2
    )}, Total: ${total.toFixed(2)}`
  );

  actualizarDisplay("subtotal-display", subtotal);
  actualizarDisplay("subtotal-productos", subtotal);
  actualizarDisplay("igv-display", igv);
  actualizarDisplay("envio-display", COSTO_ENVIO);
  actualizarDisplay("total-display", total);
}

function actualizarDisplay(elementId, valor) {
  const element = document.getElementById(elementId);
  if (element) {
    // Si el elemento solo contiene texto, actualizar directamente
    if (element.textContent.includes("S/.")) {
      element.textContent = `S/. ${valor.toFixed(2)}`;
    } else {
      element.textContent = valor.toFixed(2);
    }
  }
}

function verificarCarritoVacio() {
  const logged = isUserLoggedIn();

  if (!logged) {
    const carritoLocal = obtenerCarritoLocal();
    if (carritoLocal.length === 0) {
      mostrarCarritoVacioUI();
    }
    return;
  }

  const productosCarrito = document.querySelectorAll(".cantidad-input");
  if (productosCarrito.length === 0) {
    mostrarCarritoVacioUI();
  }
}

function mostrarCarritoVacioUI() {
  const container = document.querySelector(".container.my-5");
  if (!container) return;

  container.innerHTML = `
    <div class="row mb-4">
      <div class="col-12">
        <h2 class="fw-bold">
          <i class="bi bi-cart-check me-2"></i>Mi Carrito de Compras
        </h2>
        <nav aria-label="breadcrumb">
          <ol class="breadcrumb">
            <li class="breadcrumb-item">
              <a href="/" class="text-decoration-none">Inicio</a>
            </li>
            <li class="breadcrumb-item">
              <a href="/productos" class="text-decoration-none">Productos</a>
            </li>
            <li class="breadcrumb-item active" aria-current="page">Carrito</li>
          </ol>
        </nav>
      </div>
    </div>
    
    <div class="row justify-content-center mt-5">
      <div class="col-md-8 col-lg-6">
        <div class="card border-0 shadow-sm">
          <div class="card-body text-center py-5 px-4">
            <div class="mb-4">
              <i class="bi bi-cart-x" style="font-size: 5rem; color: #6c757d;"></i>
            </div>
            <h3 class="fw-bold mb-3">Tu carrito está vacío</h3>
            <p class="text-muted mb-4">
              ¿No sabes qué comprar? ¡Miles de productos te esperan!
            </p>
            <a href="/productos" class="btn btn-primary btn-lg px-4">
              <i class="bi bi-box-seam me-2"></i>Explorar Productos
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================================
// UTILIDADES Y HELPERS
// ============================================================================

function animarBotonExito(btn, iconOriginal) {
  btn.classList.add("btn-success");
  btn.innerHTML = '<i class="bi bi-check-lg"></i> Agregado';

  setTimeout(() => {
    btn.classList.remove("btn-success");
    btn.innerHTML = iconOriginal;
    btn.disabled = false;
  }, 1500);
}

function restaurarBoton(btn, iconOriginal) {
  btn.innerHTML = iconOriginal;
  btn.disabled = false;
}

function procederAlPago(event) {
  event.preventDefault();

  const isLoggedIn = isUserLoggedIn();

  if (!isLoggedIn) {
    // Usuario no autenticado
    Swal.fire({
      title: "Inicia sesión para continuar",
      text: "Necesitas una cuenta para completar tu compra",
      icon: "info",
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: "Iniciar sesión",
      denyButtonText: "Registrarme",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#0d6efd",
      denyButtonColor: "#198754",
    }).then((result) => {
      if (result.isConfirmed) {
        // Guardar carrito antes de redirigir
        localStorage.setItem("redirigidoDesdeCarrito", "true");
        window.location.href = "/login";
      } else if (result.isDenied) {
        localStorage.setItem("redirigidoDesdeCarrito", "true");
        window.location.href = "/registro";
      }
    });
  } else {
    // Usuario autenticado - mostrar formulario de checkout
    mostrarFormularioCheckout();
  }
}

function mostrarFormularioCheckout() {
  // Verificar si ya existe el formulario en la página
  const formularioExistente = document.getElementById("checkout-form-section");

  if (formularioExistente) {
    // Scroll al formulario
    formularioExistente.scrollIntoView({ behavior: "smooth" });
    return;
  }

  // Crear sección de formulario
  const carritoContent = document.getElementById("carrito-content");
  if (!carritoContent) return;

  const formHTML = `
    <div class="col-12 mt-4" id="checkout-form-section">
      <div class="card border-0 shadow-sm">
        <div class="card-header bg-dark text-white py-3">
          <h5 class="mb-0">
            <i class="bi bi-clipboard-check me-2"></i>Datos de Envío
          </h5>
        </div>
        <div class="card-body p-4">
          <form id="formCompra" novalidate>
            <div class="row g-3">
              <div class="col-md-6">
                <label for="nombre" class="form-label fw-semibold">
                  <i class="bi bi-person me-1"></i>Nombre
                </label>
                <input type="text" id="nombre" name="nombre" class="form-control"
                       placeholder="Ingresa tu nombre" required>
                <div class="invalid-feedback">Por favor ingresa tu nombre.</div>
              </div>

              <div class="col-md-6">
                <label for="apellido" class="form-label fw-semibold">
                  <i class="bi bi-person me-1"></i>Apellido
                </label>
                <input type="text" id="apellido" name="apellido" class="form-control"
                       placeholder="Ingresa tu apellido" required>
                <div class="invalid-feedback">Por favor ingresa tu apellido.</div>
              </div>

              <div class="col-md-6">
                <label for="email" class="form-label fw-semibold">
                  <i class="bi bi-envelope me-1"></i>Correo Electrónico
                </label>
                <input type="email" id="email" name="email" class="form-control"
                       placeholder="correo@ejemplo.com" required>
                <div class="invalid-feedback">Por favor ingresa un correo válido.</div>
              </div>

              <div class="col-md-6">
                <label for="celular" class="form-label fw-semibold">
                  <i class="bi bi-phone me-1"></i>Teléfono/Celular
                </label>
                <input type="tel" id="celular" name="celular" class="form-control"
                       placeholder="999 999 999" pattern="[0-9]{9}" required>
                <div class="invalid-feedback">Por favor ingresa un teléfono válido (9 dígitos).</div>
              </div>

              <div class="col-12">
                <label for="direccion" class="form-label fw-semibold">
                  <i class="bi bi-geo-alt me-1"></i>Dirección de Entrega
                </label>
                <input type="text" id="direccion" name="direccion" class="form-control"
                       placeholder="Av. Principal 123, Distrito, Ciudad" required>
                <div class="invalid-feedback">Por favor ingresa tu dirección.</div>
              </div>

              <div class="col-12">
                <label for="metodoPago" class="form-label fw-semibold">
                  <i class="bi bi-credit-card me-1"></i>Método de Pago
                </label>
                <select class="form-select" id="metodoPago" name="metodoPago" required>
                  <option value="" selected disabled>Selecciona un método de pago</option>
                  <option value="yape">Yape</option>
                  <option value="transferencia">Transferencia Bancaria</option>
                  <option value="efectivo">Efectivo contra entrega</option>
                </select>
                <div class="invalid-feedback">Por favor selecciona un método de pago.</div>
              </div>

              <div class="col-12 mt-4">
                <button type="submit" class="btn btn-success btn-lg w-100">
                  <i class="bi bi-credit-card me-2"></i>Finalizar Compra
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  carritoContent.insertAdjacentHTML("beforeend", formHTML);

  // Scroll al formulario
  setTimeout(() => {
    document
      .getElementById("checkout-form-section")
      .scrollIntoView({ behavior: "smooth" });
  }, 100);

  // Inicializar validación del formulario
  inicializarFormularioCheckout();
}

function inicializarFormularioCheckout() {
  const form = document.getElementById("formCompra");
  if (!form) return;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    e.stopPropagation();

    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      return;
    }

    // Recopilar datos del formulario
    const formData = {
      nombres: document.getElementById("nombre").value,
      apellido: document.getElementById("apellido").value,
      correo: document.getElementById("email").value,
      telefono: document.getElementById("celular").value,
      direccion: document.getElementById("direccion").value,
      metodoPago: document.getElementById("metodoPago").value,
      items: [],
    };

    // Recopilar items del carrito
    const inputsCantidad = document.querySelectorAll(".cantidad-input");
    inputsCantidad.forEach((input) => {
      const productoId = input.getAttribute("data-producto-id");
      const cantidad = parseInt(input.value);
      formData.items.push({ id: parseInt(productoId), cantidad });
    });

    // Enviar al backend
    try {
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML =
        '<span class="spinner-border spinner-border-sm me-2"></span>Procesando...';

      const headers = agregarHeadersCSRF({
        "Content-Type": "application/json",
      });

      const response = await fetch("/api/compras/realizar-guest", {
        method: "POST",
        credentials: "same-origin",
        headers: headers,
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Limpiar carrito local
        localStorage.removeItem("carritoAnonimo");

        // Mostrar mensaje de éxito
        await Swal.fire({
          title: "¡Compra realizada!",
          text: "Tu pedido ha sido registrado correctamente",
          icon: "success",
          confirmButtonText: "Aceptar",
        });

        // Redirigir al home
        window.location.href = "/";
      } else {
        throw new Error(data.message || "Error al procesar la compra");
      }
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        title: "Error",
        text: error.message || "No se pudo procesar la compra",
        icon: "error",
      });

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = false;
      submitBtn.innerHTML =
        '<i class="bi bi-credit-card me-2"></i>Finalizar Compra';
    }
  });
}

// ============================================================================
// EXPORTAR FUNCIONES GLOBALES
// ============================================================================

window.agregarAlCarrito = agregarAlCarrito;
window.limpiarCarrito = limpiarCarrito;
window.actualizarContadorCarrito = actualizarContadorCarrito;
window.procederAlPago = procederAlPago;
window.renderizarCarritoAnonimo = renderizarCarritoAnonimo;
