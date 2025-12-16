// src/main/resources/static/js/superadmin/categorias.js

class CategoriaManager {
  constructor() {
    this.modalCategoria = null;
    this.esEditando = false;
    this.formularioEnviado = false;
    this.init();
  }

  init() {
    console.log("=== Inicializando Manager ===");
    this.inicializarModal();
    this.inicializarEventos();
    this.verificarCSRF();
  }

  /**
   * Verifica que el token CSRF esté disponible
   */

  /**
   * ✅ NUEVO: Obtener token CSRF para peticiones POST
   */
  getCsrfToken() {
    const token = document
      .querySelector('meta[name="_csrf"]')
      ?.getAttribute("content");
    const header = document
      .querySelector('meta[name="_csrf_header"]')
      ?.getAttribute("content");
    return { token, header };
  }

  /**
   * ✅ NUEVO: Crear headers con CSRF para fetch
   */
  getFetchHeaders() {
    const { token, header } = this.getCsrfToken();
    const headers = {
      "Content-Type": "application/json",
    };
    if (token && header) {
      headers[header] = token;
    }
    return headers;
  }

  inicializarModal() {
    const modalElement = document.getElementById("modalCategoria");
    if (!modalElement) {
      console.error("Modal de categoría no encontrado");
      return;
    }

    this.modalCategoria = new bootstrap.Modal(modalElement);

    const imagenInput = document.getElementById("imagenFile");
    if (imagenInput) {
      imagenInput.addEventListener("change", (e) => {
        this.mostrarVistaPrevia(e.target);
      });
    }

    const form = document.getElementById("formCategoria");
    if (form) {
      form.addEventListener("submit", (e) => {
        this.validarFormulario(e);
      });
    }
  }

  inicializarEventos() {
    document.addEventListener("click", (e) => {
      if (e.target.closest(".btn-editar-categoria")) {
        const button = e.target.closest(".btn-editar-categoria");
        this.editarCategoria(button.getAttribute("data-id"));
      }

      if (e.target.closest(".btn-toggle-activa")) {
        const button = e.target.closest(".btn-toggle-activa");
        this.toggleActiva(button.getAttribute("data-id"));
      }

      if (e.target.closest(".btn-eliminar-categoria")) {
        const button = e.target.closest(".btn-eliminar-categoria");
        this.eliminarCategoria(
          button.getAttribute("data-id"),
          button.getAttribute("data-nombre")
        );
      }
    });

    const modalElement = document.getElementById("modalCategoria");
    if (modalElement) {
      modalElement.addEventListener("hidden.bs.modal", () => {
        this.limpiarFormulario();
      });
    }
  }

  abrirModalAgregar() {
    this.esEditando = false;
    const titulo = document.getElementById("modalTitulo");
    const form = document.getElementById("formCategoria");
    const btnGuardar = document.getElementById("btnGuardar");

    if (titulo) titulo.textContent = "Nueva Categoría";
    if (form) form.action = "/superAdmin/categorias/guardar";
    if (btnGuardar) {
      btnGuardar.innerHTML =
        '<i class="bi bi-check-circle"></i> Guardar Categoría';
      btnGuardar.disabled = false;
    }

    this.limpiarFormulario();
    if (this.modalCategoria) this.modalCategoria.show();
  }

  verificarCSRF() {
    const { token, header } = this.getCsrfToken();
    console.log("=== Verificación CSRF ===");
    console.log("Token encontrado:", token ? "✅ SÍ" : "❌ NO");
    console.log("Header encontrado:", header ? "✅ SÍ" : "❌ NO");

    if (!token || !header) {
      console.error("⚠️⚠️⚠️ CSRF NO CONFIGURADO ⚠️⚠️⚠️");
      console.error("Las peticiones POST fallarán.");
      console.error("Verifica que el layout tenga:");
      console.error('<meta name="_csrf" th:content="${_csrf.token}"/>');
      console.error(
        '<meta name="_csrf_header" th:content="${_csrf.headerName}"/>'
      );
    } else {
      console.log("✅ CSRF configurado correctamente");
      console.log("Token (primeros 20 chars):", token.substring(0, 20) + "...");
      console.log("Header name:", header);
    }
  }

  async editarCategoria(id) {
    try {
      const response = await fetch(`/superAdmin/categorias/${id}`);
      if (!response.ok) throw new Error("Error al cargar la categoría");

      const categoria = await response.json();

      this.esEditando = true;
      const titulo = document.getElementById("modalTitulo");
      const form = document.getElementById("formCategoria");
      const btnGuardar = document.getElementById("btnGuardar");

      if (titulo) titulo.textContent = `Editar Categoría: ${categoria.nombre}`;
      if (form) form.action = "/superAdmin/categorias/guardar";

      this.llenarFormulario(categoria);

      if (btnGuardar) {
        btnGuardar.innerHTML =
          '<i class="bi bi-check-circle"></i> Actualizar Categoría';
        btnGuardar.disabled = false;
      }

      if (this.modalCategoria) this.modalCategoria.show();
    } catch (error) {
      console.error("Error en editarCategoria:", error);
      this.mostrarError("No se pudo cargar los datos de la categoría");
    }
  }

