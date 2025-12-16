class ProductoManager {
  constructor() {
    this.modalProducto = null;
    this.esEditando = false;
    this.formularioEnviado = false;
    this.init();
  }

  init() {
    console.log("=== Inicializando ProductoManager ===");
    this.inicializarModal();
    this.inicializarEventos();
    this.verificarCSRF();
  }

  /**
   * ✅ Obtener token CSRF para peticiones POST
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
   * ✅ Crear headers con CSRF para fetch
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
    const modalElement = document.getElementById("modalProducto");
    if (!modalElement) {
      console.error("Modal de producto no encontrado");
      return;
    }

    this.modalProducto = new bootstrap.Modal(modalElement);

    const imagenInput = document.getElementById("imagenFile");
    if (imagenInput) {
      imagenInput.addEventListener("change", (e) => {
        this.mostrarVistaPrevia(e.target);
      });
    }

    const imagenUrlInput = document.getElementById("imagenUrl");
    if (imagenUrlInput) {
      imagenUrlInput.addEventListener("change", (e) => {
        this.mostrarVistaProviaURL(e.target.value);
      });
    }

    const form = document.getElementById("formProducto");
    if (form) {
      form.addEventListener("submit", (e) => {
        this.validarFormulario(e);
      });
    }

    // Cargar categorías en el select
    this.cargarCategorias();
  }

  inicializarEventos() {
    document.addEventListener("click", (e) => {
      if (e.target.closest(".btn-editar-producto")) {
        const button = e.target.closest(".btn-editar-producto");
        this.editarProducto(button.getAttribute("data-id"));
      }

      if (e.target.closest(".btn-toggle-disponible")) {
        const button = e.target.closest(".btn-toggle-disponible");
        this.toggleDisponible(button.getAttribute("data-id"));
      }

      if (e.target.closest(".btn-eliminar-producto")) {
        const button = e.target.closest(".btn-eliminar-producto");
        this.eliminarProducto(
          button.getAttribute("data-id"),
          button.getAttribute("data-nombre")
        );
      }

      if (e.target.closest(".btn-ver-producto")) {
        const button = e.target.closest(".btn-ver-producto");
        this.verProducto(button.getAttribute("data-id"));
      }
    });

    const btnAgregar = document.getElementById("btnAgregarProducto");
    if (btnAgregar) {
      btnAgregar.addEventListener("click", () => {
        this.abrirModalAgregar();
      });
    }

    const modalElement = document.getElementById("modalProducto");
    if (modalElement) {
      modalElement.addEventListener("hidden.bs.modal", () => {
        this.limpiarFormulario();
      });
    }

    // Filtros
    const filtroCategoria = document.getElementById("filtroCategoria");
    const filtroDisponibilidad = document.getElementById(
      "filtroDisponibilidad"
    );
    const btnBuscar = document.getElementById("btnBuscar");
    const buscarProducto = document.getElementById("buscarProducto");

    if (filtroCategoria) {
      filtroCategoria.addEventListener("change", () => this.aplicarFiltros());
    }
    if (filtroDisponibilidad) {
      filtroDisponibilidad.addEventListener("change", () =>
        this.aplicarFiltros()
      );
    }
    if (btnBuscar) {
      btnBuscar.addEventListener("click", () => this.aplicarFiltros());
    }
    if (buscarProducto) {
      buscarProducto.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          this.aplicarFiltros();
        }
      });
    }
  }

  verificarCSRF() {
    const { token, header } = this.getCsrfToken();
    console.log("=== Verificación CSRF ===");
    console.log("Token encontrado:", token ? "✅ SÍ" : "❌ NO");
    console.log("Header encontrado:", header ? "✅ SÍ" : "❌ NO");

    if (!token || !header) {
      console.error("⚠️⚠️⚠️ CSRF NO CONFIGURADO ⚠️⚠️⚠️");
    } else {
      console.log("✅ CSRF configurado correctamente");
    }
  }

  async cargarCategorias() {
    try {
      const response = await fetch("/api/categorias/activas");
      if (!response.ok) throw new Error("Error al cargar categorías");

      const categorias = await response.json();
      const select = document.getElementById("categoriaId");

      if (select) {
        // Limpiar opciones existentes excepto la primera
        while (select.options.length > 1) {
          select.remove(1);
        }

        // Agregar categorías
        categorias.forEach((cat) => {
          const option = document.createElement("option");
          option.value = cat.id;
          option.textContent = cat.nombre;
          select.appendChild(option);
        });
      }
    } catch (error) {
      console.error("Error al cargar categorías:", error);
    }
  }

  abrirModalAgregar() {
    this.esEditando = false;
    const titulo = document.getElementById("modalTitulo");
    const form = document.getElementById("formProducto");
    const btnGuardar = document.getElementById("btnGuardarProducto");

    if (titulo) titulo.textContent = "Nuevo Producto";
    if (form) form.action = "/superAdmin/productos/agregar";
    if (btnGuardar) {
      btnGuardar.innerHTML =
        '<i class="bi bi-check-circle"></i> Guardar Producto';
      btnGuardar.disabled = false;
    }

    this.limpiarFormulario();
    if (this.modalProducto) this.modalProducto.show();
  }

  async editarProducto(id) {
    try {
      const response = await fetch(`/superAdmin/productos/${id}`);
      if (!response.ok) throw new Error("Error al cargar el producto");

      const producto = await response.json();

      this.esEditando = true;
      const titulo = document.getElementById("modalTitulo");
      const form = document.getElementById("formProducto");
      const btnGuardar = document.getElementById("btnGuardarProducto");

      if (titulo) titulo.textContent = `Editar Producto: ${producto.nombre}`;
      if (form) form.action = "/superAdmin/productos/editar";

      this.llenarFormulario(producto);

      if (btnGuardar) {
        btnGuardar.innerHTML =
          '<i class="bi bi-check-circle"></i> Actualizar Producto';
        btnGuardar.disabled = false;
      }

      if (this.modalProducto) this.modalProducto.show();
    } catch (error) {
      console.error("Error en editarProducto:", error);
      this.mostrarError("No se pudo cargar los datos del producto");
    }
  }

  llenarFormulario(producto) {
    const idInput = document.getElementById("productoId");
    const nombreInput = document.getElementById("nombre");
    const categoriaSelect = document.getElementById("categoriaId");
    const precioInput = document.getElementById("precio");
    const stockInput = document.getElementById("stock");
    const descripcionInput = document.getElementById("descripcion");
    const imagenPreview = document.getElementById("imagenPreview");
    const previewImg = document.getElementById("previewImg");
    const imagenFile = document.getElementById("imagenFile");
    const imagenUrl = document.getElementById("imagenUrl");

    if (idInput) idInput.value = producto.id;
    if (nombreInput) nombreInput.value = producto.nombre;
    if (categoriaSelect) categoriaSelect.value = producto.categoria?.id || "";
    if (precioInput) precioInput.value = producto.precio;
    if (stockInput) stockInput.value = producto.stock;
    if (descripcionInput) descripcionInput.value = producto.descripcion || "";

    // Limpiar inputs de imagen cuando se edita
    if (imagenFile) imagenFile.value = "";
    if (imagenUrl) imagenUrl.value = "";

    if (imagenPreview && previewImg) {
      if (producto.imagen) {
        previewImg.src = producto.imagen;
        imagenPreview.classList.remove("d-none");
      } else {
        imagenPreview.classList.add("d-none");
      }
    }
  }

  limpiarFormulario() {
    const idInput = document.getElementById("productoId");
    const nombreInput = document.getElementById("nombre");
    const categoriaSelect = document.getElementById("categoriaId");
    const precioInput = document.getElementById("precio");
    const stockInput = document.getElementById("stock");
    const descripcionInput = document.getElementById("descripcion");
    const imagenInput = document.getElementById("imagenFile");
    const imagenUrlInput = document.getElementById("imagenUrl");
    const imagenPreview = document.getElementById("imagenPreview");

    if (idInput) idInput.value = "0";
    if (nombreInput) nombreInput.value = "";
    if (categoriaSelect) categoriaSelect.value = "";
    if (precioInput) precioInput.value = "";
    if (stockInput) stockInput.value = "";
    if (descripcionInput) descripcionInput.value = "";
    if (imagenInput) imagenInput.value = "";
    if (imagenUrlInput) imagenUrlInput.value = "";
    if (imagenPreview) imagenPreview.classList.add("d-none");

    this.limpiarValidaciones();
  }

  limpiarValidaciones() {
    const inputs = document.querySelectorAll(
      "#formProducto input, #formProducto textarea, #formProducto select"
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

  mostrarVistaProviaURL(url) {
    const preview = document.getElementById("imagenPreview");
    const previewImg = document.getElementById("previewImg");
    const urlInput = document.getElementById("imagenUrl");

    if (url && url.trim() !== "") {
      // Validar que sea una URL válida
      try {
        new URL(url);
        
        // Crear imagen temporal para validar que la URL es válida
        const img = new Image();
        img.onload = () => {
          if (previewImg) previewImg.src = url;
          if (preview) preview.classList.remove("d-none");
          this.mostrarExitoInput(urlInput);
          // Limpiar el input de file para evitar confusiones
          const fileInput = document.getElementById("imagenFile");
          if (fileInput) fileInput.value = "";
        };
        img.onerror = () => {
          this.mostrarErrorInput(urlInput, "La URL de imagen no es válida o no es accesible.");
          if (preview) preview.classList.add("d-none");
        };
        img.src = url;
      } catch (e) {
        this.mostrarErrorInput(urlInput, "Ingresa una URL válida (ej: https://...)");
        if (preview) preview.classList.add("d-none");
      }
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
    const categoriaSelect = document.getElementById("categoriaId");
    const precioInput = document.getElementById("precio");
    const stockInput = document.getElementById("stock");

    const nombre = nombreInput ? nombreInput.value.trim() : "";
    const categoria = categoriaSelect ? categoriaSelect.value : "";
    const precio = precioInput ? parseFloat(precioInput.value) : 0;
    const stock = stockInput ? parseInt(stockInput.value) : 0;

    let esValido = true;

    if (!nombre) {
      this.mostrarErrorInput(
        nombreInput,
        "El nombre del producto es obligatorio"
      );
      esValido = false;
    }

    if (!categoria) {
      this.mostrarErrorInput(categoriaSelect, "Debe seleccionar una categoría");
      esValido = false;
    }

    if (!precio || precio <= 0) {
      this.mostrarErrorInput(precioInput, "El precio debe ser mayor a 0");
      esValido = false;
    }

    if (stock < 0) {
      this.mostrarErrorInput(stockInput, "El stock no puede ser negativo");
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
    const btnGuardar = document.getElementById("btnGuardarProducto");
    if (btnGuardar) {
      btnGuardar.disabled = true;
      btnGuardar.innerHTML =
        '<i class="bi bi-hourglass-split"></i> Guardando...';
    }
  }

  /**
   * ✅ CORREGIDO: Toggle disponible con CSRF token
   */
  async toggleDisponible(id) {
    console.log("=== Toggle Disponible Producto - Inicio ===");
    console.log("ID del producto:", id);

    try {
      // Obtener información del producto para mostrar mensaje contextual
      const productoResponse = await fetch(`/superAdmin/productos/${id}`);
      if (!productoResponse.ok)
        throw new Error("No se pudo obtener información del producto");
      const producto = await productoResponse.json();

      let mensajeConfirmacion = "";
      if (producto.disponible) {
        mensajeConfirmacion =
          "¿Estás seguro de desactivar este producto? Los clientes no podrán verlo ni comprarlo.";
      } else {
        if (producto.stock > 0) {
          mensajeConfirmacion =
            "¿Estás seguro de activar este producto? Los clientes podrán verlo y comprarlo.";
        } else {
          mensajeConfirmacion =
            "No puedes activar un producto agotado. Primero actualiza el stock.";

          await Swal.fire({
            title: "Producto Agotado",
            text: mensajeConfirmacion,
            icon: "warning",
            confirmButtonText: "Entendido",
          });
          return;
        }
      }

      const result = await Swal.fire({
        title: producto.disponible
          ? "¿Desactivar producto?"
          : "¿Activar producto?",
        text: mensajeConfirmacion,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: producto.disponible
          ? "Sí, desactivar"
          : "Sí, activar",
        cancelButtonText: "Cancelar",
      });

      if (!result.isConfirmed) {
        console.log("Usuario canceló la operación");
        return;
      }

      console.log("Enviando petición POST...");
      const headers = this.getFetchHeaders();

      const response = await fetch(
        `/superAdmin/productos/toggle-disponible/${id}`,
        {
          method: "POST",
          headers: headers,
        }
      );

      console.log("Respuesta recibida - Status:", response.status);

      if (!response.ok) {
        const text = await response.text();
        console.error("Error del servidor:", text);
        throw new Error(`HTTP error! status: ${response.status} - ${text}`);
      }

      const data = await response.json();
      console.log("📊 Datos recibidos:", data);

      if (data.success) {
        this.notificarCambiosProductos("toggle-disponible");
        console.log("✅ Operación exitosa");

        const mensajeExito = producto.disponible
          ? "Producto desactivado correctamente. Los clientes no podrán verlo."
          : "Producto activado correctamente. Los clientes podrán verlo y comprarlo.";

        await Swal.fire("Éxito", mensajeExito, "success");
        window.location.reload();
      } else {
        console.error("❌ Error en respuesta:", data.message);
        await Swal.fire("Error", data.message || "Error desconocido", "error");
      }
    } catch (error) {
      console.error("❌ Error en toggleDisponible:", error);
      await Swal.fire(
        "Error",
        "No se pudo cambiar la disponibilidad: " + error.message,
        "error"
      );
    }
  }

  /**
   * ✅ Eliminar producto con CSRF token
   */
  async eliminarProducto(id, nombre) {
    console.log("=== Eliminar Producto - Inicio ===");
    console.log("ID:", id);
    console.log("Nombre:", nombre);

    try {
      const result = await Swal.fire({
        title: "¿Eliminar producto?",
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
      });

      if (!result.isConfirmed) {
        console.log("Usuario canceló la operación");
        return;
      }

      console.log("Enviando petición GET...");
      const response = await fetch(`/superAdmin/productos/eliminar/${id}`, {
        method: "GET",
      });

      console.log("Respuesta recibida - Status:", response.status);

      if (response.redirected) {
        // Si hay redirección, seguirla
        window.location.href = response.url;
        return;
      }

      if (!response.ok) {
        const text = await response.text();
        console.error("Error del servidor:", text);
        throw new Error(`HTTP error! status: ${response.status} - ${text}`);
      }

      // Notificar cambios a todas las ventanas
      this.notificarCambiosProductos("eliminar");
      console.log("✅ Producto eliminado exitosamente");

      await Swal.fire("Éxito", "Producto eliminado correctamente", "success");

      // Recargar la página
      window.location.reload();
    } catch (error) {
      console.error("❌ Error en eliminarProducto:", error);
      await Swal.fire(
        "Error",
        "No se pudo eliminar el producto: " + error.message,
        "error"
      );
    }
  }

  /**
   * Notifica a todas las ventanas abiertas sobre cambios en los productos
   */
  notificarCambiosProductos(tipo) {
    try {
      if (typeof BroadcastChannel !== "undefined") {
        const channel = new BroadcastChannel("productos-updates");
        channel.postMessage({
          tipo: tipo,
          timestamp: new Date().toISOString(),
        });
        channel.close();
      }

      console.log(`[Productos] Cambio detectado: ${tipo}`);
    } catch (error) {
      console.warn("No se pudo notificar sobre cambios de productos:", error);
    }
  }

  aplicarFiltros() {
    const categoria = document.getElementById("filtroCategoria")?.value;
    const disponibilidad = document.getElementById(
      "filtroDisponibilidad"
    )?.value;
    const buscar = document.getElementById("buscarProducto")?.value;

    let url = "/superAdmin/productos?";
    const params = [];

    if (categoria) params.push(`categoria=${categoria}`);
    if (disponibilidad) params.push(`disponible=${disponibilidad}`);
    if (buscar) params.push(`buscar=${encodeURIComponent(buscar)}`);

    if (params.length > 0) {
      url += params.join("&");
    }

    window.location.href = url;
  }

  async verProducto(id) {
    try {
      // Redirigir a la página de detalles del producto
      window.open(`/producto/${id}`, "_blank");
    } catch (error) {
      console.error("Error al ver producto:", error);
      this.mostrarError("No se pudo abrir los detalles del producto");
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

  limpiarImagen() {
    const fileInput = document.getElementById("imagenFile");
    const urlInput = document.getElementById("imagenUrl");
    const preview = document.getElementById("imagenPreview");

    if (fileInput) fileInput.value = "";
    if (urlInput) urlInput.value = "";
    if (preview) preview.classList.add("d-none");
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
  window.productoManager = new ProductoManager();
});
