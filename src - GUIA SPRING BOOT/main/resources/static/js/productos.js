// productos.js - Sistema completo de gestión y visualización de productos
// Responsable: filtrado, paginación y efectos visuales de la interfaz de productos

/**
 * ============================================================================
 * UTILIDADES CSRF
 * ============================================================================
 */

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
 * ============================================================================
 * CONFIGURACIÓN Y CONSTANTES
 * ============================================================================
 */

// Número máximo de productos a mostrar por página
const PRODUCTOS_POR_PAGINA = 12;

/**
 * ============================================================================
 * ESTADO GLOBAL DE LA APLICACIÓN
 * ============================================================================
 */

// Página actual que está viendo el usuario
let paginaActual = 1;

// Array que almacena los productos que pasan los filtros aplicados
let productosFiltrados = [];

/**
 * ============================================================================
 * INICIALIZACIÓN DE LA APLICACIÓN
 * ============================================================================
 */

// Esperar a que el DOM esté completamente cargado antes de inicializar
document.addEventListener('DOMContentLoaded', function () {
    console.log('Sistema de productos inicializado correctamente');
    inicializar();
});

/**
 * Función principal de inicialización
 * Configura todos los sistemas necesarios para el funcionamiento
 */
function inicializar() {
    // Preparar sistema de filtros por categoría
    inicializarFiltrosCategoria();

    // Configurar efectos visuales y animaciones
    inicializarEfectosVisuales();

    // Establecer listeners para eventos de usuario
    setupEventListeners();

    // Configurar listener para cambios de categorías desde otras pestañas
    configurarListenerCambiosCategorias();

    // Estado inicial: todos los productos están disponibles
    productosFiltrados = Array.from(document.querySelectorAll('.producto-card'));

    // Aplicar animaciones de entrada
    aplicarAnimacionesIniciales();

    // Ejecutar filtrado inicial
    applyFilters();
}

/**
 * Configura un listener para detectar cambios de categorías
 * desde la página de administración usando BroadcastChannel
 */
function configurarListenerCambiosCategorias() {
    try {
        if (typeof BroadcastChannel !== 'undefined') {
            const channel = new BroadcastChannel('categorias-updates');
            
            channel.onmessage = (event) => {
                console.log('📢 Cambio de categorías detectado:', event.data.tipo);
                
                // Recargar las categorías dinámicamente
                setTimeout(() => {
                    const categoriasContainer = document.getElementById('categorias-filtro');
                    if (categoriasContainer) {
                        console.log('🔄 Actualizando filtros de categorías...');
                        inicializarFiltrosCategoria();
                    }
                }, 500);
            };
            
            console.log('✅ Listener de cambios de categorías configurado');
        } else {
            console.warn('BroadcastChannel no disponible - actualizaciones en tiempo real deshabilitadas');
        }
    } catch (error) {
        console.warn('No se pudo configurar listener de cambios:', error);
    }
}

/**
 * ============================================================================
 * SISTEMA DE FILTRADO POR CATEGORÍAS
 * ============================================================================
 */

/**
 * Construye dinámicamente la interfaz de filtros por categoría
 * Carga las categorías activas desde la API para mantener sincronización
 */
