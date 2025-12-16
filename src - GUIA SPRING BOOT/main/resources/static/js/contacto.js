// contacto.js - Script completo para formulario de contacto

document.addEventListener('DOMContentLoaded', function () {
    const form = document.querySelector('form.needs-validation');
    const textarea = document.getElementById('mensaje');

    // Verificar que el formulario exista
    if (!form) {
        console.warn('Formulario de contacto no encontrado');
        return;
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

        // Validación para teléfono
        if (input.name === 'telefono') {
            input.addEventListener('input', function () {
                // Permitir solo números, espacios, guiones y paréntesis
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

        // Validación para nombre
        if (input.name === 'nombre') {
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

        // Validación para mensaje (textarea)
        if (input.name === 'mensaje') {
            input.addEventListener('input', function () {
                const minLength = 10;
                const maxLength = 1000;

                if (this.value.trim().length < minLength) {
                    this.setCustomValidity(`El mensaje debe tener al menos ${minLength} caracteres`);
                } else if (this.value.length > maxLength) {
                    this.setCustomValidity(`El mensaje no puede exceder ${maxLength} caracteres`);
                } else {
                    this.setCustomValidity('');
                }
            });

            // Contador de caracteres
            const charCounter = document.createElement('small');
            charCounter.className = 'form-text text-muted';
            charCounter.id = 'charCounter';
            input.parentNode.appendChild(charCounter);

            input.addEventListener('input', function () {
                const current = this.value.length;
                const max = 1000;
                charCounter.textContent = `${current}/${max} caracteres`;

                if (current > max * 0.9) {
                    charCounter.classList.add('text-warning');
                } else {
                    charCounter.classList.remove('text-warning');
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

        // Limpiar validación al enfocar
        input.addEventListener('focus', function () {
            if (!form.classList.contains('was-validated')) {
                this.classList.remove('is-invalid', 'is-valid');
            }
        });
    });

    // ========== VALIDACIÓN Y ENVÍO DEL FORMULARIO ==========
    let isSubmitting = false;

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        event.stopPropagation();

        // Prevenir múltiples envíos
        if (isSubmitting) {
            showToastMessage('Por favor espere, estamos procesando su mensaje...', 'warning');
            return;
        }

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
            showToastMessage('Debe aceptar recibir comunicaciones para continuar', 'warning');
            terminosCheckbox.focus();
            return;
        }

        form.classList.add('was-validated');

        // Mostrar confirmación antes de enviar
        Swal.fire({
            title: '¿Enviar mensaje?',
            text: '¿Está seguro de que desea enviar su mensaje de contacto?',
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
                isSubmitting = true;

                // Mostrar loading
                Swal.fire({
                    title: 'Enviando mensaje...',
                    html: 'Por favor espere mientras procesamos su solicitud',
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });

                // Deshabilitar botón de envío
                const submitBtn = form.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = true;
                }

                // Enviar formulario usando FormData
                const formData = new FormData(form);

                // Envío con fetch
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
                            title: '¡Mensaje enviado!',
                            html: '¡Gracias por contactarnos!<br>Te responderemos a la brevedad posible.',
                            icon: 'success',
                            confirmButtonColor: '#198754',
                            confirmButtonText: '<i class="bi bi-check-circle me-2"></i>Aceptar',
                            customClass: {
                                confirmButton: 'btn btn-success px-4'
                            },
                            buttonsStyling: false
                        }).then(() => {
                            // Limpiar formulario después de envío exitoso
                            form.reset();
                            form.classList.remove('was-validated');
                            inputs.forEach(input => {
                                input.classList.remove('is-valid', 'is-invalid');
                                input.setCustomValidity('');
                            });

                            // Actualizar contador de caracteres si existe
                            const charCounter = document.getElementById('charCounter');
                            if (charCounter) {
                                charCounter.textContent = '0/1000 caracteres';
                                charCounter.classList.remove('text-warning');
                            }

                            // Restablecer asunto predeterminado
                            const asuntoSelect = document.getElementById('asunto');
                            if (asuntoSelect) {
                                const consultaOption = Array.from(asuntoSelect.options).find(opt => opt.value === 'consulta');
                                if (consultaOption) {
                                    asuntoSelect.value = 'consulta';
                                }
                            }

                            // Scroll al inicio
                            window.scrollTo({ top: 0, behavior: 'smooth' });

                            isSubmitting = false;
                            if (submitBtn) {
                                submitBtn.disabled = false;
                            }
                        });
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        Swal.fire({
                            title: 'Error al enviar',
                            text: 'Hubo un problema al enviar su mensaje. Por favor, intente nuevamente o contáctenos por otros medios.',
                            icon: 'error',
                            confirmButtonColor: '#dc3545',
                            confirmButtonText: 'Entendido',
                            customClass: {
                                confirmButton: 'btn btn-danger px-4'
                            },
                            buttonsStyling: false,
                            footer: '<a href="https://wa.me/51999888777" target="_blank" class="text-decoration-none"><i class="bi bi-whatsapp me-2"></i>Contactar por WhatsApp</a>'
                        }).then(() => {
                            isSubmitting = false;
                            if (submitBtn) {
                                submitBtn.disabled = false;
                            }
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
            // Fallback si SweetAlert2 no está disponible
            console.log(`${type.toUpperCase()}: ${message}`);

            // Fallback visual básico con Bootstrap
            const alertClass = type === 'success' ? 'alert-success' :
                type === 'error' ? 'alert-danger' :
                    type === 'warning' ? 'alert-warning' : 'alert-info';

            const alertDiv = document.createElement('div');
            alertDiv.className = `alert ${alertClass} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
            alertDiv.style.zIndex = '1055';
            alertDiv.style.maxWidth = '400px';
            alertDiv.innerHTML = `
                <strong>${type === 'success' ? '¡Éxito!' : type === 'error' ? 'Error' : 'Aviso'}</strong>
                <p class="mb-0">${message}</p>
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
            `;
            document.body.appendChild(alertDiv);

            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.classList.remove('show');
                    setTimeout(() => alertDiv.remove(), 150);
                }
            }, 4000);
        }
    }

    // ========== MANEJO DEL BOTÓN LIMPIAR ==========
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
                confirmButtonText: '<i class="bi bi-trash me-2"></i>Sí, limpiar',
                cancelButtonText: 'Cancelar',
                customClass: {
                    confirmButton: 'btn btn-danger px-4',
                    cancelButton: 'btn btn-secondary px-4'
                },
                buttonsStyling: false
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

                        // Actualizar contador de caracteres
                        const charCounter = document.getElementById('charCounter');
                        if (charCounter) {
                            charCounter.textContent = '0/1000 caracteres';
                            charCounter.classList.remove('text-warning');
                        }

                        // Restablecer asunto predeterminado
                        const asuntoSelect = document.getElementById('asunto');
                        if (asuntoSelect) {
                            const consultaOption = Array.from(asuntoSelect.options).find(opt => opt.value === 'consulta');
                            if (consultaOption) {
                                asuntoSelect.value = 'consulta';
                            }
                        }

                        showToastMessage('Formulario limpiado correctamente', 'info');
                    }, 100);
                }
            });
        });
    }

    // ========== MEJORAS DE USABILIDAD ==========

    // Auto-seleccionar asunto más común
    const asuntoSelect = document.getElementById('asunto');
    if (asuntoSelect && !asuntoSelect.value) {
        const consultaOption = Array.from(asuntoSelect.options).find(opt => opt.value === 'consulta');
        if (consultaOption) {
            asuntoSelect.value = 'consulta';
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

    // Prevenir envío con Enter en campos de texto (excepto textarea)
    form.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
        }
    });

    // Animación suave al hacer focus en campos
    inputs.forEach(input => {
        input.addEventListener('focus', function () {
            this.parentElement.style.transition = 'transform 0.2s ease';
            this.parentElement.style.transform = 'scale(1.01)';
        });

        input.addEventListener('blur', function () {
            this.parentElement.style.transform = 'scale(1)';
        });
    });

    console.log('✅ Formulario de contacto inicializado correctamente');
});