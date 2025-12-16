// libro-reclamaciones.js - Script completo para el libro de reclamaciones

document.addEventListener('DOMContentLoaded', function () {
    const form = document.querySelector('form.needs-validation');
    const textarea = document.getElementById('detalleSolicitud');
    const fechaInput = document.getElementById('fechaIncidente');
    const fileInput = document.getElementById('evidencia');

    // Verificar que el formulario exista
    if (!form) {
        console.warn('Formulario de reclamaciones no encontrado');
        return;
    }

    // ========== CONFIGURACIÓN DE FECHA MÁXIMA ==========
    if (fechaInput) {
        const today = new Date().toISOString().split('T')[0];
        fechaInput.max = today;

        // Establecer fecha por defecto si está vacía
        if (!fechaInput.value) {
            fechaInput.value = today;
        }

        // Validación adicional de fecha
        fechaInput.addEventListener('change', function () {
            const selectedDate = new Date(this.value);
            const todayDate = new Date();

            if (selectedDate > todayDate) {
                this.setCustomValidity('La fecha del incidente no puede ser futura');
                showToastMessage('La fecha del incidente no puede ser posterior a hoy', 'warning');
            } else {
                this.setCustomValidity('');
            }
        });
    }

    // ========== VALIDACIÓN EN TIEMPO REAL ==========
    const inputs = form.querySelectorAll('input, select, textarea');

    inputs.forEach(input => {
        // Validación para email
        if (input.type === 'email') {
            input.addEventListener('blur', function () {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (this.value && !emailRegex.test(this.value)) {
                    this.setCustomValidity('Por favor ingrese un email válido');
                    this.classList.add('is-invalid');
                } else {
                    this.setCustomValidity('');
                    this.classList.remove('is-invalid');
                }
            });
        }

        // Validación para número de documento
        if (input.name === 'numeroDocumento') {
            input.addEventListener('input', function () {
                // Permitir solo números
                this.value = this.value.replace(/\D/g, '');

                const tipoDocumento = form.querySelector('[name="tipoDocumento"]')?.value || '';

                if (tipoDocumento === 'dni' && this.value.length !== 8) {
                    this.setCustomValidity('El DNI debe tener exactamente 8 dígitos');
                } else if (tipoDocumento === 'carnet' && (this.value.length < 8 || this.value.length > 12)) {
                    this.setCustomValidity('El Carnet de Extranjería debe tener entre 8 y 12 dígitos');
                } else if (tipoDocumento === 'pasaporte' && (this.value.length < 6 || this.value.length > 12)) {
                    this.setCustomValidity('El Pasaporte debe tener entre 6 y 12 caracteres');
                } else {
                    this.setCustomValidity('');
                }
            });
        }

        // Validación para nombres y apellidos
        if (input.name === 'nombre' || input.name === 'apellidos') {
            input.addEventListener('input', function () {
                // Permitir solo letras, espacios y tildes
                this.value = this.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');

                if (this.value.trim().length < 2) {
                    this.setCustomValidity('Debe tener al menos 2 caracteres');
                } else {
                    this.setCustomValidity('');
                }
            });
        }

        // Validación para teléfono
        if (input.name === 'telefono') {
            input.addEventListener('input', function () {
                this.value = this.value.replace(/[^0-9\s\-\(\)\+]/g, '');

                const phoneDigits = this.value.replace(/\D/g, '');
                if (phoneDigits.length > 0 && phoneDigits.length < 7) {
                    this.setCustomValidity('El teléfono debe tener al menos 7 dígitos');
                } else if (phoneDigits.length > 15) {
                    this.setCustomValidity('El teléfono no puede tener más de 15 dígitos');
                } else {
                    this.setCustomValidity('');
                }
            });
        }

        // Validación para código postal
        if (input.name === 'codigoPostal') {
            input.addEventListener('input', function () {
                this.value = this.value.replace(/\D/g, '');

                if (this.value.length > 0 && this.value.length !== 5) {
                    this.setCustomValidity('El código postal debe tener 5 dígitos');
                } else {
                    this.setCustomValidity('');
                }
            });
        }

        // Marcar campos como válidos/inválidos en tiempo real
        input.addEventListener('blur', function () {
            if (this.checkValidity()) {
                this.classList.remove('is-invalid');
                this.classList.add('is-valid');
            } else {
                this.classList.remove('is-valid');
                this.classList.add('is-invalid');
            }
        });
    });

    // ========== VALIDACIÓN DE ARCHIVO ==========
    if (fileInput) {
        fileInput.addEventListener('change', function () {
            const file = this.files[0];
            if (file) {
                const maxSize = 5 * 1024 * 1024; // 5MB
                const allowedTypes = [
                    'image/jpeg',
                    'image/jpg',
                    'image/png',
                    'application/pdf',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                ];

                let isValid = true;
                let errorMessage = '';

                if (file.size > maxSize) {
                    isValid = false;
                    errorMessage = 'El archivo es muy grande. El tamaño máximo es 5MB.';
                } else if (!allowedTypes.includes(file.type)) {
                    isValid = false;
                    errorMessage = 'Tipo de archivo no permitido. Use JPG, PNG, PDF, DOC o DOCX.';
                }

                if (!isValid) {
                    showToastMessage(errorMessage, 'error');
                    this.value = '';
                    this.setCustomValidity(errorMessage);
                } else {
                    this.setCustomValidity('');
                    showToastMessage(`Archivo "${file.name}" cargado correctamente`, 'success');
                }
            }
        });
    }

    // ========== VALIDACIÓN Y ENVÍO DEL FORMULARIO ==========
    form.addEventListener('submit', function (event) {
        event.preventDefault();
        event.stopPropagation();

        // Validar formulario
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            showToastMessage('Por favor, complete todos los campos requeridos correctamente', 'error');

            // Hacer scroll al primer campo inválido
            const firstInvalid = form.querySelector(':invalid');
            if (firstInvalid) {
                firstInvalid.focus();
                firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        // Validar checkbox de términos
        const terminosCheckbox = form.querySelector('input[name="terminos"]');
        if (terminosCheckbox && !terminosCheckbox.checked) {
            showToastMessage('Debe aceptar los términos y condiciones para continuar', 'warning');
            terminosCheckbox.focus();
            return;
        }

        form.classList.add('was-validated');

        // Mostrar confirmación antes de enviar
        Swal.fire({
            title: '¿Enviar reclamación?',
            text: '¿Está seguro de que desea enviar su reclamación?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#198754',
            cancelButtonColor: '#6c757d',
            confirmButtonText: '<i class="bi bi-send me-2"></i>Sí, enviar',
            cancelButtonText: '<i class="bi bi-x-circle me-2"></i>Cancelar',
            customClass: {
                confirmButton: 'btn btn-success px-4',
                cancelButton: 'btn btn-secondary px-4'
            },
            buttonsStyling: false
        }).then((result) => {
            if (result.isConfirmed) {
                // Mostrar loading
                Swal.fire({
                    title: 'Enviando reclamación...',
                    html: 'Por favor espere mientras procesamos su solicitud',
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });

                // Enviar formulario usando FormData
                const formData = new FormData(form);

                // Simular envío con fetch (ajusta la URL según tu backend)
                fetch(form.action, {
                    method: 'POST',
                    body: formData
                })
                    .then(response => {
                        if (response.ok) {
                            return response.text();
                        }
                        throw new Error('Error en el servidor');
                    })
                    .then(data => {
                        Swal.fire({
                            title: '¡Reclamación enviada!',
                            html: 'Su reclamación ha sido registrada exitosamente.<br>Recibirá una respuesta en un máximo de 48 horas.',
                            icon: 'success',
                            confirmButtonColor: '#198754',
                            confirmButtonText: 'Aceptar'
                        }).then(() => {
                            // Limpiar formulario después de envío exitoso
                            form.reset();
                            form.classList.remove('was-validated');
                            inputs.forEach(input => {
                                input.classList.remove('is-valid', 'is-invalid');
                            });

                            // Restablecer fecha a hoy
                            if (fechaInput) {
                                fechaInput.value = new Date().toISOString().split('T')[0];
                            }

                            // Scroll al inicio
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        });
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        Swal.fire({
                            title: 'Error al enviar',
                            text: 'Hubo un problema al enviar su reclamación. Por favor, intente nuevamente.',
                            icon: 'error',
                            confirmButtonColor: '#dc3545',
                            confirmButtonText: 'Entendido'
                        });
                    });
            }
        });
    });

    // ========== FUNCIÓN PARA MOSTRAR TOASTS ==========
    function showToastMessage(message, type = 'info') {
        if (typeof Swal !== 'undefined') {
            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 4000,
                timerProgressBar: true,
                didOpen: (toast) => {
                    toast.addEventListener('mouseenter', Swal.stopTimer);
                    toast.addEventListener('mouseleave', Swal.resumeTimer);
                }
            });

            let icon = 'info';
            switch (type) {
                case 'success': icon = 'success'; break;
                case 'error': icon = 'error'; break;
                case 'warning': icon = 'warning'; break;
            }

            Toast.fire({
                icon: icon,
                title: message
            });
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    // ========== MEJORAS DE USABILIDAD ==========

    // Auto-seleccionar tipo de documento más común
    const tipoDocumentoSelect = document.getElementById('tipoDocumento');
    if (tipoDocumentoSelect && !tipoDocumentoSelect.value) {
        const dniOption = Array.from(tipoDocumentoSelect.options).find(opt => opt.value === 'dni');
        if (dniOption) {
            tipoDocumentoSelect.value = 'dni';
        }
    }

    // Mejorar accesibilidad
    inputs.forEach(input => {
        if (!input.id) {
            input.id = `input-${input.name}`;
        }

        // Agregar ARIA labels si no existen
        if (!input.hasAttribute('aria-label')) {
            const label = form.querySelector(`label[for="${input.id}"]`);
            if (label) {
                input.setAttribute('aria-label', label.textContent.replace('*', '').trim());
            }
        }
    });

    // Manejar el evento reset del formulario
    const resetButton = form.querySelector('button[type="reset"]');
    if (resetButton) {
        resetButton.addEventListener('click', function (e) {
            e.preventDefault();

            Swal.fire({
                title: '¿Limpiar formulario?',
                text: 'Se perderán todos los datos ingresados',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#dc3545',
                cancelButtonColor: '#6c757d',
                confirmButtonText: 'Sí, limpiar',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    form.reset();

                    setTimeout(() => {
                        // Limpiar clases de validación
                        form.classList.remove('was-validated');
                        inputs.forEach(input => {
                            input.classList.remove('is-valid', 'is-invalid');
                            input.setCustomValidity('');
                        });

                        // Restablecer fecha a hoy
                        if (fechaInput) {
                            fechaInput.value = new Date().toISOString().split('T')[0];
                        }

                        showToastMessage('Formulario limpiado correctamente', 'info');
                    }, 100);
                }
            });
        });
    }

    // Prevenir envío accidental con Enter
    form.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
        }
    });

    console.log('✅ Formulario de libro de reclamaciones inicializado correctamente');
});