function inicializarFiltrosCategoria() {
    const categoriasContainer = document.getElementById('categorias-filtro');
    if (!categoriasContainer) return;

    // Mostrar estado de carga
    categoriasContainer.innerHTML = '<div class="text-muted small"><i class="bi bi-hourglass-split"></i> Cargando categorías...</div>';

    // Cargar categorías desde la API
    fetch('/api/categorias/activas')
        .then(response => {
            if (!response.ok) throw new Error('Error al cargar categorías');
            return response.json();
        })
        .then(categorias => {
            // Limpiar contenedor
            categoriasContainer.innerHTML = '';

            // Mostrar mensaje si no hay categorías disponibles
            if (!categorias || categorias.length === 0) {
                categoriasContainer.innerHTML = '<div class="text-muted small">No hay categorías disponibles</div>';
                return;
            }

            // Generar un checkbox por cada categoría
            categorias.forEach(categoria => {
                const div = document.createElement('div');
                div.className = 'form-check';
                const checkboxId = `cat-${categoria.nombre.toLowerCase().replace(/\s+/g, '-')}`;
                div.innerHTML = `
                    <input class="form-check-input categoria-checkbox" type="checkbox" 
                           id="${checkboxId}" 
                           value="${categoria.nombre}"
                           data-categoria-id="${categoria.id}">
                    <label class="form-check-label" for="${checkboxId}">
                        ${categoria.nombre}
                    </label>
                `;
                categoriasContainer.appendChild(div);
            });

            // Vincular eventos a los checkboxes
            categoriasContainer.querySelectorAll('.categoria-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', applyFilters);
            });

            // Ejecutar filtrado inicial
            applyFilters();
        })
        .catch(error => {
            console.error('Error al cargar categorías dinámicamente:', error);
            categoriasContainer.innerHTML = '<div class="text-danger small">Error al cargar categorías</div>';
        });
}

/**
 * ============================================================================
 * SISTEMA DE EFECTOS VISUALES Y ANIMACIONES
 * ============================================================================
 */

/**
 * Aplica efectos de hover y interactividad a las tarjetas de producto
 * Mejora la experiencia de usuario con feedback visual
 */
function inicializarEfectosVisuales() {
    const productCards = document.querySelectorAll('.producto-card');

    productCards.forEach(card => {
        // Efecto al pasar el mouse: elevación y sombra
        card.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-5px)';
            this.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
            this.style.transition = 'all 0.3s ease';
        });

        // Restaurar estado normal al quitar el mouse
        card.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '';
        });

        // Hacer toda la tarjeta clickeable (excepto botones existentes)
        card.addEventListener('click', function (e) {
            // No interferir con clicks en botones o enlaces
            if (e.target.closest('button') || e.target.closest('a')) {
                return;
            }

            // Simular click en el botón de detalle del producto
            const detalleBtn = this.querySelector('a[href*="/producto/"]');
            if (detalleBtn) {
                detalleBtn.click();
            }
        });
    });
}

/**
 * Animación de entrada escalonada para los productos
 * Crea un efecto visual atractivo al cargar la página
 */
function aplicarAnimacionesIniciales() {
    const cards = document.querySelectorAll('.producto-card');

    cards.forEach((card, index) => {
        // Estado inicial: invisible y desplazado hacia abajo
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';

        // Animación escalonada para crear efecto de cascada
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 100 * (index % 8)); // Máximo 8 productos animados simultáneamente
    });
}

/**
 * ============================================================================
 * SISTEMA PRINCIPAL DE FILTRADO
 * ============================================================================
 */

/**
 * Recopila todos los valores actuales de los filtros
 * @returns {Object} Objeto con todos los criterios de filtrado activos
 */
function getFilterInputs() {
    return {
        // Categorías seleccionadas
        categorias: Array.from(document.querySelectorAll('#categorias-filtro input[type="checkbox"]:checked'))
            .map(cb => cb.value.toLowerCase()),

        // Filtro de disponibilidad
        onlyAvailable: document.getElementById('filterAvailable')?.checked || false,

        // Rango de precios (valores por defecto para incluir todos los productos)
        minPrice: parseFloat(document.getElementById('precioMin')?.value) || 0,
        maxPrice: parseFloat(document.getElementById('precioMax')?.value) || Infinity,

        // Término de búsqueda en nombre y descripción
        searchTerm: document.querySelector('.search-bar')?.value.toLowerCase().trim() || ''
    };
}

/**
 * Función principal de filtrado
 * Aplica todos los filtros activos y actualiza la vista
 */
