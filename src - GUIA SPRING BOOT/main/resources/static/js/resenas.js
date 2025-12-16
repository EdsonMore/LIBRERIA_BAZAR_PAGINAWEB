// resenas.js - Sistema de gestión de reseñas para productos
// Maneja la carga, visualización, creación y eliminación de reseñas

// =============================================
// UTILIDADES CSRF
// =============================================

/**
 * Obtiene el token CSRF de los meta tags
 */
function obtenerTokenCSRF() {
  const token = document
    .querySelector('meta[name="csrf-token"]')
    ?.getAttribute("content");
  const header =
    document
      .querySelector('meta[name="csrf-header"]')
      ?.getAttribute("content") || "X-CSRF-TOKEN";
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

// Variables globales
let calificacionSeleccionada = 0;
let productoId = null;
let collapseInstance = null;

// =============================================
// INICIALIZACIÓN DEL SISTEMA
// =============================================

/**
 * Inicializa el sistema de reseñas cuando el documento está listo
 */
document.addEventListener("DOMContentLoaded", function () {
  console.log("🔄 Inicializando sistema de reseñas...");
  productoId = obtenerProductoId();

  if (productoId) {
    console.log(
      "✅ Sistema de reseñas inicializado para producto:",
      productoId
    );
    inicializarSistemaResenas();
  } else {
    console.error("❌ No se pudo obtener el ID del producto");
    mostrarErrorResenas(
      "No se pudo identificar el producto. Recarga la página."
    );
  }
});

/**
 * Inicializa todos los componentes del sistema de reseñas
 */
function inicializarSistemaResenas() {
  cargarResenas();
  inicializarFormulario();
  configurarBootstrapCollapse();
}

/**
 * Configura el collapse de Bootstrap para el formulario
 */
function configurarBootstrapCollapse() {
  const collapseElement = document.getElementById("formResena");
  if (collapseElement && typeof bootstrap !== "undefined") {
    collapseInstance = new bootstrap.Collapse(collapseElement, {
      toggle: false,
    });
  }
}

// =============================================
// OBTENCIÓN DEL ID DEL PRODUCTO - CORREGIDO
// =============================================

/**
 * Obtiene el ID del producto desde múltiples fuentes
 * @returns {number|null} ID del producto o null si no se encuentra
 */
function obtenerProductoId() {
  console.log("🔍 Buscando ID del producto...");

  try {
    // MÉTODO 1: Desde Thymeleaf en data attribute (RECOMENDADO)
    const productoIdElement = document.querySelector("[data-producto-id]");
    if (productoIdElement) {
      const id = productoIdElement.getAttribute("data-producto-id");
      if (id && !isNaN(id)) {
        console.log("✅ ID encontrado en data attribute:", id);
        return parseInt(id);
      }
    }

    // MÉTODO 2: Desde la URL (patrón común: /producto/123)
    const path = window.location.pathname;
    console.log("📁 Ruta actual:", path);

    const urlPatterns = [
      /\/producto\/(\d+)/,
      /\/productos\/(\d+)/,
      /\/item\/(\d+)/,
      /\/p\/(\d+)/,
    ];

    for (const pattern of urlPatterns) {
      const match = path.match(pattern);
      if (match && match[1]) {
        console.log("✅ ID encontrado en URL:", match[1]);
        return parseInt(match[1]);
      }
    }

    // MÉTODO 3: Desde variable global (si está definida)
    if (window.productoActual && window.productoActual.id) {
      console.log(
        "✅ ID encontrado en variable global:",
        window.productoActual.id
      );
      return window.productoActual.id;
    }

    // MÉTODO 4: Desde inputs hidden o elementos con ID
    const hiddenInput = document.querySelector(
      'input[name="productoId"], input[id="productoId"]'
    );
    if (hiddenInput && hiddenInput.value) {
      console.log("✅ ID encontrado en input hidden:", hiddenInput.value);
      return parseInt(hiddenInput.value);
    }

    // MÉTODO 5: Desde el título o metadata de la página
    const metaProductId = document.querySelector('meta[name="producto-id"]');
    if (metaProductId && metaProductId.content) {
      console.log("✅ ID encontrado en meta tag:", metaProductId.content);
      return parseInt(metaProductId.content);
    }

    // MÉTODO 6: Buscar en cualquier elemento que pueda contener el ID
    const possibleElements = document.querySelectorAll(
      '[id*="producto"], [class*="producto"]'
    );
    for (const element of possibleElements) {
      const text = element.textContent || element.innerText;
      const idMatch = text.match(/(\d+)/);
      if (idMatch && idMatch[1] && idMatch[1].length >= 1) {
        console.log("✅ ID encontrado en contenido de elemento:", idMatch[1]);
        return parseInt(idMatch[1]);
      }
    }

    console.warn(
      "❌ No se pudo encontrar el ID del producto en ninguna fuente"
    );
    return null;
  } catch (error) {
    console.error("❌ Error obteniendo ID del producto:", error);
    return null;
  }
}

// =============================================
// FUNCIONES PRINCIPALES
// =============================================

/**
 * Carga las reseñas del producto desde el servidor
 */
async function cargarResenas() {
  if (!productoId) {
    console.error("❌ No hay productoId para cargar reseñas");
    mostrarErrorResenas("Error: No se pudo identificar el producto.");
    return;
  }

  console.log("📥 Cargando reseñas para producto:", productoId);

  try {
    // Mostrar indicador de carga
    mostrarEstadoCarga();

    // Cargar estadísticas primero
    await cargarEstadisticas();

    // Cargar lista de reseñas
    await cargarListaResenas();
  } catch (error) {
    console.error("❌ Error al cargar reseñas:", error);
    manejarErrorCargaResenas(error);
  }
}

/**
 * Muestra el estado de carga
 */
function mostrarEstadoCarga() {
  const loading = document.getElementById("loading-resenas");
  const noResenas = document.getElementById("no-resenas");
  const container = document.getElementById("resenas-container");

  if (loading) loading.classList.remove("d-none");
  if (noResenas) noResenas.classList.add("d-none");
  if (container) container.innerHTML = "";
}

/**
 * Carga las estadísticas de reseñas
 */
async function cargarEstadisticas() {
  try {
    const response = await fetch(`/api/resenas/producto/${productoId}/stats`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} - ${response.statusText}`);
    }

    const stats = await response.json();
    console.log("📊 Estadísticas cargadas:", stats);
    actualizarResumen(stats);
  } catch (error) {
    console.error("Error cargando estadísticas:", error);
    // Continuar aunque falle las estadísticas
  }
}

/**
 * Carga la lista de reseñas
 */
async function cargarListaResenas() {
  try {
    const response = await fetch(`/api/resenas/producto/${productoId}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} - ${response.statusText}`);
    }

    const resenas = await response.json();
    console.log("📝 Reseñas cargadas:", resenas);
    mostrarResenas(resenas);
  } catch (error) {
    throw new Error(`No se pudieron cargar las reseñas: ${error.message}`);
  }
}

/**
 * Actualiza el resumen de calificaciones en la interfaz
 */
function actualizarResumen(stats) {
  const subtitle = document.getElementById("reviews-subtitle");
  const summary = document.getElementById("rating-summary");

  if (!subtitle || !summary) {
    console.warn("No se encontraron elementos para mostrar el resumen");
    return;
  }

  if (!stats || stats.total === 0) {
    subtitle.textContent = "Aún no hay opiniones. ¡Sé el primero!";
    summary.innerHTML = `
            <div class="text-center">
                <div class="fs-4 text-muted mb-1">-</div>
                <div class="text-muted small">0 reseñas</div>
            </div>
        `;
  } else {
    subtitle.textContent = `Basado en ${stats.total} ${
      stats.total === 1 ? "opinión" : "opiniones"
    }`;
    summary.innerHTML = `
            <div class="text-center">
                <div class="d-flex align-items-center justify-content-center mb-1">
                    <span class="fs-2 fw-bold text-warning me-2">${stats.promedio.toFixed(
                      1
                    )}</span>
                    <div class="fs-5">${generarEstrellas(stats.promedio)}</div>
                </div>
                <div class="text-muted small">${stats.total} ${
      stats.total === 1 ? "reseña" : "reseñas"
    }</div>
            </div>
        `;
  }
}

/**
 * Muestra la lista de reseñas en el contenedor
 */
function mostrarResenas(resenas) {
  const container = document.getElementById("resenas-container");
  const loading = document.getElementById("loading-resenas");
  const noResenas = document.getElementById("no-resenas");

  // Ocultar loading
  if (loading) loading.classList.add("d-none");

  // Verificar si hay reseñas
  if (!resenas || resenas.length === 0) {
    if (noResenas) noResenas.classList.remove("d-none");
    if (container) container.innerHTML = "";
    return;
  }

  // Ocultar "no hay reseñas" y mostrar las reseñas
  if (noResenas) noResenas.classList.add("d-none");

  // Filtrar solo reseñas aprobadas y ordenar por fecha
  const resenasAprobadas = resenas
    .filter((resena) => resena.estado === "APROBADA")
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  if (container) {
    if (resenasAprobadas.length === 0) {
      container.innerHTML = `
                <div class="alert alert-info text-center">
                    <i class="bi bi-info-circle me-2"></i>
                    Las reseñas están en proceso de moderación
                </div>
            `;
    } else {
      container.innerHTML = resenasAprobadas
        .map((resena) => crearTarjetaResena(resena))
        .join("");
    }
  }
}

/**
 * Crea el HTML para una tarjeta de reseña individual
 */
function crearTarjetaResena(resena) {
  if (!resena) return "";

  const fecha = new Date(resena.fecha);
  const fechaFormateada = fecha.toLocaleDateString("es-PE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Obtener nombre de usuario de diferentes fuentes
  const nombreUsuario =
    resena.usuario?.nombres ||
    resena.nombreUsuario ||
    resena.usuarioNombre ||
    "Usuario";

  // Verificar si el usuario actual es el autor
  const usuarioActual = obtenerUsuarioActual();
  const esAutor =
    usuarioActual &&
    nombreUsuario &&
    usuarioActual.trim().toLowerCase() === nombreUsuario.trim().toLowerCase();

  // Inicial del usuario para el avatar
  const inicial = nombreUsuario.charAt(0).toUpperCase();

  return `
        <div class="review-card card mb-3 border-0 shadow-sm" style="border-radius: 12px;">
            <div class="card-body p-4">
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <div class="d-flex align-items-center">
                        <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" 
                             style="width: 48px; height: 48px; font-size: 1.2rem; font-weight: bold;">
                            ${inicial}
                        </div>
                        <div>
                            <h6 class="mb-1 fw-bold text-dark">${escapeHtml(
                              nombreUsuario
                            )}</h6>
                            <div class="d-flex align-items-center gap-2">
                                ${generarEstrellas(
                                  resena.calificacion,
                                  "text-warning"
                                )}
                                <span class="text-muted small">${fechaFormateada}</span>
                            </div>
                        </div>
                    </div>
                    ${
                      esAutor
                        ? `
                        <button class="btn btn-sm btn-outline-danger border-0" 
                                onclick="eliminarResena(${resena.id})" 
                                title="Eliminar reseña"
                                style="border-radius: 8px;">
                            <i class="bi bi-trash"></i>
                        </button>
                    `
                        : ""
                    }
                </div>
                <p class="mb-0 text-dark lh-base">${escapeHtml(
                  resena.comentario || ""
                )}</p>
                
                ${
                  resena.estado === "PENDIENTE"
                    ? `
                    <div class="mt-2">
                        <span class="badge bg-warning text-dark">
                            <i class="bi bi-clock me-1"></i>En revisión
                        </span>
                    </div>
                `
                    : ""
                }
            </div>
        </div>
    `;
}

// =============================================
// FUNCIONALIDAD DE CALIFICACIONES CON ESTRELLAS
// =============================================

/**
 * Genera el HTML para mostrar las estrellas de calificación
 */
function generarEstrellas(calificacion, clase = "") {
  if (calificacion === undefined || calificacion === null || calificacion < 0) {
    calificacion = 0;
  }

  let html = "";
  const estrellasLlenas = Math.floor(calificacion);
  const tieneMediaEstrella = calificacion % 1 >= 0.5;

  for (let i = 1; i <= 5; i++) {
    if (i <= estrellasLlenas) {
      // Estrella completa
      html += `<i class="bi bi-star-fill ${clase} me-1"></i>`;
    } else if (i === estrellasLlenas + 1 && tieneMediaEstrella) {
      // Media estrella
      html += `<i class="bi bi-star-half ${clase} me-1"></i>`;
    } else {
      // Estrella vacía
      html += `<i class="bi bi-star ${clase} me-1"></i>`;
    }
  }
  return html;
}

/**
 * Inicializa todos los elementos del formulario de reseña
 */
function inicializarFormulario() {
  const estrellas = document.querySelectorAll(".star-rating i");
  const badgeRating = document.getElementById("selected-rating");
  const textarea = document.getElementById("comentario-resena");
  const charCount = document.getElementById("char-count");
  const btnEnviar = document.getElementById("btn-enviar-resena");

  if (!estrellas.length) {
    console.warn("No se encontraron estrellas para el rating");
    return;
  }

  // Configurar eventos para cada estrella
  estrellas.forEach((estrella) => {
    estrella.addEventListener("mouseenter", function () {
      const rating = parseInt(this.getAttribute("data-rating"));
      actualizarEstrellasVisualmente(rating, false);
    });

    estrella.addEventListener("click", function () {
      calificacionSeleccionada = parseInt(this.getAttribute("data-rating"));
      actualizarEstrellasVisualmente(calificacionSeleccionada, true);

      if (badgeRating) {
        badgeRating.textContent = `${calificacionSeleccionada} ${
          calificacionSeleccionada === 1 ? "estrella" : "estrellas"
        }`;
        badgeRating.className = "badge bg-success";
      }
    });
  });

  // Restaurar calificación seleccionada al salir del área
  const starContainer = document.querySelector(".star-rating");
  if (starContainer) {
    starContainer.addEventListener("mouseleave", function () {
      actualizarEstrellasVisualmente(calificacionSeleccionada, true);
    });
  }

  // Contador de caracteres para el comentario
  if (textarea && charCount) {
    textarea.addEventListener("input", function () {
      const length = this.value.length;
      charCount.textContent = length;

      // Cambiar color según la longitud
      if (length < 10) {
        charCount.className = "form-text text-end text-danger";
      } else if (length < 20) {
        charCount.className = "form-text text-end text-warning";
      } else {
        charCount.className = "form-text text-end text-success";
      }
    });
  }

  // Configurar envío del formulario
  if (btnEnviar) {
    btnEnviar.addEventListener("click", enviarResena);
  }

  console.log("✅ Formulario de reseñas inicializado correctamente");
}

/**
 * Actualiza la apariencia visual de las estrellas
 */
function actualizarEstrellasVisualmente(rating, isPermanent = false) {
  const estrellas = document.querySelectorAll(".star-rating i");

  estrellas.forEach((estrella) => {
    const estrellaRating = parseInt(estrella.getAttribute("data-rating"));

    if (estrellaRating <= rating) {
      estrella.classList.remove("bi-star", "text-muted");
      estrella.classList.add("bi-star-fill", "text-warning");
    } else {
      if (isPermanent) {
        estrella.classList.remove("bi-star-fill", "text-warning");
        estrella.classList.add("bi-star", "text-muted");
      } else {
        // Durante hover, mantener el color
        estrella.classList.remove("bi-star-fill");
        estrella.classList.add("bi-star");
      }
    }
  });
}

// =============================================
// GESTIÓN DE ENVÍO Y ELIMINACIÓN DE RESEÑAS
// =============================================

/**
 * Envía una nueva reseña al servidor
 */
async function enviarResena() {
  // Validar que el usuario esté logueado
  if (!usuarioEstaLogueado()) {
    mostrarError(
      "Acceso requerido",
      "Debes iniciar sesión para escribir una reseña"
    );
    return;
  }

  const comentarioInput = document.getElementById("comentario-resena");
  const comentario = comentarioInput ? comentarioInput.value.trim() : "";

  // Validaciones
  if (calificacionSeleccionada === 0) {
    mostrarError(
      "Calificación requerida",
      "Por favor selecciona una calificación con las estrellas"
    );
    return;
  }

  if (!comentario) {
    mostrarError(
      "Comentario requerido",
      "Por favor escribe tu opinión sobre el producto"
    );
    return;
  }

  if (comentario.length < 10) {
    mostrarError(
      "Comentario muy corto",
      "Tu comentario debe tener al menos 10 caracteres"
    );
    return;
  }

  if (comentario.length > 500) {
    mostrarError(
      "Comentario muy largo",
      "Tu comentario no puede exceder los 500 caracteres"
    );
    return;
  }

  // Validar que tengamos el ID del producto
  if (!productoId) {
    mostrarError(
      "Error",
      "No se pudo identificar el producto. Por favor recarga la página."
    );
    return;
  }

  // Preparar interfaz para envío
  const btnEnviar = document.getElementById("btn-enviar-resena");
  const originalText = btnEnviar.innerHTML;
  btnEnviar.innerHTML =
    '<i class="bi bi-hourglass-split me-2"></i>Publicando...';
  btnEnviar.disabled = true;

  try {
    console.log("📤 Enviando reseña:", {
      productoId,
      calificacionSeleccionada,
      comentario,
    });

    const headers = agregarHeadersCSRF({
      "Content-Type": "application/json",
    });

    const response = await fetch("/api/resenas", {
      method: "POST",
      credentials: "same-origin",
      headers: headers,
      body: JSON.stringify({
        productoId: parseInt(productoId),
        calificacion: parseInt(calificacionSeleccionada),
        comentario: comentario,
      }),
    });

    const result = await response.json();
    console.log("📥 Respuesta del servidor:", result);

    if (response.ok && result.success) {
      mostrarExito(
        "¡Gracias por tu opinión!",
        result.mensaje || "Tu reseña ha sido enviada para moderación"
      );
      resetearFormulario();

      // Recargar reseñas después de un breve delay
      setTimeout(() => {
        cargarResenas();
      }, 1500);
    } else {
      throw new Error(
        result.mensaje || "Error del servidor al publicar la reseña"
      );
    }
  } catch (error) {
    console.error("❌ Error al enviar reseña:", error);
    mostrarError(
      "Error al publicar",
      error.message ||
        "Ocurrió un error al publicar tu reseña. Intenta nuevamente."
    );
  } finally {
    // Restaurar estado del botón
    btnEnviar.innerHTML = originalText;
    btnEnviar.disabled = false;
  }
}

/**
 * Restablece el formulario de reseña
 */
function resetearFormulario() {
  const comentarioInput = document.getElementById("comentario-resena");
  const charCount = document.getElementById("char-count");
  const badgeRating = document.getElementById("selected-rating");

  // Limpiar campos
  if (comentarioInput) comentarioInput.value = "";
  if (charCount) {
    charCount.textContent = "0";
    charCount.className = "form-text text-end text-muted";
  }

  // Restablecer calificación
  calificacionSeleccionada = 0;
  actualizarEstrellasVisualmente(0, true);

  // Actualizar badge
  if (badgeRating) {
    badgeRating.textContent = "Selecciona una calificación";
    badgeRating.className = "badge bg-warning text-dark";
  }

  // Ocultar formulario
  if (collapseInstance) {
    collapseInstance.hide();
  }
}

/**
 * Elimina una reseña del usuario actual
 */
async function eliminarResena(id) {
  if (!id) {
    mostrarError("Error", "ID de reseña no válido");
    return;
  }

  // Confirmación antes de eliminar
  const confirmacion = await mostrarConfirmacion(
    "¿Eliminar reseña?",
    "Esta acción no se puede deshacer. ¿Estás seguro?",
    "warning"
  );

  if (!confirmacion) return;

  try {
    const headers = agregarHeadersCSRF({
      "Content-Type": "application/json",
    });

    const response = await fetch(`/api/resenas/${id}`, {
      method: "DELETE",
      credentials: "same-origin",
      headers: headers,
    });

    if (response.ok) {
      mostrarExito(
        "Reseña eliminada",
        "Tu reseña ha sido eliminada correctamente"
      );

      // Recargar después de un breve delay
      setTimeout(() => {
        cargarResenas();
      }, 1000);
    } else {
      const errorText = await response.text();
      throw new Error(errorText || "Error del servidor al eliminar la reseña");
    }
  } catch (error) {
    console.error("❌ Error al eliminar reseña:", error);
    mostrarError("Error", error.message || "No se pudo eliminar la reseña");
  }
}

// =============================================
// FUNCIONES DE UTILIDAD
// =============================================

/**
 * Verifica si el usuario está logueado
 */
function usuarioEstaLogueado() {
  return window.usuarioActual && window.usuarioActual.id;
}

/**
 * Obtiene el nombre del usuario actual
 */
function obtenerUsuarioActual() {
  if (window.usuarioActual && window.usuarioActual.nombre) {
    return window.usuarioActual.nombre;
  }
  return (
    sessionStorage.getItem("usuarioNombre") ||
    localStorage.getItem("usuarioNombre") ||
    "Usuario"
  );
}

/**
 * Muestra un mensaje de error
 */
function mostrarError(titulo, mensaje) {
  if (typeof Swal !== "undefined") {
    Swal.fire({
      icon: "error",
      title: titulo,
      text: mensaje,
      confirmButtonColor: "#dc3545",
      confirmButtonText: "Entendido",
    });
  } else {
    alert(`❌ ${titulo}\n${mensaje}`);
  }
}

/**
 * Muestra un mensaje de éxito
 */
function mostrarExito(titulo, mensaje) {
  if (typeof Swal !== "undefined") {
    Swal.fire({
      icon: "success",
      title: titulo,
      text: mensaje,
      timer: 3000,
      timerProgressBar: true,
      showConfirmButton: false,
    });
  } else {
    alert(`✅ ${titulo}\n${mensaje}`);
  }
}

/**
 * Muestra diálogo de confirmación
 */
async function mostrarConfirmacion(titulo, texto, icono = "warning") {
  if (typeof Swal !== "undefined") {
    const result = await Swal.fire({
      icon: icono,
      title: titulo,
      text: texto,
      showCancelButton: true,
      confirmButtonText: "Sí, continuar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc3545",
      cancelButtonColor: "#6c757d",
    });
    return result.isConfirmed;
  } else {
    return confirm(`${titulo}\n${texto}`);
  }
}

/**
 * Maneja errores durante la carga de reseñas
 */
function manejarErrorCargaResenas(error) {
  const loading = document.getElementById("loading-resenas");
  const noResenas = document.getElementById("no-resenas");
  const container = document.getElementById("resenas-container");

  if (loading) loading.classList.add("d-none");
  if (noResenas) noResenas.classList.remove("d-none");

  if (container) {
    container.innerHTML = `
            <div class="alert alert-danger text-center">
                <i class="bi bi-exclamation-triangle me-2"></i>
                Error al cargar las reseñas. 
                <button class="btn btn-sm btn-outline-danger ms-2" onclick="cargarResenas()">
                    Reintentar
                </button>
            </div>
        `;
  }
}

/**
 * Muestra error específico
 */
function mostrarErrorResenas(mensaje) {
  const container = document.getElementById("resenas-container");
  if (container) {
    container.innerHTML = `
            <div class="alert alert-warning text-center">
                <i class="bi bi-info-circle me-2"></i>
                ${mensaje}
            </div>
        `;
  }
}

/**
 * Escapa caracteres HTML para prevenir XSS
 */
function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// =============================================
// EXPORTACIÓN PARA USO GLOBAL
// =============================================

// Hacer funciones disponibles globalmente
window.cargarResenas = cargarResenas;
window.eliminarResena = eliminarResena;
window.obtenerProductoId = obtenerProductoId;