  llenarFormulario(categoria) {
    const idInput = document.getElementById("categoriaId");
    const nombreInput = document.getElementById("nombre");
    const descripcionInput = document.getElementById("descripcion");
    const imagenPreview = document.getElementById("imagenPreview");
    const previewImg = document.getElementById("previewImg");

    if (idInput) idInput.value = categoria.id;
    if (nombreInput) nombreInput.value = categoria.nombre;
    if (descripcionInput) descripcionInput.value = categoria.descripcion || "";

    if (imagenPreview && previewImg) {
      if (categoria.imagen) {
        previewImg.src = categoria.imagen;
        imagenPreview.classList.remove("d-none");
      } else {
        imagenPreview.classList.add("d-none");
      }
    }
  }

  limpiarFormulario() {
    const idInput = document.getElementById("categoriaId");
    const nombreInput = document.getElementById("nombre");
    const descripcionInput = document.getElementById("descripcion");
    const imagenInput = document.getElementById("imagenFile");
    const imagenPreview = document.getElementById("imagenPreview");

    if (idInput) idInput.value = "0";
    if (nombreInput) nombreInput.value = "";
    if (descripcionInput) descripcionInput.value = "";
    if (imagenInput) imagenInput.value = "";
    if (imagenPreview) imagenPreview.classList.add("d-none");

    this.limpiarValidaciones();
  }

  limpiarImagen() {
    const imagenInput = document.getElementById("imagenFile");
    const imagenPreview = document.getElementById("imagenPreview");
    const previewImg = document.getElementById("previewImg");

    if (imagenInput) imagenInput.value = "";
    if (imagenPreview) imagenPreview.classList.add("d-none");
    if (previewImg) previewImg.src = "";
  }

  limpiarValidaciones() {
    const inputs = document.querySelectorAll(
      "#formCategoria input, #formCategoria textarea"
    );
    inputs.forEach((input) => {
      input.classList.remove("is-invalid");
      input.classList.remove("is-valid");
    });

    const feedbacks = document.querySelectorAll(".invalid-feedback");
    feedbacks.forEach((feedback) => feedback.remove());
  }

  mostrarVistaPrevia(input) {
    const preview = document.getElementById("imagenPreview");
    const previewImg = document.getElementById("previewImg");

    if (input.files && input.files[0]) {
      const file = input.files[0];
      const tiposPermitidos = ["image/jpeg", "image/png", "image/webp"];
      const maxSize = 5 * 1024 * 1024;

      if (!tiposPermitidos.includes(file.type)) {
        this.mostrarErrorInput(
          input,
          "Formato no válido. Use JPG, PNG o WebP."
        );
        return;
      }

      if (file.size > maxSize) {
        this.mostrarErrorInput(input, "La imagen debe ser menor a 5MB.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        if (previewImg) previewImg.src = e.target.result;
        if (preview) preview.classList.remove("d-none");
        this.mostrarExitoInput(input);
      };
      reader.readAsDataURL(file);
    } else {
      if (preview) preview.classList.add("d-none");
    }
  }

  validarFormulario(e) {
    if (this.formularioEnviado) {
      e.preventDefault();
      return;
    }

    this.limpiarValidaciones();

    const nombreInput = document.getElementById("nombre");
    const nombre = nombreInput ? nombreInput.value.trim() : "";
    let esValido = true;

    if (!nombre) {
      this.mostrarErrorInput(
        nombreInput,
        "El nombre de la categoría es obligatorio"
      );
      esValido = false;
    } else if (nombre.length < 2) {
      this.mostrarErrorInput(
        nombreInput,
        "El nombre debe tener al menos 2 caracteres"
      );
      esValido = false;
    } else if (nombre.length > 100) {
      this.mostrarErrorInput(
        nombreInput,
        "El nombre no puede exceder 100 caracteres"
      );
      esValido = false;
    }

    if (!esValido) {
      e.preventDefault();
      this.mostrarError(
        "Por favor complete correctamente todos los campos obligatorios"
      );
      return;
    }

    this.formularioEnviado = true;
    const btnGuardar = document.getElementById("btnGuardar");
    if (btnGuardar) {
      btnGuardar.disabled = true;
      btnGuardar.innerHTML =
        '<i class="bi bi-hourglass-split"></i> Guardando...';
    }
  }

  mostrarErrorInput(input, mensaje) {
    if (!input) return;

    input.classList.add("is-invalid");
    input.classList.remove("is-valid");

    let feedback = input.nextElementSibling;
    if (!feedback || !feedback.classList.contains("invalid-feedback")) {
      feedback = document.createElement("div");
      feedback.className = "invalid-feedback";
      input.parentNode.appendChild(feedback);
    }
    feedback.textContent = mensaje;
  }

  mostrarExitoInput(input) {
    if (!input) return;

    input.classList.remove("is-invalid");
    input.classList.add("is-valid");
  }

  /**
   * ✅ CORREGIDO: Toggle activa con CSRF token
   */
  toggleActiva(id) {
    console.log("=== Toggle Activa Categoría - Inicio ===");
    console.log("ID de la categoría:", id);

    Swal.fire({
      title: "¿Cambiar estado?",
      text: "¿Estás seguro de cambiar el estado de esta categoría?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, cambiar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (!result.isConfirmed) {
        console.log("Usuario canceló la operación");
        return;
      }

      console.log("Enviando petición POST...");
      const { token, header } = this.getCsrfToken();
      console.log("CSRF Token:", token ? "✅ OK" : "❌ NO ENCONTRADO");
      console.log("CSRF Header:", header);

      const headers = this.getFetchHeaders();
      console.log("Headers:", headers);

      fetch(`/superAdmin/categorias/toggle-activa/${id}`, {
        method: "POST",
        headers: headers,
      })
        .then((response) => {
          console.log("Respuesta recibida - Status:", response.status);

          if (!response.ok) {
            return response.text().then((text) => {
              console.error("Error del servidor:", text);
              throw new Error(
                `HTTP error! status: ${response.status} - ${text}`
              );
            });
          }
          return response.json();
        })
        .then((data) => {
          console.log("Datos recibidos:", data);

          if (data.success) {
            this.notificarCambiosCategorias("toggle-activa");
            console.log("✅ Operación exitosa");

            Swal.fire(
              "Éxito",
              data.message || "Estado actualizado correctamente",
              "success"
            ).then(() => window.location.reload());
          } else {
            console.error("❌ Error en respuesta:", data.message);
            Swal.fire("Error", data.message || "Error desconocido", "error");
          }
        })
        .catch((error) => {
          console.error("❌ Error en toggleActiva:", error);
          Swal.fire(
            "Error",
            "No se pudo cambiar el estado: " + error.message,
            "error"
          );
        });
    });
  }

