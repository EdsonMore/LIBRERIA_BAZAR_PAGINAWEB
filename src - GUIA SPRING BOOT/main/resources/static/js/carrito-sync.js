// carrito-sync.js - Sincronización automática entre localStorage y servidor

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
 * Inicialización del sistema de sincronización
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 Sistema de sincronización iniciado');
    
    // Verificar estado de autenticación
    const isLoggedIn = document.getElementById('userDropdown') !== null;
    
    if (isLoggedIn) {
        console.log('👤 Usuario autenticado detectado');
        limpiarLocalStorageParaUsuarioAutenticado();
    } else {
        console.log('👤 Usuario anónimo detectado');
        
        // Si estamos en la página del carrito Y NO hay items en Thymeleaf
        if (window.location.pathname === '/carrito') {
            const esCarritoVacio = document.querySelector('.bi-cart-x') !== null;
            
            if (esCarritoVacio) {
                console.log('📦 Verificando localStorage para renderizar carrito...');
                const carritoLocal = obtenerCarritoLocal();
                
                if (carritoLocal && carritoLocal.length > 0) {
                    console.log(`✅ Encontrados ${carritoLocal.length} productos en localStorage`);
                    // Esperar a que carrito-mejorado.js se cargue
                    setTimeout(() => {
                        if (typeof window.renderizarCarritoAnonimo === 'function') {
                            window.renderizarCarritoAnonimo();
                        }
                    }, 500);
                }
            }
        }
    }
    
    // Actualizar contador al cargar
    actualizarContadorCarrito();
});

/**
 * Limpia el localStorage cuando el usuario está autenticado
 */
function limpiarLocalStorageParaUsuarioAutenticado() {
    const carritoLocal = localStorage.getItem('carritoAnonimo');
    
    if (carritoLocal) {
        console.log('🗑️ Limpiando localStorage (usuario autenticado)');
        localStorage.removeItem('carritoAnonimo');
    }
}

/**
 * Actualiza el contador del carrito en el navbar
 */
async function actualizarContadorCarrito() {
    const isLoggedIn = document.getElementById('userDropdown') !== null;
    
    try {
        if (!isLoggedIn) {
            // Usuario anónimo: contar desde localStorage
            const carrito = obtenerCarritoLocal();
            const cantidad = carrito.reduce((sum, item) => sum + (item.cantidad || 0), 0);
            actualizarBadgeCarrito(cantidad);
            return;
        }
        
        // Usuario autenticado: obtener del servidor
        const response = await fetch('/api/carrito/cantidad', {
            credentials: 'same-origin'
        });
        
        if (response.ok) {
            const cantidad = await response.json();
            actualizarBadgeCarrito(cantidad);
        } else {
            actualizarBadgeCarrito(0);
        }
    } catch (error) {
        console.error('❌ Error al actualizar contador:', error);
        actualizarBadgeCarrito(0);
    }
}

/**
 * Actualiza visualmente el badge del carrito
 */
function actualizarBadgeCarrito(cantidad) {
    const badge = document.getElementById('carrito-count');
    
    if (badge) {
        badge.textContent = cantidad;
        badge.style.display = cantidad > 0 ? 'inline-block' : 'none';
    }
}

/**
 * Obtiene el carrito del localStorage
 */
function obtenerCarritoLocal() {
    try {
        const raw = localStorage.getItem('carritoAnonimo');
        return raw ? JSON.parse(raw) : [];
    } catch (error) {
        console.error('❌ Error al leer localStorage:', error);
        return [];
    }
}

/**
 * Función para limpiar el carrito (global)
 */
async function limpiarCarrito() {
    const result = await Swal.fire({
        title: '¿Vaciar carrito?',
        text: 'Se eliminarán todos los productos',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, vaciar',
        cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    const isLoggedIn = document.getElementById('userDropdown') !== null;

    try {
        if (!isLoggedIn) {
            // Usuario anónimo: limpiar localStorage
            localStorage.removeItem('carritoAnonimo');
            
            Swal.fire({
                title: '¡Carrito limpiado!',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            }).then(() => {
                window.location.reload();
            });
            
            return;
        }

        // Usuario autenticado: llamar al servidor
        const headers = agregarHeadersCSRF({
            'Content-Type': 'application/json'
        });

        const response = await fetch('/api/carrito/limpiar', {
            method: 'DELETE',
            credentials: 'same-origin',
            headers: headers
        });

        const data = await response.json();

        if (data.success) {
            Swal.fire({
                title: '¡Carrito limpiado!',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            }).then(() => {
                window.location.reload();
            });
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('❌ Error al limpiar carrito:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo limpiar el carrito'
        });
    }
}

/**
 * Sincroniza el carrito local con el servidor y abre la página del carrito
 */
async function syncAndOpenCarrito() {
    const isLoggedIn = document.getElementById('userDropdown') !== null;
    
    // Si está autenticado, redirigir directamente
    if (isLoggedIn) {
        window.location.href = '/carrito';
        return;
    }
    
    // Usuario anónimo: verificar si hay productos en localStorage
    const carritoLocal = obtenerCarritoLocal();
    
    if (carritoLocal.length > 0) {
        console.log(`📦 ${carritoLocal.length} productos en carrito local`);
        
        // Sincronizar con la sesión del servidor (para usuarios anónimos)
        try {
            for (const item of carritoLocal) {
                const headers = agregarHeadersCSRF({
                    'Content-Type': 'application/json'
                });

                await fetch(`/api/carrito/agregar?cantidad=${item.cantidad || 1}&productoId=${parseInt(item.id)}`, {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: headers
                });
            }
            
            console.log('✅ Carrito sincronizado con servidor');
        } catch (error) {
            console.warn('⚠️ No se pudo sincronizar con servidor:', error);
        }
    }
    
    // Redirigir al carrito
    window.location.href = '/carrito';
}

// Exportar funciones globalmente
window.limpiarCarrito = limpiarCarrito;
window.syncAndOpenCarrito = syncAndOpenCarrito;
window.actualizarContadorCarrito = actualizarContadorCarrito;