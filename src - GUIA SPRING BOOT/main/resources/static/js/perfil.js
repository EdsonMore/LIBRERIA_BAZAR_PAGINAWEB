// src/main/resources/static/js/perfil.js
(function () {
    'use strict';

    // =============================
    // VALIDACIÓN BOOTSTRAP
    // =============================
    const forms = document.querySelectorAll('.needs-validation');

    Array.from(forms).forEach(form => {
        form.addEventListener('submit', event => {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();

                // Scroll al primer campo con error
                const firstInvalid = form.querySelector(':invalid');
                if (firstInvalid) {
                    firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstInvalid.focus();
                }
            }
            form.classList.add('was-validated');
        }, false);
    });

    // =============================
    // VALIDACIÓN EN TIEMPO REAL: NÚMERO CELULAR
    // =============================
    const numeroInput = document.querySelector('input[name="numero"]');
    if (numeroInput) {
        numeroInput.addEventListener('input', function () {
            let value = this.value.replace(/\D/g, ''); // Solo números
            if (value.length > 9) {
                value = value.substring(0, 9);
            }
            this.value = value;
        });

        numeroInput.addEventListener('keypress', function (e) {
            // Solo permitir números
            if (!/\d/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter'].includes(e.key)) {
                e.preventDefault();
            }
        });
    }

    // =============================
    // CONFIRMACIÓN AL GUARDAR CAMBIOS
    // =============================
    const formPerfil = document.getElementById('formperfil');
    if (formPerfil) {
        formPerfil.addEventListener('submit', function (e) {
            if (this.checkValidity()) {
                const confirmacion = confirm('¿Está seguro de que desea guardar los cambios?');
                if (!confirmacion) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.classList.remove('was-validated');
                }
            }
        });
    }
})();
