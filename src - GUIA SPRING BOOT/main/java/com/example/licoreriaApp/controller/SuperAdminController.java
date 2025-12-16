// licoreriaApp/src/main/java/com/example/licoreriaApp/controller/SuperAdminController.java
package com.example.licoreriaApp.controller;

import com.example.licoreriaApp.model.*;
import com.example.licoreriaApp.service.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import jakarta.servlet.http.HttpSession;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Controller
@RequestMapping("/superAdmin")
public class SuperAdminController {

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private ProductoService productoService;

    @Autowired
    private CategoriaService categoriaService;

    @Autowired
    private CompraService compraService;

    @Autowired
    private ConfiguracionSistemaService configuracionSistemaService;

    // Rutas donde se guardarán las imágenes
    private static final String UPLOAD_DIR_PRODUCTOS = "src/main/resources/static/img/productos/";
    private static final String UPLOAD_DIR_CATEGORIAS = "src/main/resources/static/img/categorias/";

    // =========================================
    // 🔷 MIDDLEWARE DE PERMISOS
    // =========================================
    private boolean tienePermiso(HttpSession session, String rolRequerido) {
        Usuario usuario = (Usuario) session.getAttribute("usuario");
        if (usuario == null)
            return false;

        switch (rolRequerido) {
            case "ROLE_SUPER_ADMIN":
                return usuario.esSuperAdmin();
            case "ROLE_ADMIN":
                return usuario.esAdmin() || usuario.esSuperAdmin();
            default:
                return usuario.tieneRol(rolRequerido);
        }
    }

    // =========================================
    // 🔷 DASHBOARD Y PÁGINAS PRINCIPALES
    // =========================================
    @GetMapping("")
    public String homeSuperAdmin(HttpSession session) {
        if (!tienePermiso(session, "ROLE_SUPER_ADMIN")) {
            return "redirect:/acceso-denegado";
        }
        return "redirect:/superAdmin/dashboard";
    }

    @GetMapping("/dashboard")
    public String dashboard(HttpSession session, Model model) {
        if (!tienePermiso(session, "ROLE_SUPER_ADMIN")) {
            return "redirect:/acceso-denegado";
        }

        Usuario usuario = (Usuario) session.getAttribute("usuario");
        model.addAttribute("usuario", usuario);

        // Estadísticas reales
        try {
            model.addAttribute("totalProductos", productoService.contarTotal());
            model.addAttribute("productosDisponibles", productoService.contarDisponibles());
            model.addAttribute("stockTotal", productoService.calcularValorStockTotal());
            model.addAttribute("totalCategorias", categoriaService.listarTodas().size());
            
            // Agregar métricas de ventas
            java.util.Map<String, Object> metricas = compraService.obtenerMetricasVentas();
            model.addAttribute("totalVentas", metricas.get("totalVentas"));
            model.addAttribute("ventasHoy", metricas.get("ventasHoy"));
            model.addAttribute("productosMasVendidos", metricas.get("productosMasVendidos"));
            model.addAttribute("topProductosRevenue", metricas.get("topProductosRevenue"));
            model.addAttribute("totalComprasCompletadas", metricas.get("totalComprasCompletadas"));
        } catch (Exception e) {
            model.addAttribute("totalProductos", 0);
            model.addAttribute("productosDisponibles", 0);
            model.addAttribute("stockTotal", 0.0);
            model.addAttribute("totalCategorias", 0);
            
            // Valores por defecto para métricas
            model.addAttribute("totalVentas", 0.0);
            model.addAttribute("ventasHoy", 0.0);
            model.addAttribute("productosMasVendidos", java.util.List.of());
            model.addAttribute("topProductosRevenue", java.util.List.of());
            model.addAttribute("totalComprasCompletadas", 0);
        }

        return "superAdmin/dashboard";
    }

    @GetMapping("/acceso-denegado")
    public String accesoDenegado(HttpSession session, Model model) {
        Usuario usuario = (Usuario) session.getAttribute("usuario");
        model.addAttribute("usuario", usuario);
        return "acceso-denegado";
    }

    // 🔷 CONFIGURACIÓN DEL SISTEMA
    // =========================================
    @GetMapping("/configuracion")
    public String mostrarConfiguracion(HttpSession session, Model model) {
        if (!tienePermiso(session, "ROLE_SUPER_ADMIN")) {
            return "redirect:/acceso-denegado";
        }

        try {
            Usuario usuario = (Usuario) session.getAttribute("usuario");
            model.addAttribute("usuario", usuario);
            
            // Cargar configuración actual
            com.example.licoreriaApp.model.ConfiguracionSistema config = 
                configuracionSistemaService.obtenerConfiguracion();
            
            model.addAttribute("aplicarIGV", config.isAplicarIGV());
            model.addAttribute("porcentajeIGV", config.getPorcentajeIGV());
            model.addAttribute("aplicarEnvio", config.isAplicarEnvio());
            model.addAttribute("costoEnvio", config.getCostoEnvio());
        } catch (Exception e) {
            model.addAttribute("error", "Error al cargar configuración: " + e.getMessage());
        }

        return "superAdmin/configuracion";
    }

    @PostMapping("/configuracion/actualizar")
    public String actualizarConfiguracion(
            @RequestParam(value = "aplicarIGV", required = false) String aplicarIGVStr,
            @RequestParam(value = "porcentajeIGV", required = false) Double porcentajeIGV,
            @RequestParam(value = "aplicarEnvio", required = false) String aplicarEnvioStr,
            @RequestParam(value = "costoEnvio", required = false) Double costoEnvio,
            HttpSession session,
            Model model) {

        if (!tienePermiso(session, "ROLE_SUPER_ADMIN")) {
            return "redirect:/acceso-denegado";
        }

        try {
            Usuario usuario = (Usuario) session.getAttribute("usuario");
            model.addAttribute("usuario", usuario);
            
            // Convertir valores string a boolean (html checkbox envía "true" como string)
            boolean aplicarIGV = "true".equals(aplicarIGVStr);
            boolean aplicarEnvio = "true".equals(aplicarEnvioStr);
            
            // Usar valores por defecto si son nulos
            if (porcentajeIGV == null) porcentajeIGV = 18.0;
            if (costoEnvio == null) costoEnvio = 15.0;
            
            // Actualizar configuración
            configuracionSistemaService.actualizarConfiguracion(
                    aplicarIGV,
                    porcentajeIGV,
                    aplicarEnvio,
                    costoEnvio
            );
            
            model.addAttribute("success", "Configuración actualizada correctamente");
            model.addAttribute("aplicarIGV", aplicarIGV);
            model.addAttribute("porcentajeIGV", porcentajeIGV);
            model.addAttribute("aplicarEnvio", aplicarEnvio);
            model.addAttribute("costoEnvio", costoEnvio);
        } catch (Exception e) {
            model.addAttribute("error", "Error al actualizar: " + e.getMessage());
            e.printStackTrace();
        }

        return "redirect:/superAdmin/configuracion";
    }