function applyFilters() {
    const cards = Array.from(document.querySelectorAll('.producto-card'));
    const filters = getFilterInputs();

    // Filtrar productos según criterios activos
    productosFiltrados = cards.filter(card => {
        // Extraer datos del producto desde atributos y contenido
        const categoria = card.getAttribute('data-categoria')?.toLowerCase() || '';
        const precio = parseFloat(card.getAttribute('data-precio')) || 0;
        const disponible = card.getAttribute('data-disponible') === 'true';
        const nombre = card.querySelector('.card-title')?.textContent.toLowerCase() || '';
        const descripcion = card.querySelector('.card-text')?.textContent.toLowerCase() || '';

        let shouldShow = true;

        // Aplicar filtro de categorías (si hay alguna seleccionada)
        if (filters.categorias.length > 0 && !filters.categorias.includes(categoria)) {
            shouldShow = false;
        }

        // Filtro de disponibilidad: mostrar solo productos en stock
        if (filters.onlyAvailable && !disponible) {
            shouldShow = false;
        }

        // Filtro por rango de precio
        if (precio < filters.minPrice || precio > filters.maxPrice) {
            shouldShow = false;
        }

        // Búsqueda textual en nombre y descripción
        if (filters.searchTerm &&
            !nombre.includes(filters.searchTerm) &&
            !descripcion.includes(filters.searchTerm)) {
            shouldShow = false;
        }

        return shouldShow;
    });

    // Ordenar productos según criterio seleccionado
    ordenarProductos(productosFiltrados);

    // Reiniciar a la primera página después de filtrar
    paginaActual = 1;

    // Actualizar vista con los productos filtrados
    mostrarPaginaActual();

    // Reflejar cambios en la interfaz
    actualizarContadores();
    actualizarPaginacion();
}

/**
 * Ordena los productos según el criterio seleccionado por el usuario
 * @param {Array} productos - Array de elementos DOM de productos a ordenar
 */
function ordenarProductos(productos) {
    const sortSelect = document.getElementById('sortBy');
    if (!sortSelect) return;

    const sortBy = sortSelect.value;

    productos.sort((cardA, cardB) => {
        // Extraer datos para comparación
        const nombreA = cardA.querySelector('.card-title')?.textContent || '';
        const nombreB = cardB.querySelector('.card-title')?.textContent || '';
        const precioA = parseFloat(cardA.getAttribute('data-precio')) || 0;
        const precioB = parseFloat(cardB.getAttribute('data-precio')) || 0;
        const stockTextA = cardA.querySelector('small')?.textContent || '';
        const stockTextB = cardB.querySelector('small')?.textContent || '';
        const stockA = parseInt(stockTextA.match(/Stock: (\d+)/)?.[1] || 0);
        const stockB = parseInt(stockTextB.match(/Stock: (\d+)/)?.[1] || 0);

        // Aplicar criterio de ordenamiento seleccionado
        switch (sortBy) {
            case 'nombre-asc':
                return nombreA.localeCompare(nombreB);
            case 'nombre-desc':
                return nombreB.localeCompare(nombreA);
            case 'precio-asc':
                return precioA - precioB;
            case 'precio-desc':
                return precioB - precioA;
            case 'stock':
                return stockB - stockA; // Mayor stock primero
            default:
                return 0; // Sin ordenamiento
        }
    });
}

/**
 * ============================================================================
 * SISTEMA DE PAGINACIÓN
 * ============================================================================
 */

/**
 * Muestra solo los productos correspondientes a la página actual
 * Oculta todos los demás productos y gestiona la navegación
 */