  /**
   * ✅ CORREGIDO: Eliminar categoría con CSRF token
   */
  eliminarCategoria(id, nombre) {
    console.log("=== Eliminar Categoría - Inicio ===");
    console.log("ID:", id);
    console.log("Nombre:", nombre);

    Swal.fire({
      title: "¿Eliminar categoría?",
      html: `
      <div class="text-start">
        <p>¿Estás seguro de eliminar <strong>"${nombre}"</strong>?</p>
        <p class="text-danger">⚠️ Esta acción no se puede deshacer.</p>
      </div>
    `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
      width: "500px",
    }).then((result) => {
      if (!result.isConfirmed) {
        console.log("Usuario canceló la operación");
        return;
      }

      console.log("Enviando petición POST...");
      const { token, header } = this.getCsrfToken();
      console.log("CSRF Token:", token ? "✅ OK" : "❌ NO ENCONTRADO");
      console.log("CSRF Header:", header);

      const headers = this.getFetchHeaders();
      console.log("Headers:", headers);

      fetch(`/superAdmin/categorias/eliminar/${id}`, {
        method: "POST",
        headers: headers,
      })
        .then((response) => {
          console.log("Respuesta recibida - Status:", response.status);

          if (!response.ok) {
            return response.text().then((text) => {
              console.error("Error del servidor:", text);
              throw new Error(
                `HTTP error! status: ${response.status} - ${text}`
              );
            });
          }
          return response.json();
        })
        .then((data) => {
          console.log("Datos recibidos:", data);

          if (data.success) {
            this.notificarCambiosCategorias("eliminar");
            console.log("✅ Categoría eliminada exitosamente");

            Swal.fire("Éxito", data.message, "success").then(() =>
              window.location.reload()
            );
          } else {
            console.error("❌ Error en respuesta:", data.message);
            Swal.fire("Error", data.message, "error");
          }
        })
        .catch((error) => {
          console.error("❌ Error en eliminarCategoria:", error);
          Swal.fire(
            "Error",
            "No se pudo eliminar la categoría: " + error.message,
            "error"
          );
        });
    });
  }

  /**
   * Notifica a todas las ventanas abiertas (incluyendo la de productos)
   * sobre cambios en las categorías
   */
  notificarCambiosCategorias(tipo) {
    try {
      if (typeof BroadcastChannel !== "undefined") {
        const channel = new BroadcastChannel("categorias-updates");
        channel.postMessage({
          tipo: tipo,
          timestamp: new Date().toISOString(),
        });
        channel.close();
      }

      console.log(`[Categorías] Cambio detectado: ${tipo}`);
    } catch (error) {
      console.warn("No se pudo notificar sobre cambios de categorías:", error);
    }
  }

  mostrarError(mensaje) {
    Swal.fire({
      title: "Error",
      text: mensaje,
      icon: "error",
      confirmButtonText: "Aceptar",
    });
  }
}

document.addEventListener("DOMContentLoaded", function () {
  window.categoriaManager = new CategoriaManager();
});
