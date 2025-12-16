document.addEventListener('DOMContentLoaded', function () {
    // Aplicar filtros automáticamente cuando cambien los selects
    document.getElementById('filtroEstado').addEventListener('change', aplicarFiltros);
    document.getElementById('ordenarPor').addEventListener('change', aplicarFiltros);
});

let compraActual = null;

function aplicarFiltros() {
    const filtroEstado = document.getElementById('filtroEstado').value;
    const orden = document.getElementById('ordenarPor').value;
    const compras = document.querySelectorAll('.compra-card');

    compras.forEach(compra => {
        const estado = compra.getAttribute('data-estado');

        // Filtrar por estado
        if (filtroEstado === 'TODAS' || estado === filtroEstado) {
            compra.style.display = 'block';
        } else {
            compra.style.display = 'none';
        }
    });

    // Ordenar compras según el criterio seleccionado
    ordenarCompras(orden);
}

function ordenarCompras(orden) {
    const container = document.querySelector('.row.g-4');
    const compras = Array.from(container.querySelectorAll('.compra-card'));

    compras.sort((a, b) => {
        const idA = parseInt(a.querySelector('.card-header h5 span').textContent);
        const idB = parseInt(b.querySelector('.card-header h5 span').textContent);
        const totalTextA = a.querySelector('.text-success span').textContent;
        const totalTextB = b.querySelector('.text-success span').textContent;
        const totalA = parseFloat(totalTextA);
        const totalB = parseFloat(totalTextB);

        switch (orden) {
            case 'fecha_desc':
                return idB - idA; // IDs más altos primero (más recientes)
            case 'fecha_asc':
                return idA - idB; // IDs más bajos primero (más antiguos)
            case 'total_desc':
                return totalB - totalA; // Mayor monto primero
            case 'total_asc':
                return totalA - totalB; // Menor monto primero
            default:
                return 0;
        }
    });

    // Reinsertar en el orden correcto
    compras.forEach(compra => container.appendChild(compra));
}

function verDetalles(compraId) {
    // Mostrar loader
    const modal = new bootstrap.Modal(document.getElementById('modalDetalleCompra'));
    const modalBody = document.getElementById('detalleProductos');
    modalBody.innerHTML = `
        <div class="text-center py-4">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
            </div>
            <p class="text-muted mt-2">Cargando detalles de la compra...</p>
        </div>
    `;
    modal.show();

    // Usar el nuevo endpoint
    fetch(`/mis-compras/${compraId}/detalles`)
        .then(response => {
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('No autorizado. Por favor, inicia sesión nuevamente.');
                } else if (response.status === 404) {
                    throw new Error('Compra no encontrada.');
                } else {
                    throw new Error('Error del servidor: ' + response.status);
                }
            }
            return response.json();
        })
        .then(compra => {
            compraActual = compra; // Guardar para el comprobante
            mostrarDetallesCompra(compra);
        })
        .catch(err => {
            console.error('Error:', err);
            modalBody.innerHTML = `
                <div class="alert alert-danger text-center">
                    <i class="bi bi-exclamation-triangle"></i><br>
                    No se pudo cargar la información de la compra.<br>
                    <small>Error: ${err.message}</small>
                </div>
            `;
        });
}

