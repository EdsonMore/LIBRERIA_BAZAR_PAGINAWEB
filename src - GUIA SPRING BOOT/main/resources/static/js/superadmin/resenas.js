// src/main/resources/static/js/superadmin/resenas.js

/**
 * Obtiene el token CSRF de los meta tags
 */
function obtenerTokenCSRF() {
  // Intentar primero con los nombres estándar de Thymeleaf
  let token = document
    .querySelector('meta[name="_csrf"]')
    ?.getAttribute("content");
  let header = document
    .querySelector('meta[name="_csrf_header"]')
    ?.getAttribute("content");

  // Si no se encuentran, intentar con nombres alternativos
  if (!token) {
    token = document
      .querySelector('meta[name="csrf-token"]')
      ?.getAttribute("content");
  }
  if (!header) {
    header = document
      .querySelector('meta[name="csrf-header"]')
      ?.getAttribute("content");
  }

  // Valor por defecto para el header si no se encuentra
  if (!header) {
    header = "X-CSRF-TOKEN";
  }

  console.log("🔐 CSRF detectado:", {
    token: token ? token.substring(0, 20) + "..." : "NO ENCONTRADO",
    header,
  });

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

class ResenaManager {
  constructor() {
    this.resenas = [];
    this.resenasFiltradas = [];
    this.init();
  }

  init() {
    this.cargarResenas();
    this.inicializarEventos();
  }

  async cargarResenas() {
    try {
      const response = await fetch("/superAdmin/resenas/obtener");
      if (!response.ok) throw new Error("Error al cargar reseñas");

      const data = await response.json();
      this.resenas = data.resenas;
      this.resenasFiltradas = [...this.resenas];

      this.actualizarEstadisticas(data);
      this.renderizarResenas();
    } catch (error) {
      console.error("Error al cargar reseñas:", error);
      this.mostrarError("No se pudieron cargar las reseñas");
    }
  }

  inicializarEventos() {
    // Filtrado por estado
    const filterRadios = document.querySelectorAll(
      'input[name="estado-filter"]'
    );
    filterRadios.forEach((radio) => {
      radio.addEventListener("change", () => this.aplicarFiltros());
    });

    // Búsqueda en tiempo real
    const searchInput = document.getElementById("search-resena");
    if (searchInput) {
      searchInput.addEventListener("input", () => this.aplicarFiltros());
    }
  }

  aplicarFiltros() {
    const estadoSeleccionado =
      document
        .querySelector('input[name="estado-filter"]:checked')
        ?.id.replace("filter-", "") || "all";
    const busqueda =
      document.getElementById("search-resena")?.value.toLowerCase() || "";

    this.resenasFiltradas = this.resenas.filter((resena) => {
      // Filtro por estado
      let coincideEstado = true;
      if (estadoSeleccionado !== "all") {
        coincideEstado = resena.estado.toLowerCase() === estadoSeleccionado;
      }

      // Filtro por búsqueda
      let coincideBusqueda = true;
      if (busqueda) {
        const textoResena = JSON.stringify(resena).toLowerCase();
        coincideBusqueda = textoResena.includes(busqueda);
      }

      return coincideEstado && coincideBusqueda;
    });

    this.renderizarResenas();
  }

  renderizarResenas() {
    const contenedor = document.querySelector(".resenas-container");
    if (!contenedor) return;

    if (this.resenasFiltradas.length === 0) {
      contenedor.innerHTML = `
        <div class="text-center py-5">
          <i class="bi bi-chat-square-text display-1 text-muted mb-3"></i>
          <h4 class="text-muted">No hay reseñas para mostrar</h4>
          <p class="text-muted">Intenta ajustar tus filtros de búsqueda.</p>
        </div>
      `;
      return;
    }

    contenedor.innerHTML = this.resenasFiltradas
      .map((resena) => this.generarTarjetaResena(resena))
      .join("");

    // Reasignar eventos a los botones
    this.reasignarEventosBotones();
  }

  generarTarjetaResena(resena) {
    const estadoClase = resena.estado.toLowerCase();
    const estadoBadge = this.obtenerBadgeEstado(resena.estado);
    const estrellas = this.generarEstrellas(resena.calificacion);
    const fechaFormato = this.formatearFecha(resena.fecha);

    return `
      <div class="review-card mb-4 p-3 rounded ${estadoClase}" data-id="${
      resena.id
    }">
        <div class="row">
          <div class="col-md-8">
            <!-- Calificación -->
            <div class="d-flex align-items-center mb-2">
              <div class="star-rating me-3">
                ${estrellas}
              </div>
              <span class="badge bg-primary">
                ${resena.calificacion} estrellas
              </span>
            </div>

            <!-- Usuario -->
            <h6 class="mb-2 fw-bold">${this.escaparHTML(
              resena.usuarioNombre
            )}</h6>

            <!-- Comentario -->
            <div class="comentario-text mb-3">
              <p class="mb-0">${this.escaparHTML(resena.comentario)}</p>
            </div>

            <!-- Información adicional -->
            <div class="d-flex flex-wrap gap-2 text-muted small">
              <span>
                <i class="bi bi-calendar me-1"></i>
                <span>${fechaFormato}</span>
              </span>
              <span>•</span>
              <span>
                <i class="bi bi-box me-1"></i>
                <span>${this.escaparHTML(resena.productoNombre)}</span>
              </span>
            </div>
          </div>

          <div class="col-md-4">
            <div class="d-flex flex-column h-100 justify-content-between">
              <!-- Estado -->
              <div class="text-end mb-3">
                ${estadoBadge}
              </div>

              <!-- Botones de acción -->
              <div class="d-flex gap-2 w-100">
                <button 
                  class="btn btn-success btn-sm flex-fill btn-aprobar"
                  data-id="${resena.id}"
                  data-usuario="${this.escaparHTML(resena.usuarioNombre)}"
                  ${resena.estado === "APROBADA" ? "disabled" : ""}
                >
                  <i class="bi bi-check-lg"></i> Aprobar
                </button>

                <button 
                  class="btn btn-danger btn-sm flex-fill btn-rechazar"
                  data-id="${resena.id}"
                  data-usuario="${this.escaparHTML(resena.usuarioNombre)}"
                  ${resena.estado === "RECHAZADA" ? "disabled" : ""}
                >
                  <i class="bi bi-x-lg"></i> Rechazar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  reasignarEventosBotones() {
    document.addEventListener("click", (e) => {
      if (e.target.closest(".btn-aprobar")) {
        const button = e.target.closest(".btn-aprobar");
        this.cambiarEstado(
          button.getAttribute("data-id"),
          "APROBADA",
          button.getAttribute("data-usuario")
        );
      }

      if (e.target.closest(".btn-rechazar")) {
        const button = e.target.closest(".btn-rechazar");
        this.cambiarEstado(
          button.getAttribute("data-id"),
          "RECHAZADA",
          button.getAttribute("data-usuario")
        );
      }
    });
  }

  cambiarEstado(id, estado, usuario) {
    const actionText = estado === "APROBADA" ? "APROBAR" : "RECHAZAR";
    const actionColor = estado === "APROBADA" ? "#28a745" : "#dc3545";

    Swal.fire({
      title: `¿${actionText} reseña?`,
      text: `¿Estás seguro de ${actionText.toLowerCase()} la reseña de "${usuario}"?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: actionColor,
      confirmButtonText: `Sí, ${actionText.toLowerCase()}`,
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        this.enviarCambioEstado(id, estado);
      }
    });
  }

  async enviarCambioEstado(id, estado) {
    try {
      console.log("📤 Enviando cambio de estado:", { id, estado });

      const { token, header } = obtenerTokenCSRF();
      console.log("🔑 Token CSRF:", {
        token: token ? "Presente" : "Ausente",
        header,
      });

      // Construir headers con CSRF en el HEADER (no en el body)
      const headers = {
        "Content-Type": "application/x-www-form-urlencoded",
      };

      // IMPORTANTE: El token CSRF va en el header HTTP
      if (token && header) {
        headers[header] = token;
      }

      // Construir datos en formato x-www-form-urlencoded (sin el token CSRF)
      const params = new URLSearchParams();
      params.append("id", id);
      params.append("estado", estado);

      const response = await fetch("/superAdmin/resenas/cambiar-estado", {
        method: "POST",
        credentials: "same-origin",
        headers: headers,
        body: params.toString(),
      });

      console.log("📥 Respuesta del servidor:", response.status);

      // Verificar si la respuesta es JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("❌ Respuesta no es JSON:", text.substring(0, 200));
        throw new Error(
          "El servidor no devolvió una respuesta válida (403 - Acceso denegado o error CSRF)"
        );
      }

      const data = await response.json();
      console.log("📦 Datos recibidos:", data);

      if (response.ok && data.success) {
        // Actualizar la reseña localmente
        const resena = this.resenas.find((r) => r.id == id);
        if (resena) {
          resena.estado = estado;
          this.aplicarFiltros();

          Swal.fire({
            title: "Éxito",
            text:
              data.message ||
              (estado === "APROBADA"
                ? "✅ Reseña aprobada exitosamente"
                : "❌ Reseña rechazada exitosamente"),
            icon: "success",
            confirmButtonText: "Aceptar",
          }).then(() => {
            this.cargarResenas(); // Recargar para obtener estadísticas actualizadas
          });
        }
      } else {
        throw new Error(data.message || "Error al cambiar estado");
      }
    } catch (error) {
      console.error("❌ Error completo:", error);
      this.mostrarError(
        "No se pudo cambiar el estado de la reseña: " + error.message
      );
    }
  }

  actualizarEstadisticas(data) {
    try {
      // Buscar los elementos de estadísticas por estructura del HTML
      // Las tarjetas tienen la clase "stats-card" con colores específicos

      // Actualizar tarjeta de pendientes (bg-warning)
      const pendientesCard = document.querySelector(
        ".card.bg-warning.bg-opacity-10"
      );
      if (pendientesCard) {
        const h3 = pendientesCard.querySelector("h3");
        if (h3) h3.textContent = data.pendientes || 0;
      }

      // Actualizar tarjeta de aprobadas (bg-success)
      const aprobadasCard = document.querySelector(
        ".card.bg-success.bg-opacity-10"
      );
      if (aprobadasCard) {
        const h3 = aprobadasCard.querySelector("h3");
        if (h3) h3.textContent = data.aprobadas || 0;
      }

      // Actualizar tarjeta de rechazadas (bg-danger)
      const rechazadasCard = document.querySelector(
        ".card.bg-danger.bg-opacity-10"
      );
      if (rechazadasCard) {
        const h3 = rechazadasCard.querySelector("h3");
        if (h3) h3.textContent = data.rechazadas || 0;
      }

      // Actualizar badge del header
      const totalBadge = document.querySelector(".badge.bg-primary");
      if (totalBadge) {
        const totalSpan = totalBadge.querySelector("span");
        if (totalSpan) totalSpan.textContent = data.resenas.length || 0;
      }
    } catch (error) {
      console.warn("Error actualizando estadísticas:", error);
      // No lanzar error, continuar con el funcionamiento normal
    }
  }

  obtenerBadgeEstado(estado) {
    const badges = {
      PENDIENTE: '<span class="badge bg-warning">PENDIENTE</span>',
      APROBADA: '<span class="badge bg-success">APROBADA</span>',
      RECHAZADA: '<span class="badge bg-danger">RECHAZADA</span>',
    };
    return badges[estado] || badges.PENDIENTE;
  }

  generarEstrellas(calificacion) {
    let estrellas = "";
    for (let i = 1; i <= 5; i++) {
      estrellas += `<i class="bi ${
        i <= calificacion ? "bi-star-fill" : "bi-star"
      } me-1"></i>`;
    }
    return estrellas;
  }

  formatearFecha(fechaString) {
    try {
      const fecha = new Date(fechaString);
      return fecha.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return fechaString;
    }
  }

  escaparHTML(texto) {
    const div = document.createElement("div");
    div.textContent = texto;
    return div.innerHTML;
  }

  mostrarError(mensaje) {
    Swal.fire({
      title: "Error",
      text: mensaje,
      icon: "error",
      confirmButtonText: "Aceptar",
    });
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", function () {
  window.resenaManager = new ResenaManager();
});
