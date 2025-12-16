// ===== VALIDACIONES LOGIN Y REGISTRO =====

// Validaciones comunes para login y registro
(function () {
  "use strict";

  // Helper para mostrar errores
  const showError = (input, message) => {
    input.classList.add("is-invalid");
    let feedback = input.nextElementSibling;
    if (!feedback || !feedback.classList.contains("invalid-feedback")) {
      feedback = document.createElement("div");
      feedback.classList.add("invalid-feedback");
      input.parentNode.appendChild(feedback);
    }
    feedback.textContent = message;
  };

  const clearError = (input) => {
    input.classList.remove("is-invalid");
  };

  // Validación de email
  const validarEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Validación edad (>=18)
  const validarEdad = (fecha) => {
    if (!fecha) return false;
    const nacimiento = new Date(fecha);
    const hoy = new Date();
    const edad = hoy.getFullYear() - nacimiento.getFullYear();
    const ajuste =
      hoy.getMonth() < nacimiento.getMonth() ||
      (hoy.getMonth() === nacimiento.getMonth() &&
        hoy.getDate() < nacimiento.getDate())
        ? 1
        : 0;
    return edad - ajuste >= 18;
  };

  // Validación documento según tipo
  const validarDocumento = (tipo, valor) => {
    if (tipo === "DNI") return /^\d{8}$/.test(valor);
    if (tipo === "RUC") return /^\d{11}$/.test(valor);
    if (tipo === "PASAPORTE") return /^[A-Z0-9]{6,9}$/i.test(valor);
    if (tipo === "CARNET_EXTRANJERIA") return /^[A-Z0-9]{9}$/i.test(valor);
    return false;
  };

  // Validación teléfono
  const validarTelefono = (numero) => /^\d{9}$/.test(numero);

  // -------------------------
  // LOGIN
  // -------------------------
  const loginForm = document.querySelector('form[action="/login"]');
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      let valido = true;

      const correo = loginForm.querySelector("#correo");
      const password = loginForm.querySelector("#password");

      clearError(correo);
      clearError(password);

      if (!correo.value.trim() || !validarEmail(correo.value)) {
        showError(correo, "Ingrese un correo válido");
        valido = false;
      }
      if (!password.value.trim() || password.value.length < 6) {
        showError(password, "La contraseña debe tener mínimo 6 caracteres");
        valido = false;
      }

      if (!valido) {
        e.preventDefault();
        e.stopPropagation();
      }
    });
  }

  // -------------------------
  // REGISTRO
  // -------------------------
  const registroForm = document.querySelector("#registroForm");
  if (registroForm) {
    registroForm.addEventListener("submit", (e) => {
      let valido = true;

      const nombres = registroForm.querySelector("#nombres");
      const apellidoPaterno = registroForm.querySelector("#apellidoPaterno");
      const apellidoMaterno = registroForm.querySelector("#apellidoMaterno");
      const correo = registroForm.querySelector("#correo");
      const password = registroForm.querySelector("#password");
      const tipoDoc = registroForm.querySelector("#tipoDoc");
      const dni = registroForm.querySelector("#dni");
      const fechaNacimiento = registroForm.querySelector("#fechaNacimiento");
      const genero = registroForm.querySelector("#genero");
      const numero = registroForm.querySelector("#numero");
      const direccion1 = registroForm.querySelector("#direccion1");

      // Limpiar errores
      [
        nombres,
        apellidoPaterno,
        apellidoMaterno,
        correo,
        password,
        tipoDoc,
        dni,
        fechaNacimiento,
        genero,
        numero,
        direccion1,
      ].forEach(clearError);

      // Validaciones
      if (!nombres.value.trim()) {
        showError(nombres, "Ingrese sus nombres");
        valido = false;
      }
      if (!apellidoPaterno.value.trim()) {
        showError(apellidoPaterno, "Ingrese su apellido paterno");
        valido = false;
      }
      if (!apellidoMaterno.value.trim()) {
        showError(apellidoMaterno, "Ingrese su apellido materno");
        valido = false;
      }
      if (!validarEmail(correo.value)) {
        showError(correo, "Ingrese un correo válido");
        valido = false;
      }
      if (!password.value.trim() || password.value.length < 6) {
        showError(password, "La contraseña debe tener mínimo 6 caracteres");
        valido = false;
      }
      if (!tipoDoc.value) {
        showError(tipoDoc, "Seleccione un tipo de documento");
        valido = false;
      }
      if (!validarDocumento(tipoDoc.value, dni.value)) {
        showError(dni, `Número de ${tipoDoc.value} inválido`);
        valido = false;
      }
      if (!validarEdad(fechaNacimiento.value)) {
        showError(fechaNacimiento, "Debe ser mayor de 18 años");
        valido = false;
      }
      if (!genero.value) {
        showError(genero, "Seleccione un género");
        valido = false;
      }
      if (!validarTelefono(numero.value)) {
        showError(numero, "Ingrese un teléfono válido (9 dígitos)");
        valido = false;
      }
      if (!direccion1.value.trim()) {
        showError(direccion1, "Ingrese su dirección");
        valido = false;
      }

      if (!valido) {
        e.preventDefault();
        e.stopPropagation();
      }
    });
  }
})();