function mostrarDetallesCompra(compra) {
    // Datos generales
    document.getElementById('detalleId').textContent = compra.id;

    // Formatear fecha
    const fecha = new Date(compra.fechaCompra);
    const fechaFormateada = fecha.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    document.getElementById('detalleFecha').textContent = fechaFormateada;

    // Estado con badge
    const badge = document.getElementById('detalleEstado');
    badge.textContent = compra.estado;
    badge.className = 'badge ' +
        (compra.estado === 'PENDIENTE' ? 'bg-warning' :
            compra.estado === 'CONFIRMADA' ? 'bg-info' :
                compra.estado === 'ENVIADA' ? 'bg-primary' : 'bg-success');

    document.getElementById('detallePago').textContent = compra.metodoPago;
    document.getElementById('detalleDireccion').textContent = compra.direccionEntrega;
    document.getElementById('detalleTotal').textContent = compra.total ? compra.total.toFixed(2) : '0.00';
    document.getElementById('detalleTotalResumen').textContent = compra.total ? compra.total.toFixed(2) : '0.00';

    // Número de seguimiento
    const seguimientoContainer = document.getElementById('detalleSeguimientoContainer');
    if (compra.numeroSeguimiento && compra.numeroSeguimiento.trim() !== '') {
        seguimientoContainer.style.display = 'block';
        document.getElementById('detalleSeguimiento').textContent = compra.numeroSeguimiento;
    } else {
        seguimientoContainer.style.display = 'none';
    }

    // Productos en formato tabla
    const productosContainer = document.getElementById('detalleProductos');

    if (!compra.items || compra.items.length === 0) {
        productosContainer.innerHTML = '<p class="text-muted text-center">No hay productos en esta compra.</p>';
    } else {
        productosContainer.innerHTML = `
            <table class="table table-sm">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th class="text-center">Cantidad</th>
                        <th class="text-end">Precio Unit.</th>
                        <th class="text-end">Subtotal</th>
                    </tr>
                </thead>
                <tbody id="detalleProductosBody">
                </tbody>
            </table>
        `;

        const tbody = document.getElementById('detalleProductosBody');
        compra.items.forEach(item => {
            const precio = item.producto ? item.producto.precio : 0;
            const subtotal = item.cantidad * precio;
            const nombreProducto = item.producto ? item.producto.nombre : 'Producto no disponible';
            const imagenProducto = item.producto && item.producto.imagen ? item.producto.imagen : '/img/placeholder-producto.jpg';
            const idProducto = item.producto ? item.producto.id : 'N/A';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div class="d-flex align-items-center">
                        <img src="${imagenProducto}" alt="${nombreProducto}" 
                             width="40" height="40" class="rounded me-2 object-fit-cover">
                        <div>
                            <div class="fw-bold">${nombreProducto}</div>
                            <small class="text-muted">Código: ${idProducto}</small>
                        </div>
                    </div>
                </td>
                <td class="text-center">${item.cantidad}</td>
                <td class="text-end">S/. ${precio.toFixed(2)}</td>
                <td class="text-end fw-bold">S/. ${subtotal.toFixed(2)}</td>
            `;
            tbody.appendChild(row);
        });
    }

    // Totales
    document.getElementById('detalleSubtotal').textContent = compra.subtotal ? compra.subtotal.toFixed(2) : '0.00';
    document.getElementById('detalleIGV').textContent = compra.igv ? compra.igv.toFixed(2) : '0.00';
}

function descargarComprobante() {
    if (!compraActual) {
        Swal.fire({
            title: 'Error',
            text: 'No hay información de compra disponible',
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
        return;
    }

    // Mostrar confirmación
    Swal.fire({
        title: 'Descargar Comprobante',
        html: `¿Deseas descargar el comprobante de la compra <strong>#${compraActual.id}</strong>?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, descargar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            generarComprobante(compraActual);
        }
    });
}


