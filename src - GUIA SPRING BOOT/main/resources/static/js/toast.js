// toast-utils.js - Sistema de notificaciones toast

/**
 * Muestra un mensaje toast usando SweetAlert2
 * @param {string} mensaje - El mensaje a mostrar
 * @param {string} tipo - Tipo de alerta: 'success', 'error', 'warning', 'info'
 */
function mostrarToast(mensaje, tipo = 'info') {
    const iconos = {
        success: 'success',
        error: 'error',
        warning: 'warning',
        info: 'info'
    };

    const colores = {
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
    };

    // Verificar si SweetAlert2 está disponible
    if (typeof Swal === 'undefined') {
        console.warn('SweetAlert2 no está cargado. Mensaje:', mensaje);
        alert(mensaje);
        return;
    }

    Swal.fire({
        toast: true,
        position: 'top-end',
        icon: iconos[tipo] || 'info',
        title: mensaje,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        iconColor: colores[tipo] || '#17a2b8',
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });
}

/**
 * Muestra una confirmación con SweetAlert2
 * @param {string} titulo - Título de la confirmación
 * @param {string} texto - Texto descriptivo
 * @param {string} textoConfirmar - Texto del botón de confirmar
 * @returns {Promise<boolean>} - True si el usuario confirmó
 */
function mostrarConfirmacion(titulo, texto, textoConfirmar = 'Sí, continuar') {
    return Swal.fire({
        title: titulo,
        text: texto,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: textoConfirmar,
        cancelButtonText: 'Cancelar',
        reverseButtons: true
    }).then((result) => result.isConfirmed);
}

/**
 * Muestra un mensaje de éxito con animación
 * @param {string} titulo - Título del mensaje
 * @param {string} texto - Texto descriptivo (opcional)
 */
function mostrarExito(titulo, texto = '') {
    Swal.fire({
        icon: 'success',
        title: titulo,
        text: texto,
        timer: 2000,
        showConfirmButton: false
    });
}

/**
 * Muestra un mensaje de error con detalles
 * @param {string} titulo - Título del error
 * @param {string} texto - Descripción del error
 */
function mostrarError(titulo, texto) {
    Swal.fire({
        icon: 'error',
        title: titulo,
        text: texto,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#dc3545'
    });
}

/**
 * Muestra un loading mientras se procesa algo
 * @param {string} titulo - Título del loading
 * @param {string} texto - Texto descriptivo
 */
function mostrarLoading(titulo = 'Procesando...', texto = 'Por favor espera') {
    Swal.fire({
        title: titulo,
        html: texto,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
}

/**
 * Cierra el loading actual
 */
function cerrarLoading() {
    Swal.close();
}

// Exportar funciones al objeto window para uso global
window.mostrarToast = mostrarToast;
window.mostrarConfirmacion = mostrarConfirmacion;
window.mostrarExito = mostrarExito;
window.mostrarError = mostrarError;
window.mostrarLoading = mostrarLoading;
window.cerrarLoading = cerrarLoading;