    // API para obtener configuración (acceso público para carrito)
    @GetMapping("/api/configuracion")
    @ResponseBody
    public ResponseEntity<java.util.Map<String, Object>> obtenerConfiguracionAPI() {
        try {
            java.util.Map<String, Object> response = new java.util.HashMap<>();
            
            com.example.licoreriaApp.model.ConfiguracionSistema config = 
                configuracionSistemaService.obtenerConfiguracion();
            
            response.put("aplicarIGV", config.isAplicarIGV());
            response.put("porcentajeIGV", config.getPorcentajeIGV());
            response.put("aplicarEnvio", config.isAplicarEnvio());
            response.put("costoEnvio", config.getCostoEnvio());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Verifica si el usuario tiene un permiso específico
     */
    private boolean tienePermisoEspecifico(HttpSession session, String codigoPermiso) {
        Usuario usuario = (Usuario) session.getAttribute("usuario");
        if (usuario == null)
            return false;

        // Super Admin tiene todos los permisos
        if (usuario.esSuperAdmin()) {
            return true;
        }

        return usuario.getRoles().stream()
                .anyMatch(rol -> rol.tienePermiso(codigoPermiso));
    }
    // =========================================
    // 🔷 GESTIÓN DE PRODUCTOS
    // =========================================

    @GetMapping("/productos")
    public String gestionProductos(
            HttpSession session,
            Model model,
            @RequestParam(defaultValue = "1") int pagina,
            @RequestParam(defaultValue = "10") int tamaño,
            @RequestParam(required = false) String buscar,
            @RequestParam(required = false) Integer categoria) {

        if (!tienePermiso(session, "ROLE_SUPER_ADMIN")) {
            return "redirect:/acceso-denegado";
        }

        try {
            Usuario usuario = (Usuario) session.getAttribute("usuario");
            model.addAttribute("usuario", usuario);

            Pageable pageable = PageRequest.of(pagina - 1, tamaño, Sort.by(Sort.Direction.DESC, "id"));
            Page<Producto> paginaProductos;

            // Aplicar filtros si existen
            if (buscar != null && !buscar.trim().isEmpty()) {
                paginaProductos = productoService.buscarPorNombrePaginado(buscar, pageable);
                model.addAttribute("buscar", buscar);
            } else {
                paginaProductos = productoService.obtenerProductosPaginados(pageable);
            }

            model.addAttribute("productos", paginaProductos.getContent());
            model.addAttribute("paginaActual", pagina);
            model.addAttribute("totalPaginas", paginaProductos.getTotalPages());
            model.addAttribute("totalProductos", paginaProductos.getTotalElements());
            model.addAttribute("tamañoPagina", tamaño);

            // Estadísticas
            model.addAttribute("productosDisponibles", productoService.contarDisponibles());
            model.addAttribute("stockTotal", productoService.calcularValorStockTotal());
            model.addAttribute("totalCategorias", categoriaService.listarTodas().size());

            model.addAttribute("categorias", categoriaService.listarTodas());

            return "superAdmin/gestion-productos";

        } catch (Exception e) {
            model.addAttribute("error", "Error al cargar los productos: " + e.getMessage());
            model.addAttribute("productos", new ArrayList<>());
            model.addAttribute("categorias", new ArrayList<>());
            return "superAdmin/gestion-productos";
        }
    }

    @GetMapping("/productos/{id}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> obtenerProducto(@PathVariable int id, HttpSession session) {
        if (!tienePermiso(session, "ROLE_SUPER_ADMIN")) {
            return ResponseEntity.status(403).build();
        }

        try {
            Producto producto = productoService.obtenerPorId(id);
            if (producto == null) {
                return ResponseEntity.notFound().build();
            }

            // Crear un mapa para evitar problemas de serialización
            Map<String, Object> productoData = new HashMap<>();
            productoData.put("id", producto.getId());
            productoData.put("nombre", producto.getNombre());
            productoData.put("precio", producto.getPrecio());
            productoData.put("stock", producto.getStock());
            productoData.put("descripcion", producto.getDescripcion());
            productoData.put("imagen", producto.getImagen());
            productoData.put("disponible", producto.isDisponible());

            // Agregar datos de la categoría
            if (producto.getCategoria() != null) {
                Map<String, Object> categoriaData = new HashMap<>();
                categoriaData.put("id", producto.getCategoria().getId());
                categoriaData.put("nombre", producto.getCategoria().getNombre());
                productoData.put("categoria", categoriaData);
            } else {
                productoData.put("categoria", null);
            }

            return ResponseEntity.ok(productoData);
        } catch (Exception e) {
            System.err.println("Error al obtener producto: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    @PostMapping("/productos/agregar")
    public String agregarProductoRedirect(
            @RequestParam Map<String, String> params,
            @RequestParam(value = "imagenFile", required = false) MultipartFile imagenFile,
            @RequestParam(value = "imagenUrl", required = false) String imagenUrl,
            HttpSession session,
            RedirectAttributes redirectAttributes) {

        return guardarProducto(
                null, // id nulo para nuevo producto
                params.get("nombre"),
                Integer.parseInt(params.get("categoriaId")),
                Double.parseDouble(params.get("precio")),
                Integer.parseInt(params.get("stock")),
                params.get("descripcion"),
                imagenFile,
                imagenUrl,
                session,
                redirectAttributes);
    }

    @PostMapping("/productos/editar")
    public String editarProductoRedirect(
            @RequestParam Map<String, String> params,
            @RequestParam(value = "imagenFile", required = false) MultipartFile imagenFile,
            @RequestParam(value = "imagenUrl", required = false) String imagenUrl,
            HttpSession session,
            RedirectAttributes redirectAttributes) {

        return guardarProducto(
                Integer.parseInt(params.get("id")),
                params.get("nombre"),
                Integer.parseInt(params.get("categoriaId")),
                Double.parseDouble(params.get("precio")),
                Integer.parseInt(params.get("stock")),
                params.get("descripcion"),
                imagenFile,
                imagenUrl,
                session,
                redirectAttributes);
    }

    @GetMapping("/productos/eliminar/{id}")
    public String eliminarProducto(
            @PathVariable int id,
            HttpSession session,
            RedirectAttributes redirectAttributes) {

        if (!tienePermiso(session, "ROLE_SUPER_ADMIN")) {
            return "redirect:/acceso-denegado";
        }

        try {
            Producto producto = productoService.obtenerPorId(id);
            if (producto == null) {
                redirectAttributes.addFlashAttribute("error", "Producto no encontrado");
                return "redirect:/superAdmin/productos";
            }

            String nombreProducto = producto.getNombre();

            // Verificar permiso específico para eliminar
            if (!tienePermisoEspecifico(session, "PRODUCTO_ELIMINAR")) {
                redirectAttributes.addFlashAttribute("error", "No tienes permiso para eliminar productos");
                return "redirect:/superAdmin/productos";
            }

            // Eliminar de la base de datos
            productoService.eliminar(id);

            redirectAttributes.addFlashAttribute("success",
                    "Producto '" + nombreProducto + "' eliminado exitosamente");

        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error",
                    "Error al eliminar el producto: " + e.getMessage());
            e.printStackTrace();
        }

        return "redirect:/superAdmin/productos";
    }

    // Método para cambiar disponibilidad rápida
    // =========================================
    // 🔷 REEMPLAZO COMPLETO DE LOS MÉTODOS PROBLEMÁTICOS
    // =========================================

    /**
     * ✅ SOLUCIÓN: Toggle disponible de producto
     * Reemplaza el método existente en SuperAdminController.java
     */
    @PostMapping("/productos/toggle-disponible/{id}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> toggleDisponible(@PathVariable int id, HttpSession session) {
        Map<String, Object> response = new HashMap<>();

        try {
            System.out.println("=== Toggle Disponible - Inicio ===");
            System.out.println("ID del producto: " + id);

            if (!tienePermiso(session, "ROLE_SUPER_ADMIN")) {
                System.out.println("❌ Sin permisos");
                response.put("success", false);
                response.put("message", "Sin permisos");
                return ResponseEntity.status(403).body(response);
            }

            Producto producto = productoService.obtenerPorId(id);
            if (producto == null) {
                System.out.println("❌ Producto no encontrado: " + id);
                response.put("success", false);
                response.put("message", "Producto no encontrado");
                return ResponseEntity.status(404).body(response);
            }

            boolean estadoAnterior = producto.isDisponible();
            producto.setDisponible(!estadoAnterior);
            productoService.guardar(producto);

            System.out.println("✅ Producto actualizado: " + producto.getNombre());
            System.out.println("   Estado anterior: " + estadoAnterior);
            System.out.println("   Estado nuevo: " + producto.isDisponible());

            response.put("success", true);
            response.put("message", "Disponibilidad actualizada correctamente");
            response.put("disponible", producto.isDisponible());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("❌ Error en toggleDisponible: " + e.getMessage());
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Error al actualizar: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    @PostMapping("/productos/guardar")
    public String guardarProducto(
            @RequestParam(value = "id", required = false) Integer id,
            @RequestParam("nombre") String nombre,
            @RequestParam("categoriaId") int categoriaId,
            @RequestParam("precio") double precio,
            @RequestParam("stock") int stock,
            @RequestParam(value = "descripcion", required = false) String descripcion,
            @RequestParam(value = "imagenFile", required = false) MultipartFile imagenFile,
            @RequestParam(value = "imagenUrl", required = false) String imagenUrl,
            HttpSession session,
            RedirectAttributes redirectAttributes) {

        if (!tienePermiso(session, "ROLE_SUPER_ADMIN")) {
            redirectAttributes.addFlashAttribute("error", "No tienes permiso para esta acción");
            return "redirect:/superAdmin/productos";
        }

        try {
            // Validaciones
            if (nombre == null || nombre.trim().isEmpty()) {
                redirectAttributes.addFlashAttribute("error", "El nombre del producto es obligatorio");
                return "redirect:/superAdmin/productos";
            }

            if (precio < 0) {
                redirectAttributes.addFlashAttribute("error", "El precio no puede ser negativo");
                return "redirect:/superAdmin/productos";
            }

            if (stock < 0) {
                redirectAttributes.addFlashAttribute("error", "El stock no puede ser negativo");
                return "redirect:/superAdmin/productos";
            }

            // Buscar categoría
            Categoria categoria = categoriaService.obtenerPorId(categoriaId);
            if (categoria == null) {
                redirectAttributes.addFlashAttribute("error", "Categoría no válida");
                return "redirect:/superAdmin/productos";
            }

            // Determinar si es nuevo o actualización
            Producto producto;
            boolean esNuevo = (id == null || id == 0);

            if (esNuevo) {
                producto = new Producto();
            } else {
                producto = productoService.obtenerPorId(id);
                if (producto == null) {
                    redirectAttributes.addFlashAttribute("error", "Producto no encontrado");
                    return "redirect:/superAdmin/productos";
                }
            }

            // Actualizar datos del producto
            producto.setNombre(nombre.trim());
            producto.setCategoria(categoria);
            producto.setPrecio(precio);
            producto.setStock(stock);
            producto.setDescripcion(descripcion != null ? descripcion.trim() : "");
            producto.setDisponible(stock > 0);

            // Procesar imagen: archivo subido tiene prioridad sobre URL
            if (imagenFile != null && !imagenFile.isEmpty()) {
                // Eliminar imagen anterior si existe (solo en edición)
                if (!esNuevo && producto.getImagen() != null && !producto.getImagen().isEmpty()) {
                    eliminarImagen(producto.getImagen(), UPLOAD_DIR_PRODUCTOS);
                }
                String rutaImagen = guardarImagen(imagenFile, UPLOAD_DIR_PRODUCTOS, "/img/productos/");
                producto.setImagen(rutaImagen);
            } else if (imagenUrl != null && !imagenUrl.trim().isEmpty()) {
                // Si hay URL de imagen, usarla directamente
                producto.setImagen(imagenUrl.trim());
            }

            // Guardar en la base de datos
            productoService.guardar(producto);

            String mensaje = esNuevo
                    ? "Producto '" + nombre + "' agregado exitosamente"
                    : "Producto '" + nombre + "' actualizado exitosamente";

            redirectAttributes.addFlashAttribute("success", mensaje);

        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "Error al guardar el producto: " + e.getMessage());
            e.printStackTrace();
        }

        return "redirect:/superAdmin/productos";
    }
    // =========================================
    // 🔷 GESTIÓN DE CATEGORÍAS
    // =========================================

    @GetMapping("/categorias")
    @Transactional(readOnly = true)
    public String gestionCategorias(HttpSession session, Model model) {
        if (!tienePermiso(session, "ROLE_SUPER_ADMIN")) {
            return "redirect:/acceso-denegado";
        }

        try {
            Usuario usuario = (Usuario) session.getAttribute("usuario");
            model.addAttribute("usuario", usuario);

            List<Categoria> categorias = categoriaService.listarTodas();

            // Forzar la carga de datos lazy para evitar problemas de serialización
            if (categorias != null) {
                categorias.forEach(categoria -> {
                    // Acceder a la cantidad de productos para forzar la carga
                    categoria.getCantidadProductos();
                });
            }

            System.out.println("DEBUG - Categorías cargadas: " + (categorias != null ? categorias.size() : 0));

            model.addAttribute("categorias", categorias != null ? categorias : new ArrayList<>());

            return "superAdmin/gestion-categorias";
        } catch (Exception e) {
            System.err.println("ERROR en gestionCategorias: " + e.getMessage());
            e.printStackTrace();
            model.addAttribute("categorias", new ArrayList<>());
            model.addAttribute("error", "Error al cargar las categorías: " + e.getMessage());
            return "superAdmin/gestion-categorias";
        }
    }

    @GetMapping("/categorias/{id}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> obtenerCategoria(@PathVariable int id, HttpSession session) {
        if (!tienePermiso(session, "ROLE_SUPER_ADMIN")) {
            return ResponseEntity.status(403).build();
        }

        try {
            Categoria categoria = categoriaService.obtenerPorId(id);
            if (categoria == null) {
                return ResponseEntity.notFound().build();
            }

            // Crear un mapa para evitar problemas de serialización
            Map<String, Object> categoriaData = new HashMap<>();
            categoriaData.put("id", categoria.getId());
            categoriaData.put("nombre", categoria.getNombre());
            categoriaData.put("descripcion", categoria.getDescripcion());
            categoriaData.put("imagen", categoria.getImagen());
            categoriaData.put("activa", categoria.isActiva());

            return ResponseEntity.ok(categoriaData);
        } catch (Exception e) {
            System.err.println("Error al obtener categoría: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    @PostMapping("/categorias/guardar")
    public String guardarCategoria(
            @RequestParam(value = "id", defaultValue = "0") int id,
            @RequestParam("nombre") String nombre,
            @RequestParam(value = "descripcion", required = false) String descripcion,
            @RequestParam(value = "imagenFile", required = false) MultipartFile imagenFile,
            HttpSession session,
            RedirectAttributes redirectAttributes) {

        if (!tienePermiso(session, "ROLE_SUPER_ADMIN")) {
            return "redirect:/acceso-denegado";
        }

        try {
            // Validaciones
            if (nombre == null || nombre.trim().isEmpty()) {
                redirectAttributes.addFlashAttribute("error", "El nombre de la categoría es obligatorio");
                return "redirect:/superAdmin/categorias";
            }

            if (nombre.trim().length() < 2) {
                redirectAttributes.addFlashAttribute("error", "El nombre debe tener al menos 2 caracteres");
                return "redirect:/superAdmin/categorias";
            }

            if (nombre.trim().length() > 100) {
                redirectAttributes.addFlashAttribute("error", "El nombre no puede exceder 100 caracteres");
                return "redirect:/superAdmin/categorias";
            }

            Categoria categoria;
            boolean esNueva = (id == 0);

            if (esNueva) {
                categoria = new Categoria();
                categoria.setActiva(true);
            } else {
                categoria = categoriaService.obtenerPorId(id);
                if (categoria == null) {
                    redirectAttributes.addFlashAttribute("error", "Categoría no encontrada");
                    return "redirect:/superAdmin/categorias";
                }
            }

            // Actualizar datos
            categoria.setNombre(nombre.trim());
            categoria.setDescripcion(descripcion != null ? descripcion.trim() : "");

            // Procesar imagen
            if (imagenFile != null && !imagenFile.isEmpty()) {
                // Validar tipo y tamaño de archivo
                String tiposPermitidos = "image/jpeg,image/png,image/webp";
                if (!tiposPermitidos.contains(imagenFile.getContentType())) {
                    redirectAttributes.addFlashAttribute("error",
                            "Formato no válido. Use JPG, PNG o WebP.");
                    return "redirect:/superAdmin/categorias";
                }

                long maxSize = 5 * 1024 * 1024; // 5MB
                if (imagenFile.getSize() > maxSize) {
                    redirectAttributes.addFlashAttribute("error", "La imagen debe ser menor a 5MB.");
                    return "redirect:/superAdmin/categorias";
                }

                // Eliminar imagen anterior si existe
                if (categoria.getImagen() != null && !categoria.getImagen().isEmpty()) {
                    eliminarImagen(categoria.getImagen(), UPLOAD_DIR_CATEGORIAS);
                }
                String rutaImagen = guardarImagen(imagenFile, UPLOAD_DIR_CATEGORIAS, "/img/categorias/");
                categoria.setImagen(rutaImagen);
            }

            // Guardar
            categoriaService.guardar(categoria);

            redirectAttributes.addFlashAttribute("success",
                    esNueva ? "Categoría '" + nombre + "' creada exitosamente"
                            : "Categoría '" + nombre + "' actualizada exitosamente");

        } catch (IOException e) {
            redirectAttributes.addFlashAttribute("error",
                    "Error al procesar la imagen: " + e.getMessage());
            e.printStackTrace();
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error",
                    "Error al guardar la categoría: " + e.getMessage());
            e.printStackTrace();
        }

        return "redirect:/superAdmin/categorias";
    }

    @PostMapping("/categorias/toggle-activa/{id}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> toggleCategoriaActiva(@PathVariable int id, HttpSession session) {
        Map<String, Object> response = new HashMap<>();

        try {
            System.out.println("=== Toggle Activa Categoría - Inicio ===");
            System.out.println("ID de la categoría: " + id);

            if (!tienePermiso(session, "ROLE_SUPER_ADMIN")) {
                System.out.println("❌ Sin permisos");
                response.put("success", false);
                response.put("message", "Sin permisos");
                return ResponseEntity.status(403).body(response);
            }

            Categoria categoria = categoriaService.obtenerPorId(id);
            if (categoria == null) {
                System.out.println("❌ Categoría no encontrada: " + id);
                response.put("success", false);
                response.put("message", "Categoría no encontrada");
                return ResponseEntity.status(404).body(response);
            }

            boolean estadoAnterior = categoria.isActiva();
            categoria.setActiva(!estadoAnterior);
            categoriaService.guardar(categoria);

            System.out.println("✅ Categoría actualizada: " + categoria.getNombre());
            System.out.println("   Estado anterior: " + estadoAnterior);
            System.out.println("   Estado nuevo: " + categoria.isActiva());

            response.put("success", true);
            response.put("message", "Estado actualizado correctamente");
            response.put("activa", categoria.isActiva());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("❌ Error en toggleCategoriaActiva: " + e.getMessage());
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Error al actualizar el estado: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    @PostMapping("/categorias/eliminar/{id}")
    @ResponseBody
    @Transactional // ✅ AGREGAR ESTA ANOTACIÓN
    public ResponseEntity<Map<String, Object>> eliminarCategoria(@PathVariable int id, HttpSession session) {
        Map<String, Object> response = new HashMap<>();

        try {
            System.out.println("=== Eliminar Categoría - Inicio ===");
            System.out.println("ID de la categoría: " + id);

            if (!tienePermiso(session, "ROLE_SUPER_ADMIN")) {
                System.out.println("❌ Sin permisos");
                response.put("success", false);
                response.put("message", "Sin permisos");
                return ResponseEntity.status(403).body(response);
            }

            Categoria categoria = categoriaService.obtenerPorId(id);
            if (categoria == null) {
                System.out.println("❌ Categoría no encontrada: " + id);
                response.put("success", false);
                response.put("message", "Categoría no encontrada");
                return ResponseEntity.status(404).body(response);
            }

            String nombreCategoria = categoria.getNombre();
            System.out.println("Categoría encontrada: " + nombreCategoria);

            // ✅ CORREGIDO: Inicializar la colección de productos dentro de la transacción
            int cantidadProductos = 0;
            try {
                // Forzar la inicialización de la colección productos
                if (categoria.getProductos() != null) {
                    cantidadProductos = categoria.getProductos().size(); // Esto fuerza la carga
                    System.out.println("Productos asociados: " + cantidadProductos);
                }
            } catch (Exception e) {
                // Si hay error de lazy loading, usar método alternativo
                System.out.println("Usando método alternativo para contar productos...");
                cantidadProductos = categoriaService.contarProductosPorCategoria(id);
            }

            if (cantidadProductos > 0) {
                System.out.println("❌ No se puede eliminar - tiene productos asociados");
                response.put("success", false);
                response.put("message",
                        "No se puede eliminar una categoría con " + cantidadProductos + " producto(s) asociado(s)");
                return ResponseEntity.status(400).body(response);
            }

            // Eliminar imagen si existe
            if (categoria.getImagen() != null && !categoria.getImagen().isEmpty()) {
                System.out.println("Eliminando imagen: " + categoria.getImagen());
                try {
                    eliminarImagen(categoria.getImagen(), UPLOAD_DIR_CATEGORIAS);
                } catch (Exception imgEx) {
                    System.err.println("⚠️ Error al eliminar imagen (continuando): " + imgEx.getMessage());
                }
            }

            // Eliminar la categoría
            categoriaService.eliminar(id);
            System.out.println("✅ Categoría eliminada: " + nombreCategoria);

            response.put("success", true);
            response.put("message", "Categoría '" + nombreCategoria + "' eliminada correctamente");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("❌ Error al eliminar categoría: " + e.getMessage());
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Error al eliminar la categoría: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    // =========================================
    // 🔷 GESTIÓN DE USUARIOS
    // =========================================

    @GetMapping("/usuarios")
    public String gestionUsuarios(HttpSession session, Model model) {
        if (!tienePermiso(session, "ROLE_SUPER_ADMIN")) {
            return "redirect:/acceso-denegado";
        }

        Usuario usuario = (Usuario) session.getAttribute("usuario");
        model.addAttribute("usuario", usuario);

        try {
            // ✅ CARGAR USUARIOS CON ROLES
            List<Usuario> usuarios = usuarioService.obtenerTodos();
            System.out.println("DEBUG - Usuarios encontrados: " + usuarios.size());

            // ✅ DEBUG DETALLADO
            for (Usuario u : usuarios) {
                System.out.println("DEBUG - Usuario: " + u.getNombres() + " " + u.getApellidoPaterno() +
                        " | Roles: " + (u.getRoles() != null ? u.getRoles().size() : 0));
                if (u.getRoles() != null) {
                    u.getRoles().forEach(rol -> System.out.println("  - " + rol.getNombre()));
                }
            }

            model.addAttribute("usuarios", usuarios);

            // Calcular estadísticas
            long usuariosConTelefono = usuarios.stream()
                    .filter(u -> u.getNumero() != null && !u.getNumero().trim().isEmpty())
                    .count();

            long usuariosConDireccion = usuarios.stream()
                    .filter(u -> u.getDireccion1() != null && !u.getDireccion1().trim().isEmpty())
                    .count();

            long usuariosConGenero = usuarios.stream()
                    .filter(u -> u.getGenero() != null && !u.getGenero().trim().isEmpty())
                    .count();

            model.addAttribute("usuariosConTelefono", usuariosConTelefono);
            model.addAttribute("usuariosConDireccion", usuariosConDireccion);
            model.addAttribute("usuariosConGenero", usuariosConGenero);

            return "superAdmin/gestion-usuarios";

        } catch (Exception e) {
            System.err.println("ERROR en gestión usuarios: " + e.getMessage());
            e.printStackTrace();

            model.addAttribute("usuarios", new ArrayList<>());
            model.addAttribute("usuariosConTelefono", 0L);
            model.addAttribute("usuariosConDireccion", 0L);
            model.addAttribute("usuariosConGenero", 0L);
            model.addAttribute("error", "Error al cargar usuarios: " + e.getMessage());

            return "superAdmin/gestion-usuarios";
        }
    }

    @GetMapping("/usuarios/{id}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> obtenerUsuario(@PathVariable Long id, HttpSession session) {
        if (!tienePermiso(session, "ROLE_SUPER_ADMIN")) {
            return ResponseEntity.status(403).build();
        }

        try {
            Optional<Usuario> usuarioOpt = usuarioService.obtenerPorId(id);
            if (usuarioOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Usuario usuario = usuarioOpt.get();

            // ✅ CREAR MAPA CON TODOS LOS DATOS NECESARIOS
            Map<String, Object> usuarioData = new HashMap<>();
            usuarioData.put("id", usuario.getId());
            usuarioData.put("user", usuario.getUser());
            usuarioData.put("nombres", usuario.getNombres());
            usuarioData.put("apellidoPaterno", usuario.getApellidoPaterno());
            usuarioData.put("apellidoMaterno", usuario.getApellidoMaterno());
            usuarioData.put("correo", usuario.getCorreo());
            usuarioData.put("numero", usuario.getNumero());
            usuarioData.put("genero", usuario.getGenero());
            usuarioData.put("direccion1", usuario.getDireccion1());
            usuarioData.put("direccion2", usuario.getDireccion2());
            usuarioData.put("dni", usuario.getDni());
            usuarioData.put("tipoDoc", usuario.getTipoDoc());
            usuarioData.put("fechaNacimiento", usuario.getFechaNacimiento());
            usuarioData.put("fechaRegistro", usuario.getFechaRegistro());
            usuarioData.put("activo", usuario.isActivo());

            // ✅ CARGAR ROLES EXPLÍCITAMENTE
            if (usuario.getRoles() != null) {
                List<Map<String, Object>> rolesData = usuario.getRoles().stream()
                        .map(rol -> {
                            Map<String, Object> rolData = new HashMap<>();
                            rolData.put("id", rol.getId());
                            rolData.put("nombre", rol.getNombre());
                            rolData.put("descripcion", rol.getDescripcion());
                            return rolData;
                        })
                        .collect(Collectors.toList());
                usuarioData.put("roles", rolesData);
            } else {
                usuarioData.put("roles", new ArrayList<>());
            }

            return ResponseEntity.ok(usuarioData);

        } catch (Exception e) {
            System.err.println("Error en obtenerUsuario: " + e.getMessage());
            return ResponseEntity.status(500).build();
        }
    }

    @PostMapping("/usuarios/editar")
    public String editarUsuario(
            @RequestParam("id") Long id,
            @RequestParam("nombres") String nombres,
            @RequestParam("apellidoPaterno") String apellidoPaterno,
            @RequestParam(value = "apellidoMaterno", required = false) String apellidoMaterno,
            @RequestParam("correo") String correo,
            @RequestParam("user") String user, // ✅ AGREGAR CAMPO USER
            @RequestParam(value = "numero", required = false) String numero,
            @RequestParam(value = "genero", required = false) String genero,
            @RequestParam(value = "direccion1", required = false) String direccion1,
            @RequestParam(value = "direccion2", required = false) String direccion2,
            @RequestParam(value = "tipoDoc", required = false) String tipoDoc,
            HttpSession session,
            RedirectAttributes redirectAttributes) {

        if (!tienePermiso(session, "ROLE_SUPER_ADMIN")) {
            return "redirect:/acceso-denegado";
        }

        try {
            Usuario usuario = usuarioService.obtenerPorId(id)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            // Validaciones
            if (nombres == null || nombres.trim().isEmpty()) {
                redirectAttributes.addFlashAttribute("error", "El nombre es obligatorio");
                return "redirect:/superAdmin/usuarios";
            }

            if (apellidoPaterno == null || apellidoPaterno.trim().isEmpty()) {
                redirectAttributes.addFlashAttribute("error", "El apellido paterno es obligatorio");
                return "redirect:/superAdmin/usuarios";
            }

            if (correo == null || correo.trim().isEmpty()) {
                redirectAttributes.addFlashAttribute("error", "El correo es obligatorio");
                return "redirect:/superAdmin/usuarios";
            }

            if (user == null || user.trim().isEmpty()) {
                redirectAttributes.addFlashAttribute("error", "El usuario es obligatorio");
                return "redirect:/superAdmin/usuarios";
            }

            // Verificar si el correo ya existe en otro usuario
            if (!usuario.getCorreo().equals(correo) && usuarioService.existeCorreo(correo)) {
                redirectAttributes.addFlashAttribute("error", "El correo ya está registrado");
                return "redirect:/superAdmin/usuarios";
            }

            // Verificar si el usuario ya existe en otro usuario
            if (!usuario.getUser().equals(user) && usuarioService.existeUser(user)) {
                redirectAttributes.addFlashAttribute("error", "El nombre de usuario ya está registrado");
                return "redirect:/superAdmin/usuarios";
            }

            // Actualizar datos
            usuario.setNombres(nombres.trim());
            usuario.setApellidoPaterno(apellidoPaterno.trim());
            usuario.setApellidoMaterno(apellidoMaterno != null ? apellidoMaterno.trim() : null);
            usuario.setCorreo(correo.trim());
            usuario.setUser(user.trim()); // ✅ ACTUALIZAR USER
            usuario.setNumero(numero != null ? numero.trim() : null);
            usuario.setGenero(genero != null && !genero.isEmpty() ? genero : null);
            usuario.setDireccion1(direccion1 != null ? direccion1.trim() : null);
            usuario.setDireccion2(direccion2 != null ? direccion2.trim() : null);

            // Actualizar tipoDoc si se proporciona
            if (tipoDoc != null && !tipoDoc.isEmpty()) {
                try {
                    usuario.setTipoDoc(TipoDoc.valueOf(tipoDoc));
                } catch (IllegalArgumentException e) {
                    System.err.println("TipoDoc no válido: " + tipoDoc);
                }
            }

            usuarioService.actualizarUsuario(usuario);

            redirectAttributes.addFlashAttribute("success",
                    "Usuario '" + nombres + "' actualizado exitosamente");

        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error",
                    "Error al actualizar el usuario: " + e.getMessage());
            e.printStackTrace();
        }

        return "redirect:/superAdmin/usuarios";
    }

    @GetMapping("/usuarios/{id}/roles")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> obtenerUsuarioConRoles(@PathVariable Long id, HttpSession session) {
        if (!tienePermiso(session, "ROLE_SUPER_ADMIN")) {
            return ResponseEntity.status(403).build();
        }

        try {
            Optional<Usuario> usuarioOpt = usuarioService.obtenerPorId(id);
            if (usuarioOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Usuario usuario = usuarioOpt.get();

            // Crear respuesta con datos del usuario y sus roles
            Map<String, Object> response = new HashMap<>();
            response.put("id", usuario.getId());
            response.put("nombres", usuario.getNombres());
            response.put("apellidoPaterno", usuario.getApellidoPaterno());

            // Cargar roles
            if (usuario.getRoles() != null) {
                List<Map<String, Object>> rolesData = usuario.getRoles().stream()
                        .map(rol -> {
                            Map<String, Object> rolData = new HashMap<>();
                            rolData.put("id", rol.getId());
                            rolData.put("nombre", rol.getNombre());
                            rolData.put("descripcion", rol.getDescripcion());
                            return rolData;
                        })
                        .collect(Collectors.toList());
                response.put("roles", rolesData);
            } else {
                response.put("roles", new ArrayList<>());
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error en obtenerUsuarioConRoles: " + e.getMessage());
            return ResponseEntity.status(500).build();
        }
    }

    @PostMapping("/usuarios/{id}/cambiar-estado")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> cambiarEstadoUsuario(
            @PathVariable Long id,
            HttpSession session) {

        if (!tienePermiso(session, "ROLE_SUPER_ADMIN")) {
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "Sin permisos"));
        }

        try {
            Usuario usuarioActual = (Usuario) session.getAttribute("usuario");

            // No permitir que el super admin se inhabilite a sí mismo
            if (usuarioActual.getId().equals(id)) {
                return ResponseEntity.status(400).body(Map.of(
                    "success", false,
                    "message", "No puedes cambiar tu propio estado"
                ));
            }

            Usuario usuario = usuarioService.obtenerPorId(id)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            // Cambiar el estado
            usuario.setActivo(!usuario.isActivo());
            usuarioService.actualizarUsuario(usuario);

            String estado = usuario.isActivo() ? "habilitado" : "inhabilitado";

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Usuario " + estado + " correctamente",
                "activo", usuario.isActivo()
            ));

        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of(
                "success", false,
                "message", "Error al cambiar estado: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/usuarios/eliminar/{id}")
    public String eliminarUsuario(
            @PathVariable Long id,
            HttpSession session,
            RedirectAttributes redirectAttributes) {

        if (!tienePermiso(session, "ROLE_SUPER_ADMIN")) {
            return "redirect:/acceso-denegado";
        }

        try {
            Usuario usuarioActual = (Usuario) session.getAttribute("usuario");

            // No permitir que el super admin se elimine a sí mismo
            if (usuarioActual.getId().equals(id)) {
                redirectAttributes.addFlashAttribute("error",
                        "No puedes eliminar tu propia cuenta");
                return "redirect:/superAdmin/usuarios";
            }

            Usuario usuario = usuarioService.obtenerPorId(id)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            String nombreUsuario = usuario.getNombres() + " " + usuario.getApellidoPaterno();

            usuarioService.eliminarUsuario(id);

            redirectAttributes.addFlashAttribute("success",
                    "Usuario '" + nombreUsuario + "' eliminado exitosamente");

        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error",
                    "Error al eliminar el usuario: " + e.getMessage());
            e.printStackTrace();
        }

        return "redirect:/superAdmin/usuarios";
    }

    // =========================================
    // 🔷 GESTIÓN DE ROLES
    // =========================================

    @Autowired
    private RolService rolService;

    @GetMapping("/roles")
    @Transactional(readOnly = true)
    public String gestionRoles(HttpSession session, Model model) {
        if (!tienePermiso(session, "ROLE_SUPER_ADMIN")) {
            return "redirect:/acceso-denegado";
        }

        Usuario usuario = (Usuario) session.getAttribute("usuario");
        model.addAttribute("usuario", usuario);

        try {
            // Obtener todos los roles
            List<Rol> roles = rolService.obtenerTodos();

            // Forzar la carga de relaciones LAZY dentro de la transacción
            for (Rol rol : roles) {
                if (rol.getUsuarios() != null) {
                    rol.getUsuarios().size(); // Fuerza carga de usuarios
                }
            }

            model.addAttribute("roles", roles);
        } catch (Exception e) {
            System.err.println("Error al cargar roles: " + e.getMessage());
            e.printStackTrace();
            model.addAttribute("roles", new ArrayList<>());
            model.addAttribute("error", "Error al cargar roles: " + e.getMessage());
        }

        return "superAdmin/gestion-roles";
    }

    @GetMapping("/roles/todos")
    @ResponseBody
    public ResponseEntity<List<Map<String, Object>>> obtenerTodosLosRoles(HttpSession session) {
        System.out.println("🔍 [DEBUG] Accediendo a /roles/todos");

        if (!tienePermiso(session, "ROLE_SUPER_ADMIN")) {
            System.out.println("❌ [DEBUG] Sin permisos para /roles/todos");
            return ResponseEntity.status(403).build();
        }

        try {
            List<Rol> roles = rolService.obtenerTodos();
            System.out.println("✅ [DEBUG] Roles encontrados: " + roles.size());

            // ✅ CREAR DTO MANUALMENTE para evitar problemas de serialización
            List<Map<String, Object>> rolesDTO = new ArrayList<>();

            for (Rol rol : roles) {
                Map<String, Object> rolData = new HashMap<>();
                rolData.put("id", rol.getId());
                rolData.put("nombre", rol.getNombre());
                rolData.put("descripcion", rol.getDescripcion());

                // ✅ Evitar la serialización de relaciones problemáticas
                if (rol.getPermisos() != null) {
                    List<Map<String, String>> permisosData = rol.getPermisos().stream()
                            .map(permiso -> {
                                Map<String, String> permisoData = new HashMap<>();
                                permisoData.put("id", permiso.getId().toString());
                                permisoData.put("codigo", permiso.getCodigo());
                                permisoData.put("descripcion", permiso.getDescripcion());
                                return permisoData;
                            })
                            .collect(Collectors.toList());
                    rolData.put("permisos", permisosData);
                } else {
                    rolData.put("permisos", new ArrayList<>());
                }

                rolesDTO.add(rolData);
            }

            System.out.println("✅ [DEBUG] Roles DTO creados: " + rolesDTO.size());
            return ResponseEntity.ok(rolesDTO);

        } catch (Exception e) {
            System.err.println("❌ [DEBUG] Error en /roles/todos: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/roles/{id}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> obtenerRol(@PathVariable Long id, HttpSession session) {
        if (!tienePermiso(session, "ROLE_SUPER_ADMIN")) {
            return ResponseEntity.status(403).build();
        }

        try {
            Optional<Rol> rol = rolService.obtenerPorId(id);
            if (rol.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Rol rolObj = rol.get();

            // Crear un mapa para evitar problemas de serialización
            Map<String, Object> rolData = new HashMap<>();
            rolData.put("id", rolObj.getId());
            rolData.put("nombre", rolObj.getNombre());
            rolData.put("descripcion", rolObj.getDescripcion());

            // Agregar permisos si existen
            if (rolObj.getPermisos() != null) {
                List<Map<String, String>> permisosData = rolObj.getPermisos().stream()
                        .map(permiso -> {
                            Map<String, String> permisoData = new HashMap<>();
                            permisoData.put("id", permiso.getId().toString());
                            permisoData.put("codigo", permiso.getCodigo());
                            permisoData.put("descripcion", permiso.getDescripcion());
                            return permisoData;
                        })
                        .collect(Collectors.toList());
                rolData.put("permisos", permisosData);
            } else {
                rolData.put("permisos", new ArrayList<>());
            }

            return ResponseEntity.ok(rolData);
        } catch (Exception e) {
            System.err.println("Error al obtener rol: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    @PostMapping("/roles/crear")
    public String crearRol(
            @RequestParam("nombre") String nombre,
            @RequestParam(value = "descripcion", required = false) String descripcion,
            HttpSession session,
            RedirectAttributes redirectAttributes) {

        if (!tienePermiso(session, "ROLE_SUPER_ADMIN")) {
            return "redirect:/acceso-denegado";
        }

        try {
            // Validación
            if (nombre == null || nombre.trim().isEmpty()) {
                redirectAttributes.addFlashAttribute("error", "El nombre del rol es obligatorio");
                return "redirect:/superAdmin/roles";
            }

            // Asegurar que empiece con ROLE_
            String nombreRol = nombre.trim();
            if (!nombreRol.startsWith("ROLE_")) {
                nombreRol = "ROLE_" + nombreRol;
            }

            // Verificar si ya existe
            if (rolService.existePorNombre(nombreRol)) {
                redirectAttributes.addFlashAttribute("error", "Ya existe un rol con ese nombre");
                return "redirect:/superAdmin/roles";
            }

            Rol nuevoRol = new Rol();
            nuevoRol.setNombre(nombreRol);
            nuevoRol.setDescripcion(descripcion != null ? descripcion.trim() : "");

            rolService.crearRol(nuevoRol);

            redirectAttributes.addFlashAttribute("success",
                    "Rol '" + nombreRol + "' creado exitosamente");

        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error",
                    "Error al crear el rol: " + e.getMessage());
            e.printStackTrace();
        }

        return "redirect:/superAdmin/roles";
    }

    @PostMapping("/roles/editar")
    public String editarRol(
            @RequestParam("id") Long id,
            @RequestParam(value = "descripcion", required = false) String descripcion,
            HttpSession session,
            RedirectAttributes redirectAttributes) {

        if (!tienePermiso(session, "ROLE_SUPER_ADMIN")) {
            return "redirect:/acceso-denegado";
        }

        try {
            Rol rol = new Rol();
            rol.setDescripcion(descripcion != null ? descripcion.trim() : "");

            rolService.actualizarRol(id, rol);

            redirectAttributes.addFlashAttribute("success",
                    "Rol actualizado exitosamente");

        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error",
                    "Error al actualizar el rol: " + e.getMessage());
            e.printStackTrace();
        }

        return "redirect:/superAdmin/roles";
    }

    @GetMapping("/roles/eliminar/{id}")
    public String eliminarRol(
            @PathVariable Long id,
            HttpSession session,
            RedirectAttributes redirectAttributes) {

        if (!tienePermiso(session, "ROLE_SUPER_ADMIN")) {
            return "redirect:/acceso-denegado";
        }

        try {
            Rol rol = rolService.obtenerPorId(id)
                    .orElseThrow(() -> new RuntimeException("Rol no encontrado"));

            String nombreRol = rol.getNombre();

            rolService.eliminarRol(id);

            redirectAttributes.addFlashAttribute("success",
                    "Rol '" + nombreRol + "' eliminado exitosamente");

        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error",
                    "Error al eliminar el rol: " + e.getMessage());
            e.printStackTrace();
        }

        return "redirect:/superAdmin/roles";
    }

    @PostMapping("/usuarios/{usuarioId}/asignar-rol/{rolId}")
    @ResponseBody
    public ResponseEntity<String> asignarRol(
            @PathVariable Long usuarioId,
            @PathVariable Long rolId,
            HttpSession session) {

        if (!tienePermiso(session, "ROLE_SUPER_ADMIN")) {
            return ResponseEntity.status(403).body("Sin permisos");
        }

        try {
            usuarioService.asignarRol(usuarioId, rolId);
            return ResponseEntity.ok("Rol asignado exitosamente");
        } catch (Exception e) {
            return ResponseEntity.status(400).body(e.getMessage());
        }
    }

    @PostMapping("/usuarios/{usuarioId}/remover-rol/{rolId}")
    @ResponseBody
    public ResponseEntity<String> removerRol(
            @PathVariable Long usuarioId,
            @PathVariable Long rolId,
            HttpSession session) {

        if (!tienePermiso(session, "ROLE_SUPER_ADMIN")) {
            return ResponseEntity.status(403).body("Sin permisos");
        }

        try {
            usuarioService.removerRol(usuarioId, rolId);
            return ResponseEntity.ok("Rol removido exitosamente");
        } catch (Exception e) {
            return ResponseEntity.status(400).body(e.getMessage());
        }
    }

    // =========================================
    // 🔷 GESTIÓN DE RESEÑAS
    // =========================================

    @Autowired
    private ResenaService resenaService;

    @GetMapping("/resenas")
    public String gestionResenas(HttpSession session, Model model) {
        if (!tienePermiso(session, "ROLE_SUPER_ADMIN")) {
            return "redirect:/acceso-denegado";
        }

        Usuario usuario = (Usuario) session.getAttribute("usuario");
        model.addAttribute("usuario", usuario);

        try {
            List<Resena> todasResenas = resenaService.obtenerTodasLasResenas();
            model.addAttribute("resenas", todasResenas);

            // Preparar DTOs para evitar problemas de lazy loading
            List<ResenaDTO> resenasDTO = todasResenas.stream()
                    .map(r -> new ResenaDTO(
                            r.getId(),
                            r.getCalificacion(),
                            r.getComentario(),
                            r.getEstado(),
                            r.getFecha(),
                            r.getUsuario().getId(),
                            r.getUsuario().getNombres() + " " + r.getUsuario().getApellidoPaterno(),
                            r.getProducto().getId(),
                            r.getProducto().getNombre()))
                    .toList();

            model.addAttribute("resenas", resenasDTO);

            // Estadísticas
            long pendientes = todasResenas.stream()
                    .filter(r -> "PENDIENTE".equals(r.getEstado()))
                    .count();
            long aprobadas = todasResenas.stream()
                    .filter(r -> "APROBADA".equals(r.getEstado()))
                    .count();
            long rechazadas = todasResenas.stream()
                    .filter(r -> "RECHAZADA".equals(r.getEstado()))
                    .count();

            model.addAttribute("pendientes", pendientes);
            model.addAttribute("aprobadas", aprobadas);
            model.addAttribute("rechazadas", rechazadas);

        } catch (Exception e) {
            model.addAttribute("resenas", new ArrayList<>());
            model.addAttribute("pendientes", 0);
            model.addAttribute("aprobadas", 0);
            model.addAttribute("rechazadas", 0);
            e.printStackTrace();
        }

        return "superAdmin/gestion-resenas";
    }

    @PostMapping("/resenas/cambiar-estado")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> cambiarEstadoResena(
            @RequestParam("id") Long id,
            @RequestParam("estado") String estado,
            HttpSession session) {

        Map<String, Object> response = new HashMap<>();

        if (!tienePermiso(session, "ROLE_SUPER_ADMIN")) {
            response.put("success", false);
            response.put("message", "Acceso denegado");
            return ResponseEntity.status(403).body(response);
        }

        try {
            System.out.println("📥 Cambiando estado de reseña - ID: " + id + ", Estado: " + estado);

            // Validar que el estado sea válido
            if (!"APROBADA".equals(estado) && !"RECHAZADA".equals(estado)) {
                response.put("success", false);
                response.put("message", "Estado no válido");
                return ResponseEntity.badRequest().body(response);
            }

            // Usar el método del servicio para cambiar el estado
            Resena resenaActualizada = resenaService.cambiarEstado(id, estado);

            // Preparar mensaje según la acción
            String mensaje;
            if ("APROBADA".equals(estado)) {
                mensaje = "✅ Reseña aprobada exitosamente. Ahora es visible para los clientes.";
            } else {
                mensaje = "❌ Reseña rechazada exitosamente. No será visible para los clientes.";
            }

            response.put("success", true);
            response.put("message", mensaje);
            response.put("estado", resenaActualizada.getEstado());

            System.out.println("✅ Estado cambiado exitosamente a: " + estado);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("❌ Error al cambiar estado de reseña: " + e.getMessage());
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Error al cambiar el estado de la reseña: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    @GetMapping("/resenas/obtener")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> obtenerResenas(HttpSession session) {
        if (!tienePermiso(session, "ROLE_SUPER_ADMIN")) {
            return ResponseEntity.status(403).build();
        }

        try {
            List<Resena> todasResenas = resenaService.obtenerTodasLasResenas();

            // Preparar DTOs para evitar problemas de lazy loading
            List<Map<String, Object>> resenasData = new ArrayList<>();
            for (Resena r : todasResenas) {
                Map<String, Object> resenaMap = new HashMap<>();
                resenaMap.put("id", r.getId());
                resenaMap.put("calificacion", r.getCalificacion());
                resenaMap.put("comentario", r.getComentario());
                resenaMap.put("estado", r.getEstado());
                resenaMap.put("fecha", r.getFecha());
                resenaMap.put("usuarioId", r.getUsuario().getId());
                resenaMap.put("usuarioNombre",
                        r.getUsuario().getNombres() + " " + r.getUsuario().getApellidoPaterno());
                resenaMap.put("productoId", r.getProducto().getId());
                resenaMap.put("productoNombre", r.getProducto().getNombre());
                resenasData.add(resenaMap);
            }

            // Estadísticas
            Map<String, Object> response = new HashMap<>();
            response.put("resenas", resenasData);
            response.put("pendientes", todasResenas.stream()
                    .filter(r -> "PENDIENTE".equals(r.getEstado())).count());
            response.put("aprobadas", todasResenas.stream()
                    .filter(r -> "APROBADA".equals(r.getEstado())).count());
            response.put("rechazadas", todasResenas.stream()
                    .filter(r -> "RECHAZADA".equals(r.getEstado())).count());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("Error al obtener reseñas: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    // DTO para evitar lazy loading en las vistas
    public static class ResenaDTO {
        private Long id;
        private Integer calificacion;
        private String comentario;
        private String estado;
        private java.time.LocalDateTime fecha;
        private Long usuarioId;
        private String usuarioNombre;
        private Integer productoId;
        private String productoNombre;

        public ResenaDTO(Long id, Integer calificacion, String comentario, String estado,
                java.time.LocalDateTime fecha, Long usuarioId, String usuarioNombre,
                Integer productoId, String productoNombre) {
            this.id = id;
            this.calificacion = calificacion;
            this.comentario = comentario;
            this.estado = estado;
            this.fecha = fecha;
            this.usuarioId = usuarioId;
            this.usuarioNombre = usuarioNombre;
            this.productoId = productoId;
            this.productoNombre = productoNombre;
        }

        // Getters
        public Long getId() {
            return id;
        }

        public Integer getCalificacion() {
            return calificacion;
        }

        public String getComentario() {
            return comentario;
        }

        public String getEstado() {
            return estado;
        }

        public java.time.LocalDateTime getFecha() {
            return fecha;
        }

        public Long getUsuarioId() {
            return usuarioId;
        }

        public String getUsuarioNombre() {
            return usuarioNombre;
        }

        public Integer getProductoId() {
            return productoId;
        }

        public String getProductoNombre() {
            return productoNombre;
        }
    }

    // =========================================
    // 🔷 GESTIÓN DE COMPRAS
    // =========================================

    @GetMapping("/compras")
    public String gestionCompras(HttpSession session, Model model) {
        if (!tienePermiso(session, "ROLE_SUPER_ADMIN")) {
            return "redirect:/acceso-denegado";
        }

        Usuario usuario = (Usuario) session.getAttribute("usuario");
        model.addAttribute("usuario", usuario);

        try {
            // Obtener todas las compras
            List<Compra> todasCompras = compraService.obtenerTodasLasCompras();
            model.addAttribute("compras", todasCompras);

            // Calcular estadísticas por estado
            long pendientes = todasCompras.stream()
                    .filter(c -> c.getEstado() == EstadoCompra.PENDIENTE)
                    .count();
            long confirmadas = todasCompras.stream()
                    .filter(c -> c.getEstado() == EstadoCompra.CONFIRMADA)
                    .count();
            long enviadas = todasCompras.stream()
                    .filter(c -> c.getEstado() == EstadoCompra.ENVIADA)
                    .count();
            long entregadas = todasCompras.stream()
                    .filter(c -> c.getEstado() == EstadoCompra.ENTREGADA)
                    .count();

            model.addAttribute("pendientes", pendientes);
            model.addAttribute("confirmadas", confirmadas);
            model.addAttribute("enviadas", enviadas);
            model.addAttribute("entregadas", entregadas);

        } catch (Exception e) {
            model.addAttribute("compras", new ArrayList<>());
            model.addAttribute("pendientes", 0L);
            model.addAttribute("confirmadas", 0L);
            model.addAttribute("enviadas", 0L);
            model.addAttribute("entregadas", 0L);
            model.addAttribute("error", "Error al cargar las compras: " + e.getMessage());
            e.printStackTrace();
        }

        return "superAdmin/gestion-compras";
    }

    @GetMapping("/compras/{id}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> obtenerDetalleCompra(@PathVariable Long id, HttpSession session) {
        if (!tienePermiso(session, "ROLE_SUPER_ADMIN")) {
            return ResponseEntity.status(403).build();
        }

        try {
            Compra compra = compraService.obtenerCompraPorId(id);
            if (compra == null) {
                return ResponseEntity.notFound().build();
            }

            // Crear respuesta con datos completos
            Map<String, Object> response = new HashMap<>();
            response.put("id", compra.getId());
            response.put("fechaCompra", compra.getFechaCompra());
            response.put("subtotal", compra.getSubtotal());
            response.put("igv", compra.getIgv());
            response.put("costoEnvio", compra.getCostoEnvio());
            response.put("total", compra.getTotal());
            response.put("metodoPago", compra.getMetodoPago());
            response.put("estado", compra.getEstado().toString());
            response.put("direccionEntrega", compra.getDireccionEntrega());
            response.put("numeroSeguimiento", compra.getNumeroSeguimiento());
            response.put("motivoRechazo", compra.getMotivoRechazo());

            // Datos del usuario
            Map<String, Object> usuarioData = new HashMap<>();
            usuarioData.put("id", compra.getUsuario().getId());
            usuarioData.put("nombres", compra.getUsuario().getNombres());
            usuarioData.put("apellidoPaterno", compra.getUsuario().getApellidoPaterno());
            usuarioData.put("correo", compra.getUsuario().getCorreo());
            usuarioData.put("numero", compra.getUsuario().getNumero());
            response.put("usuario", usuarioData);

            // Detalles de productos
            List<Map<String, Object>> detallesData = new ArrayList<>();
            if (compra.getDetalles() != null) {
                for (DetalleCompra detalle : compra.getDetalles()) {
                    Map<String, Object> detalleMap = new HashMap<>();
                    detalleMap.put("productoId", detalle.getProducto().getId());
                    detalleMap.put("productoNombre", detalle.getProducto().getNombre());
                    detalleMap.put("productoImagen", detalle.getProducto().getImagen());
                    detalleMap.put("cantidad", detalle.getCantidad());
                    detalleMap.put("precioUnitario", detalle.getPrecioUnitario());
                    detalleMap.put("subtotal", detalle.getSubtotal());
                    detallesData.add(detalleMap);
                }
            }
            response.put("detalles", detallesData);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("Error al obtener detalle de compra: " + e.getMessage());
            return ResponseEntity.status(500).build();
        }
    }

    @PostMapping("/compras/actualizar-estado")
    @ResponseBody
    public Map<String, Object> actualizarEstadoCompra(
            @RequestParam("id") Long id,
            @RequestParam("estado") String estado,
            @RequestParam(value = "numeroSeguimiento", required = false) String numeroSeguimiento,
            @RequestParam(value = "motivoRechazo", required = false) String motivoRechazo,
            HttpSession session) {

        Map<String, Object> respuesta = new HashMap<>();
        
        System.out.println("🔔 [SuperAdminController] POST /compras/actualizar-estado");
        System.out.println("   ID: " + id + ", Estado: '" + estado + "', Motivo: " + motivoRechazo);

        if (!tienePermiso(session, "ROLE_SUPER_ADMIN")) {
            respuesta.put("success", false);
            respuesta.put("error", "No tienes permiso para realizar esta acción");
            return respuesta;
        }

        try {
            EstadoCompra nuevoEstado = EstadoCompra.valueOf(estado);
            System.out.println("✅ Enum parseado correctamente: " + nuevoEstado);
            
            // ✅ USAR LA VERSIÓN CON VALIDACIÓN
            Compra compraActualizada = compraService.actualizarEstadoConValidacion(id, nuevoEstado, motivoRechazo);
            System.out.println("✅ Estado actualizado en BD: " + compraActualizada.getEstado());

            // Si el nuevo estado es ENVIADA y se proporcionó número de seguimiento
            if (nuevoEstado == EstadoCompra.ENVIADA && numeroSeguimiento != null
                    && !numeroSeguimiento.trim().isEmpty()) {
                compraService.asignarNumeroSeguimiento(id, numeroSeguimiento.trim());
                System.out.println("✅ Número de seguimiento asignado: " + numeroSeguimiento);
            }

            String mensaje = "Estado de compra #" + id + " actualizado a " + estado;
            if (nuevoEstado == EstadoCompra.CONFIRMADA) {
                mensaje += ". El stock de los productos ha sido actualizado.";
            } else if (nuevoEstado == EstadoCompra.RECHAZADA) {
                mensaje += ". Motivo: " + motivoRechazo;
            }

            respuesta.put("success", true);
            respuesta.put("message", mensaje);
            respuesta.put("nuevoEstado", compraActualizada.getEstado().toString());

        } catch (IllegalStateException e) {
            // Error de transición de estado
            respuesta.put("success", false);
            respuesta.put("error", "❌ " + e.getMessage());
            System.out.println("❌ Error de transición: " + e.getMessage());
        } catch (IllegalArgumentException e) {
            // Error de validación (motivo faltante, etc)
            respuesta.put("success", false);
            respuesta.put("error", "⚠️ " + e.getMessage());
            System.out.println("⚠️ Error de validación: " + e.getMessage());
        } catch (Exception e) {
            respuesta.put("success", false);
            respuesta.put("error", "Error al actualizar el estado: " + e.getMessage());
            e.printStackTrace();
            System.out.println("❌ Error Exception: " + e.getMessage());
        }

        return respuesta;
    }

    @PostMapping("/compras/rechazar")
    @ResponseBody
    public Map<String, Object> rechazarCompra(
            @RequestParam("id") Long id,
            @RequestParam("motivo") String motivo,
            HttpSession session) {

        Map<String, Object> respuesta = new HashMap<>();
        
        System.out.println("❌ [SuperAdminController] POST /compras/rechazar");
        System.out.println("   ID: " + id + ", Motivo: " + motivo);

        if (!tienePermiso(session, "ROLE_SUPER_ADMIN")) {
            respuesta.put("success", false);
            respuesta.put("error", "No tienes permiso para realizar esta acción");
            return respuesta;
        }

        try {
            Compra compraActualizada = compraService.rechazarCompra(id, motivo);
            
            respuesta.put("success", true);
            respuesta.put("message", "Compra rechazada exitosamente. Motivo: " + motivo);
            respuesta.put("nuevoEstado", compraActualizada.getEstado().toString());

        } catch (IllegalStateException e) {
            respuesta.put("success", false);
            respuesta.put("error", "❌ " + e.getMessage());
        } catch (IllegalArgumentException e) {
            respuesta.put("success", false);
            respuesta.put("error", "⚠️ " + e.getMessage());
        } catch (Exception e) {
            respuesta.put("success", false);
            respuesta.put("error", "Error al rechazar la compra: " + e.getMessage());
            e.printStackTrace();
        }

        return respuesta;
    }

    @GetMapping("/compras/eliminar/{id}")
    public String eliminarCompra(
            @PathVariable Long id,
            HttpSession session,
            RedirectAttributes redirectAttributes) {

        if (!tienePermiso(session, "ROLE_SUPER_ADMIN")) {
            return "redirect:/acceso-denegado";
        }

        try {
            Compra compra = compraService.obtenerCompraPorId(id);
            if (compra == null) {
                redirectAttributes.addFlashAttribute("error", "Compra no encontrada");
                return "redirect:/superAdmin/compras";
            }

            // Las compras nunca se eliminan, se rechazan
            redirectAttributes.addFlashAttribute("info",
                    "La eliminación física de compras está deshabilitada. Usa la opción de RECHAZAR para cancelar una compra.");

        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error",
                    "Error: " + e.getMessage());
            e.printStackTrace();
        }

        return "redirect:/superAdmin/compras";
    }

    // =========================================
    // 🔷 MÉTODOS AUXILIARES PARA IMÁGENES
    // =========================================

    /**
     * Guarda una imagen en el servidor y retorna la ruta relativa
     */
    private String guardarImagen(MultipartFile file, String uploadDir, String urlPrefix) throws IOException {
        if (file.isEmpty()) {
            return null;
        }

        // Crear directorio si no existe
        File directorio = new File(uploadDir);
        if (!directorio.exists()) {
            directorio.mkdirs();
        }

        // Generar nombre único para el archivo
        String nombreOriginal = file.getOriginalFilename();
        String extension = nombreOriginal.substring(nombreOriginal.lastIndexOf("."));
        String nombreUnico = UUID.randomUUID().toString() + extension;

        // Guardar el archivo
        Path rutaCompleta = Paths.get(uploadDir + nombreUnico);
        Files.write(rutaCompleta, file.getBytes());

        // Retornar ruta relativa para la base de datos
        return urlPrefix + nombreUnico;
    }

    /**
     * Elimina una imagen del servidor
     */
    private void eliminarImagen(String rutaImagen, String uploadDir) {
        try {
            if (rutaImagen == null || rutaImagen.isEmpty()) {
                return;
            }

            // Extraer solo el nombre del archivo de la ruta
            String nombreArchivo = rutaImagen.substring(rutaImagen.lastIndexOf("/") + 1);
            Path rutaCompleta = Paths.get(uploadDir + nombreArchivo);

            System.out.println("Intentando eliminar archivo: " + rutaCompleta);

            if (Files.exists(rutaCompleta)) {
                Files.deleteIfExists(rutaCompleta);
                System.out.println("✅ Archivo eliminado: " + nombreArchivo);
            } else {
                System.out.println("⚠️ Archivo no existe: " + nombreArchivo);
            }
        } catch (IOException e) {
            System.err.println("❌ Error al eliminar imagen: " + e.getMessage());
            e.printStackTrace();
        }
    }
}