function generarComprobante(compra) {
    // Crear contenido del comprobante
    const fechaCompra = new Date(compra.fechaCompra).toLocaleString('es-ES');
    const fechaGeneracion = new Date().toLocaleString('es-ES');

    let productosHTML = '';
    if (compra.items && compra.items.length > 0) {
        compra.items.forEach(item => {
            const precio = item.producto ? item.producto.precio : 0;
            const subtotal = item.cantidad * precio;
            const nombre = item.producto ? item.producto.nombre : 'Producto no disponible';

            productosHTML += `
                <tr>
                    <td>${nombre}</td>
                    <td>${item.cantidad}</td>
                    <td>S/. ${precio.toFixed(2)}</td>
                    <td>S/. ${subtotal.toFixed(2)}</td>
                </tr>
            `;
        });
    }

    const contenido = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Comprobante - Compra #${compra.id}</title>
            <meta charset="UTF-8">
            <style>
                body { 
                    font-family: 'Arial', sans-serif; 
                    margin: 20px; 
                    line-height: 1.4;
                    color: #333;
                }
                .header { 
                    text-align: center; 
                    border-bottom: 2px solid #2c5aa0; 
                    padding-bottom: 15px; 
                    margin-bottom: 20px; 
                }
                .empresa { 
                    font-size: 24px; 
                    font-weight: bold; 
                    color: #2c5aa0; 
                    margin-bottom: 5px;
                }
                .slogan {
                    font-size: 14px;
                    color: #666;
                    margin-bottom: 10px;
                }
                .comprobante { 
                    font-size: 18px; 
                    margin: 10px 0; 
                    color: #333;
                }
                .detalles { 
                    margin: 20px 0; 
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                }
                .detalle-item {
                    margin-bottom: 8px;
                }
                .tabla { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin: 20px 0; 
                    font-size: 12px;
                }
                .tabla th, .tabla td { 
                    border: 1px solid #ddd; 
                    padding: 10px; 
                    text-align: left; 
                }
                .tabla th { 
                    background-color: #f8f9fa; 
                    font-weight: bold;
                }
                .tabla td {
                    vertical-align: top;
                }
                .totales { 
                    text-align: right; 
                    margin-top: 20px; 
                    font-size: 14px;
                }
                .total-final {
                    font-size: 16px;
                    font-weight: bold;
                    color: #2c5aa0;
                    border-top: 2px solid #2c5aa0;
                    padding-top: 10px;
                    margin-top: 10px;
                }
                .footer { 
                    margin-top: 30px; 
                    padding-top: 15px; 
                    border-top: 1px solid #ddd; 
                    text-align: center; 
                    font-size: 11px; 
                    color: #666; 
                }
                .badge-estado {
                    display: inline-block;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: bold;
                    background-color: #ffc107;
                    color: #000;
                }
                @media print {
                    body { margin: 0; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="empresa">TU BAZAR PLUS</div>
                <div class="slogan">Tu bazar de confianza</div>
                <div class="comprobante">COMPROBANTE DE COMPRA #${compra.id}</div>
            </div>
            
            <div class="detalles">
                <div>
                    <div class="detalle-item"><strong>Fecha de Compra:</strong> ${fechaCompra}</div>
                    <div class="detalle-item"><strong>Estado:</strong> 
                        <span class="badge-estado">${compra.estado}</span>
                    </div>
                    <div class="detalle-item"><strong>Método de Pago:</strong> ${compra.metodoPago}</div>
                </div>
                <div>
                    <div class="detalle-item"><strong>Dirección de Entrega:</strong></div>
                    <div class="detalle-item" style="margin-top: 5px;">${compra.direccionEntrega}</div>
                    ${compra.numeroSeguimiento ? `<div class="detalle-item"><strong>N° Seguimiento:</strong> ${compra.numeroSeguimiento}</div>` : ''}
                </div>
            </div>
            
            <table class="tabla">
                <thead>
                    <tr>
                        <th width="50%">Producto</th>
                        <th width="15%">Cantidad</th>
                        <th width="15%">Precio Unit.</th>
                        <th width="20%">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${productosHTML}
                </tbody>
            </table>
            
            <div class="totales">
                <div><strong>Subtotal:</strong> S/. ${compra.subtotal ? compra.subtotal.toFixed(2) : '0.00'}</div>
                <div><strong>IGV (18%):</strong> S/. ${compra.igv ? compra.igv.toFixed(2) : '0.00'}</div>
                <div class="total-final"><strong>TOTAL:</strong> S/. ${compra.total ? compra.total.toFixed(2) : '0.00'}</div>
            </div>
            
            <div class="footer">
                <p><strong>¡Gracias por su compra!</strong></p>
                <p>TU BAZAR PLUS - Tu bazar de confianza</p>
                <p>Comprobante generado el ${fechaGeneracion}</p>
                <p class="no-print">Este es un comprobante generado automáticamente.</p>
            </div>
        </body>
        </html>
    `;

    // Crear blob y descargar
    const blob = new Blob([contenido], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comprobante-compra-${compra.id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Mostrar confirmación
    Swal.fire({
        title: 'Comprobante Descargado',
        html: `El comprobante de la compra <strong>#${compra.id}</strong> se ha descargado correctamente.`,
        icon: 'success',
        confirmButtonText: 'Aceptar'
    });
}