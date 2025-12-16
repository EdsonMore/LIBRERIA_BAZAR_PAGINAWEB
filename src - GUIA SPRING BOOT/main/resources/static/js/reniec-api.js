document.addEventListener('DOMContentLoaded', function () {
    const dniInput = document.getElementById('dni');
    const btnBuscarDni = document.getElementById('btnBuscarDni');
    const dniLoading = document.getElementById('dniLoading');

    const nombresInput = document.getElementById('nombres');
    const apellidoPaternoInput = document.getElementById('apellidoPaterno');
    const apellidoMaternoInput = document.getElementById('apellidoMaterno');

    function consultarDni() {
        const dni = dniInput.value.trim();

        // Validar que el DNI tenga 8 dígitos
        if (!/^\d{8}$/.test(dni)) {
            alert('Por favor, ingrese un DNI válido de 8 dígitos');
            return;
        }

        // Mostrar loading
        dniLoading.classList.remove('d-none');
        btnBuscarDni.disabled = true;

        // Realizar consulta a la API
        fetch(`/api/reniec/consultar/${dni}`)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert('Error: ' + data.error);
                    limpiarCampos();
                } else {
                    // Llenar campos automáticamente
                    nombresInput.value = data.nombres || '';
                    apellidoPaternoInput.value = data.apellidoPaterno || '';
                    apellidoMaternoInput.value = data.apellidoMaterno || '';

                    // Quitar readonly para que el usuario pueda editar si es necesario
                    nombresInput.readOnly = false;
                    apellidoPaternoInput.readOnly = false;
                    apellidoMaternoInput.readOnly = false;
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error al consultar el DNI. Intente nuevamente.');
                limpiarCampos();
            })
            .finally(() => {
                // Ocultar loading
                dniLoading.classList.add('d-none');
                btnBuscarDni.disabled = false;
            });
    }

    function limpiarCampos() {
        nombresInput.value = '';
        apellidoPaternoInput.value = '';
        apellidoMaternoInput.value = '';
    }

    // Event listeners
    btnBuscarDni.addEventListener('click', consultarDni);

    // Consultar automáticamente cuando se ingrese 8 dígitos
    dniInput.addEventListener('input', function () {
        if (this.value.length === 8 && /^\d+$/.test(this.value)) {
            consultarDni();
        }
    });
});