function mostrarPaginaActual() {
    const cards = document.querySelectorAll('.producto-card');
    const inicio = (paginaActual - 1) * PRODUCTOS_POR_PAGINA;
    const fin = inicio + PRODUCTOS_POR_PAGINA;

    // Ocultar todos los productos inicialmente
    cards.forEach(card => {
        card.style.display = 'none';
        const cardContainer = card.closest('.col-6, .col-lg-3, .col-md-6, [class*="col-"]');
        if (cardContainer) {
            cardContainer.style.display = 'none';
        }
    });

    // Mostrar solo los productos de la página actual
    productosFiltrados.slice(inicio, fin).forEach(card => {
        card.style.display = 'block';
        const cardContainer = card.closest('.col-6, .col-lg-3, .col-md-6, [class*="col-"]');
        if (cardContainer) {
            cardContainer.style.display = 'block';
        }
    });

    // Scroll suave al inicio del grid cuando se cambia de página
    if (paginaActual > 1) {
        const grid = document.getElementById('productos-grid');
        if (grid) {
            setTimeout(() => {
                grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }
}

/**
 * Construye y actualiza la interfaz de paginación
 * Genera los botones de página y gestiona la navegación
 */
function actualizarPaginacion() {
    const totalPaginas = Math.ceil(productosFiltrados.length / PRODUCTOS_POR_PAGINA);
    const paginacionContainer = document.getElementById('pagination-container');
    const paginationInfo = document.getElementById('pagination-info');

    if (!paginacionContainer) return;

    // Ocultar navegación si solo hay una página
    const navPaginacion = paginacionContainer.closest('nav');
    if (navPaginacion) {
        navPaginacion.style.display = totalPaginas <= 1 ? 'none' : 'block';
    }

    // Limpiar paginación existente
    paginacionContainer.innerHTML = '';

    // Mostrar solo información si no hay paginación necesaria
    if (totalPaginas <= 1) {
        if (paginationInfo) {
            paginationInfo.textContent = `Mostrando ${productosFiltrados.length} productos`;
        }
        return;
    }

    // Botón "Anterior" - deshabilitado en primera página
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${paginaActual === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `
        <a class="page-link" href="#" aria-label="Página anterior">
            <i class="bi bi-chevron-left"></i>
        </a>
    `;
    if (paginaActual > 1) {
        prevLi.addEventListener('click', (e) => {
            e.preventDefault();
            paginaActual--;
            mostrarPaginaActual();
            actualizarPaginacion();
        });
    }
    paginacionContainer.appendChild(prevLi);

    // Generar números de página (máximo 5 visibles alrededor de la actual)
    const startPage = Math.max(1, paginaActual - 2);
    const endPage = Math.min(totalPaginas, startPage + 4);

    for (let i = startPage; i <= endPage; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === paginaActual ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        li.addEventListener('click', (e) => {
            e.preventDefault();
            paginaActual = i;
            mostrarPaginaActual();
            actualizarPaginacion();
        });
        paginacionContainer.appendChild(li);
    }

    // Botón "Siguiente" - deshabilitado en última página
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${paginaActual === totalPaginas ? 'disabled' : ''}`;
    nextLi.innerHTML = `
        <a class="page-link" href="#" aria-label="Página siguiente">
            <i class="bi bi-chevron-right"></i>
        </a>
    `;
    if (paginaActual < totalPaginas) {
        nextLi.addEventListener('click', (e) => {
            e.preventDefault();
            paginaActual++;
            mostrarPaginaActual();
            actualizarPaginacion();
        });
    }
    paginacionContainer.appendChild(nextLi);

    // Actualizar información textual de paginación
    if (paginationInfo) {
        const inicio = (paginaActual - 1) * PRODUCTOS_POR_PAGINA + 1;
        const fin = Math.min(paginaActual * PRODUCTOS_POR_PAGINA, productosFiltrados.length);
        paginationInfo.innerHTML = `
            Mostrando ${inicio}-${fin} de ${productosFiltrados.length} productos
            ${totalPaginas > 1 ? `- Página ${paginaActual} de ${totalPaginas}` : ''}
        `;
    }
}

/**
 * ============================================================================
 * ACTUALIZACIÓN DE LA INTERFAZ DE USUARIO
 * ============================================================================
 */

/**
 * Actualiza todos los contadores y mensajes de estado
 * Refleja los resultados del filtrado en la interfaz
 */
function actualizarContadores() {
    const noProductsMsg = document.getElementById('no-products-message');
    const productCounter = document.getElementById('product-count');
    const headerCounter = document.querySelector('h4.fw-bold');

    // Actualizar números en contadores
    if (productCounter) {
        productCounter.textContent = productosFiltrados.length;
    }
    if (headerCounter) {
        const totalSpan = headerCounter.querySelector('#product-count');
        if (totalSpan) {
            totalSpan.textContent = productosFiltrados.length;
        }
    }

    // Mostrar mensaje cuando no hay productos que coincidan
    if (noProductsMsg) {
        const grid = document.getElementById('productos-grid');
        if (grid) {
            grid.style.display = productosFiltrados.length === 0 ? 'none' : 'flex';
        }
        noProductsMsg.style.display = productosFiltrados.length === 0 ? 'block' : 'none';
    }
}

/**
 * ============================================================================
 * GESTIÓN DE EVENTOS Y INTERACTIVIDAD
 * ============================================================================
 */

/**
 * Configura todos los event listeners para la interactividad
 * Conecta los controles de la interfaz con las funciones correspondientes
 */
function setupEventListeners() {
    // Los filtros de categoría ya tienen sus listeners configurados dinámicamente

    // Filtro de disponibilidad (solo productos en stock)
    const availableFilter = document.getElementById('filterAvailable');
    if (availableFilter) {
        availableFilter.addEventListener('change', applyFilters);
    }

    // Filtros de precio con debounce para mejor rendimiento
    const priceInputs = document.querySelectorAll('#precioMin, #precioMax');
    priceInputs.forEach(input => {
        input.addEventListener('input', debounce(applyFilters, 500));
    });

    // Sistema de búsqueda
    const searchInput = document.querySelector('.search-bar');
    const searchButton = document.querySelector('.btn-primary');

    if (searchInput) {
        searchInput.addEventListener('input', debounce(applyFilters, 500));
    }
    if (searchButton) {
        searchButton.addEventListener('click', applyFilters);
    }

    // Selector de ordenamiento
    const sortSelect = document.getElementById('sortBy');
    if (sortSelect) {
        sortSelect.addEventListener('change', applyFilters);
    }

    // Botón para limpiar todos los filtros
    const clearFiltersBtn = document.getElementById('clearFilters');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', limpiarFiltros);
    }
}

/**
 * Restablece todos los filtros a su estado inicial
 * Limpia selecciones y muestra todos los productos
 */
function limpiarFiltros() {
    // Desmarcar todas las categorías
    document.querySelectorAll('#categorias-filtro input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });

    // Restablecer filtro de disponibilidad
    const availableFilter = document.getElementById('filterAvailable');
    if (availableFilter) availableFilter.checked = false;

    // Limpiar rangos de precio
    const precioMin = document.getElementById('precioMin');
    const precioMax = document.getElementById('precioMax');
    if (precioMin) precioMin.value = '';
    if (precioMax) precioMax.value = '';

    // Limpiar campo de búsqueda
    const searchInput = document.querySelector('.search-bar');
    if (searchInput) searchInput.value = '';

    // Restablecer ordenamiento por defecto
    const sortSelect = document.getElementById('sortBy');
    if (sortSelect) sortSelect.value = 'nombre-asc';

    // Aplicar filtros en estado limpio
    applyFilters();
}

/**
 * ============================================================================
 * FUNCIONALIDAD GLOBAL Y UTILIDADES
 * ============================================================================
 */

/**
 * Función global para refrescar la vista de productos
 * Útil para integración con otros sistemas o actualizaciones externas
 */
function refreshProductsView() {
    const event = new Event('change');
    const firstFilter = document.querySelector('#categorias-filtro input[type="checkbox"]');
    if (firstFilter) {
        firstFilter.dispatchEvent(event);
    }
}

// Hacer función disponible globalmente para integración
window.refreshProductsView = refreshProductsView;

/**
 * Función debounce para optimizar rendimiento
 * Evita ejecuciones múltiples rápidas de funciones costosas
 * @param {Function} func - Función a ejecutar
 * @param {number} wait - Tiempo de espera en milisegundos
 * @returns {Function} Función debounceada
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