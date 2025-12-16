// script-general.js - Funcionalidades globales compartidas

/**
 * ============================================
 * UTILIDADES GENERALES
 * ============================================
 */

/**
 * Muestra notificaciones toast con SweetAlert2 o Bootstrap
 */
function mostrarToast(mensaje, tipo = "info") {
  // Intentar usar SweetAlert2 si está disponible
  if (typeof Swal !== "undefined") {
    const Toast = Swal.mixin({
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener("mouseenter", Swal.stopTimer);
        toast.addEventListener("mouseleave", Swal.resumeTimer);
      },
    });

    const iconMap = {
      success: "success",
      error: "error",
      warning: "warning",
      info: "info",
    };

    Toast.fire({
      icon: iconMap[tipo] || "info",
      title: mensaje,
    });
    return;
  }

  // Fallback a Bootstrap Toast
  let toastContainer = document.getElementById("toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toast-container";
    toastContainer.className = "toast-container position-fixed top-0 end-0 p-3";
    toastContainer.style.zIndex = "1055";
    document.body.appendChild(toastContainer);
  }

  const toastId = "toast-" + Date.now();
  const bgColor = getBgColorForToast(tipo);
  const icon = getIconForToast(tipo);

  const toastHTML = `
    <div id="${toastId}" class="toast align-items-center text-white ${bgColor} border-0" role="alert">
      <div class="d-flex">
        <div class="toast-body">
          <i class="bi ${icon} me-2"></i>${mensaje}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    </div>
  `;

  toastContainer.insertAdjacentHTML("beforeend", toastHTML);

  const toastElement = document.getElementById(toastId);
  const toast = new bootstrap.Toast(toastElement);
  toast.show();

  toastElement.addEventListener("hidden.bs.toast", () => {
    toastElement.remove();
  });
}

function getBgColorForToast(tipo) {
  const colors = {
    success: "bg-success",
    error: "bg-danger",
    warning: "bg-warning",
    info: "bg-primary",
  };
  return colors[tipo] || "bg-primary";
}

function getIconForToast(tipo) {
  const icons = {
    success: "bi-check-circle",
    error: "bi-x-circle",
    warning: "bi-exclamation-triangle",
    info: "bi-info-circle",
  };
  return icons[tipo] || "bi-info-circle";
}

/**
 * Función debounce para optimizar eventos
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * ============================================
 * ANIMACIONES Y EFECTOS VISUALES
 * ============================================
 */

/**
 * Anima las tarjetas al cargar la página
 */
function animateCards() {
  const cards = document.querySelectorAll(".card");
  cards.forEach((card, index) => {
    card.style.opacity = "0";
    card.style.transform = "translateY(20px)";
    card.style.transition = "opacity 0.5s ease, transform 0.5s ease";

    setTimeout(() => {
      card.style.opacity = "1";
      card.style.transform = "translateY(0)";
    }, 100 * index);
  });
}

/**
 * Inicializa el botón de volver arriba
 */
function initBackToTopButton() {
  const backToTopBtn = document.getElementById("backToTopBtn");
  if (!backToTopBtn) return;

  window.addEventListener("scroll", function () {
    if (window.scrollY > 300) {
      backToTopBtn.style.display = "block";
    } else {
      backToTopBtn.style.display = "none";
    }
  });

  backToTopBtn.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

/**
 * ============================================
 * VERIFICACIÓN DE EDAD
 * ============================================
 */

/**
 * Modal de bienvenida a Tu Bazar Plus
 */
function initWelcomeModal() {
  // Si ya vio el modal de bienvenida, no mostrar
  if (localStorage.getItem("welcomeShown")) {
    return;
  }

  const welcomeModal = document.getElementById("welcomeModal");
  if (!welcomeModal) return;

  const modal = new bootstrap.Modal(welcomeModal);
  modal.show();

  const btnContinuar = document.getElementById("btnContinuar");

  if (btnContinuar) {
    btnContinuar.addEventListener("click", function () {
      localStorage.setItem("welcomeShown", "true");
      modal.hide();
    });
  }
}

/**
 * ============================================
 * INICIALIZACIÓN
 * ============================================
 */

document.addEventListener("DOMContentLoaded", function () {
  console.log("script-general.js cargado correctamente");

  // Inicializar funcionalidades globales
  animateCards();
  initBackToTopButton();
  initWelcomeModal();
});

/**
 * ============================================
 * EXPORTAR FUNCIONES GLOBALES
 * ============================================
 */

// Hacer funciones disponibles globalmente
window.mostrarToast = mostrarToast;
window.debounce = debounce;
window.animateCards = animateCards;